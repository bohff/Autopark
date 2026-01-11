async function getUserAccurateLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            return reject(new Error("Géolocalisation non supportée par votre navigateur"));
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy
                });
            },
            (error) => {
                // Messages d'erreur plus clairs
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        reject(new Error("Vous avez refusé l'accès à la localisation. Autorisez-la dans les paramètres de votre navigateur."));
                        break;
                    case error.POSITION_UNAVAILABLE:
                        reject(new Error("Position indisponible. Vérifiez que le GPS est activé."));
                        break;
                    case error.TIMEOUT:
                        reject(new Error("Délai dépassé. Réessayez ou utilisez une adresse."));
                        break;
                    default:
                        reject(new Error("Erreur de localisation inconnue."));
                }
            },
            {
                enableHighAccuracy: true,
                maximumAge: 0,
                timeout: 10000
            }
        );
    });
}

async function geocodeAddress(address) {
    const url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(address);

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Erreur HTTP: ${res.status}`);

    const jsonRes = await res.json();
    if (jsonRes.length === 0) throw new Error("Adresse introuvable")

    // jsonRes[0].lat This call returns a string

    const LatLng = {lat: parseFloat(jsonRes[0].lat), lng: parseFloat(jsonRes[0].lon)}
    return LatLng;
}

async function reverseGeocode(lat, lng) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Erreur HTTP: ${res.status}`);
    
    const jsonRes = await res.json();
    return jsonRes;
}

async function detectCity(lat, lng) {
    const geoData = await reverseGeocode(lat, lng);
    const address = geoData.address;
    
    // Récupérer le nom de la ville
    const ville = address.city || address.town || address.municipality || '';
    const county = address.county || '';
    const state = address.state || '';
    
    // Metz
    if (ville === 'Metz') {
        return { city: 'metz' };
    }
    
    // Londres - inclut tous les boroughs (supporte FR et EN)
    const isUK = address.country_code === 'gb' || address.country === 'United Kingdom' || address.country === 'Royaume-Uni';
    const londonBoroughs = ['Westminster', 'Camden', 'Islington', 'Hackney', 'Tower Hamlets', 'Greenwich', 'Lewisham', 'Southwark', 'Lambeth', 'Wandsworth', 'Hammersmith', 'Kensington', 'Chelsea', 'Bromley', 'Croydon', 'Sutton', 'Merton', 'Kingston', 'Richmond', 'Hounslow', 'Hillingdon', 'Harrow', 'Brent', 'Ealing', 'Barnet', 'Hertsmere', 'Enfield'];
    
    if (isUK && (
        ville === 'London' || ville === 'Londres' ||
        londonBoroughs.some(borough => ville.includes(borough))
    )) {
        return { city: 'london' };
    }
    
    // Ville non supportée - on garde le nom pour le message d'erreur
    return { city: null, detectedName: ville || county || 'Inconnue' };
}

function buildGoogleMapsURL(origin, destination) {
  const originString = origin.lat + ',' + origin.lng;
  const destinationString = destination.lat + ',' + destination.lng;
  
  return 'https://www.google.com/maps/dir/?api=1&origin=' + encodeURIComponent(originString) +
         '&destination=' + encodeURIComponent(destinationString) + '&travelmode=driving';
}

async function fetchParkingsMetz() {
  const url = 'https://maps.eurometropolemetz.eu/public/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=public:pub_tsp_sta&srsName=EPSG:4326&outputFormat=application%2Fjson';
  
  const res = await fetch(url);

  if (!res.ok) throw new Error(`Erreur HTTP: ${res.status}`);

  const resJson = await res.json();

  return resJson.features;
}

async function fetchParkingsLondon() {
  const url = 'https://api.tfl.gov.uk/Place/Type/CarPark?app_key=a4ede2ed3a0f4b2fa40a10a0e2de518b';
  
  const res = await fetch(url);

  if (!res.ok) throw new Error(`Erreur HTTP: ${res.status}`);

  const resJson = await res.json();

  // Transformer les données TfL au format attendu
  return resJson.map(parking => {
    // Extraire les infos des additionalProperties
    const props = parking.additionalProperties || [];
    
    function getProp(key) {
      const prop = props.find(p => p.key === key);
      return prop ? prop.value : null;
    }
    
    const tarif = getProp('StandardTariffsCashDaily');
    const nbPlaces = getProp('NumberOfSpaces');
    const hasLift = getProp('Lifts');
    const maxHeight = getProp('MaxHeightMetres');
    
    // Déterminer le type : si hauteur max ou ascenseur, c'est probablement couvert
    let type = 'aérien'; // Par défaut extérieur
    if (maxHeight || (hasLift && parseInt(hasLift) > 0)) {
      type = 'souterrain';
    }
    
    return {
      geometry: {
        coordinates: [parking.lon, parking.lat]
      },
      properties: {
        nom: parking.commonName,
        lib: parking.commonName,
        typ: type,
        cout: tarif ? 'payant' : 'gratuit',
        tarif_journalier: tarif ? `${tarif}£` : null,
        place_libre: null,
        place_total: nbPlaces ? parseInt(nbPlaces) : null
      }
    };
  });
}

async function getCloseParkings(userCoords, userProfil = null) {
// const userCoords = {lat: 49.119682, lng: 6.1589498, accuracy: 14.762};
  
  // Détecter la ville
  const cityResult = await detectCity(userCoords.lat, userCoords.lng);
  
  if (cityResult.city === null) {
    throw new Error(`Votre ville (${cityResult.detectedName}) n'est pas prise en charge par notre application. Actuellement, seules les villes de Metz et Londres sont disponibles.`);
  }
  
  // Récupérer les parkings selon la ville
  let parkingList;
  if (cityResult.city === 'metz') {
    parkingList = await fetchParkingsMetz();
  } else if (cityResult.city === 'london') {
    parkingList = await fetchParkingsLondon();
  }
  
  // Appliquer les filtres de préférences utilisateur
  let filteredParkings = parkingList;

  // Filtre par tarification
  if (userProfil && userProfil.tarification && userProfil.tarification !== 'tous') {
    filteredParkings = filteredParkings.filter(p => {
      const cout = (p.properties.cout || '').toLowerCase();
      const userTarif = userProfil.tarification.toLowerCase();
      return cout === userTarif;
    });
  }

  // Filtre par type de parking
  if (userProfil && userProfil.type_parking && userProfil.type_parking !== 'tous') {
    filteredParkings = filteredParkings.filter(p => {
      const typ = (p.properties.typ || '').toLowerCase();
      const userType = userProfil.type_parking.toLowerCase();
      return typ === userType;
    });
  }

  // Utiliser les parkings filtrés (tous les filtres appliqués)
  parkingList = filteredParkings;

  const parkingsAndDistances = [];

  for (let i=0; i<= parkingList.length-1; i++) {
    const parking = parkingList[i];
    const parkingLng = parkingList[i].geometry.coordinates[0];
    const parkingLat = parkingList[i].geometry.coordinates[1];

    const distance = haversineDistanceKM(parkingLat, parkingLng, userCoords.lat, userCoords.lng);

    parkingsAndDistances.push({parking: parking, distance: distance});
  }

  const sortedParkings = parkingsAndDistances.sort((a, b) => a.distance - b.distance).slice(0,25);

  const destinationsArray = [];

  for (let i=0; i<= sortedParkings.length-1; i++) {
    const parking = sortedParkings[i];
    const parkingLng = parking.parking.geometry.coordinates[0];
    const parkingLat = parking.parking.geometry.coordinates[1];

    destinationsArray.push({lat: parkingLat, lng: parkingLng, parkingDetails: parking});
  }

  const formattedDestinations = formatDestinationForDistanceMatrixAPI(destinationsArray);
  const formattedUserCoords = `${userCoords.lat},${userCoords.lng}`;

  const getDistanceMatrixParkings = [];

  return new Promise((resolve, reject) => {
    // Timeout de 15 secondes pour éviter le blocage infini
    const timeout = setTimeout(() => {
      reject(new Error('Délai dépassé. Le service Google Maps ne répond pas. Réessayez.'));
    }, 15000);
    
    const service = new google.maps.DistanceMatrixService();
    service.getDistanceMatrix({
        origins: [formattedUserCoords],
        destinations: formattedDestinations,
        travelMode: google.maps.TravelMode.DRIVING,
    }, (response, status) => {
        clearTimeout(timeout);
        
        if (status === 'OK') {
          for (let i=0; i < destinationsArray.length; i++) {
            if (response.rows[0].elements[i] && response.rows[0].elements[i].distance) {
              getDistanceMatrixParkings.push({
                distance: response.rows[0].elements[i].distance.value, 
                indice: i, 
                coords: {lat: destinationsArray[i].lat, lng: destinationsArray[i].lng}, 
                parkingDetails: destinationsArray[i].parkingDetails
              });
            }
          }
          getDistanceMatrixParkings.sort((a,b) => a.distance - b.distance);
          
          const closeParkings = getDistanceMatrixParkings.slice(0,5);
          resolve({response, closeParkings});
        } else if (status === 'OVER_QUERY_LIMIT') {
          reject(new Error('Quota Google Maps dépassé. Réessayez dans quelques secondes.'));
        } else {
          reject(new Error('Erreur Google Maps: ' + status));
        }
    });
  })
}
