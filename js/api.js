async function getUserAccurateLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            return reject(new Error("error.geolocation"));
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    isDefault: false
                });
            },
            (error) => {
                console.warn(`Erreur géolocalisation (${error.code}): ${error.message}`);
                reject(new Error("error.geolocation"));
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
    // Ajout de 'addressdetails=1' pour avoir plus d'infos sur la ville
    const url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&q=' + encodeURIComponent(address);

    const res = await fetch(url);
    if (!res.ok) throw new Error('error.api_error');

    const jsonRes = await res.json();
    if (jsonRes.length === 0) throw new Error('error.address_not_found');

    const LatLng = {lat: parseFloat(jsonRes[0].lat), lng: parseFloat(jsonRes[0].lon)};
    return LatLng;
}

async function reverseGeocode(lat, lng) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    
    const res = await fetch(url);
    if (!res.ok) throw new Error('error.api_error');
    
    const jsonRes = await res.json();
    return jsonRes;
}

//  FONCTION CORRIGÉE POUR BIG BEN & AUTRES 
async function detectCity(lat, lng) {
    const geoData = await reverseGeocode(lat, lng);
    const address = geoData.address;
    
    // Debug : permet de voir ce que l'API renvoie vraiment (F12 > Console)
    console.log("📍 Données géographiques reçues :", address);

    
    
    const locationFields = [
        address.city,
        address.town,
        address.municipality,
        address.suburb,          
        address.neighbourhood,
        address.borough,         
        address.city_district,
        address.state_district,  
        address.county
    ].filter(val => val).map(val => val.toLowerCase()); 

    // Fonction utilitaire : vérifie si un de nos champs contient un mot clé
    const checkLocation = (keywords) => locationFields.some(field => 
        keywords.some(key => field.includes(key.toLowerCase()))
    );

    //  TEST METZ 
    if (checkLocation(['Metz'])) {
        return { city: 'metz' };
    }
    
    //  TEST LONDRES 
    const isUK = address.country_code === 'gb' || address.country === 'United Kingdom' || address.country === 'Royaume-Uni';
    
    if (isUK) {
        // Liste élargie pour Londres et ses quartiers
        const londonKeywords = [
            'london', 'londres', 'greater london', 'grand londres',
            'westminster', 'camden', 'islington', 'hackney', 'tower hamlets', 
            'greenwich', 'lewisham', 'southwark', 'lambeth', 'wandsworth', 
            'hammersmith', 'kensington', 'chelsea', 'bromley', 'croydon', 
            'sutton', 'merton', 'kingston', 'richmond', 'hounslow', 
            'hillingdon', 'harrow', 'brent', 'ealing', 'barnet', 
            'hertsmere', 'enfield'
        ];

        // Si l'adresse contient "London" OU un des quartiers (ex: Westminster)
        if (checkLocation(londonKeywords)) {
            return { city: 'london' };
        }
    }
    
    // Si on arrive ici, c'est que ce n'est ni Metz ni Londres
    console.warn("⚠️ Lieu non supporté. Champs analysés :", locationFields);
    throw new Error('error.city_not_supported');
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
  if (!res.ok) throw new Error('error.api_error');

  const resJson = await res.json();
  return resJson.features;
}

async function fetchParkingsLondon() {
  const url = 'https://api.tfl.gov.uk/Place/Type/CarPark?app_key=a4ede2ed3a0f4b2fa40a10a0e2de518b';
  
  const res = await fetch(url);
  if (!res.ok) throw new Error('error.api_error');

  const resJson = await res.json();

  // Transformer les données TfL au format attendu
  return resJson.map(parking => {
    const props = parking.additionalProperties || [];
    
    function getProp(key) {
      const prop = props.find(p => p.key === key);
      return prop ? prop.value : null;
    }
    
    const tarif = getProp('StandardTariffsCashDaily');
    const nbPlaces = getProp('NumberOfSpaces');
    const hasLift = getProp('Lifts');
    const maxHeight = getProp('MaxHeightMetres');
    
    let type = 'aérien';
    if (maxHeight || (hasLift && parseInt(hasLift) > 0)) {
      type = 'souterrain';
    }
    
    return {
      geometry: { coordinates: [parking.lon, parking.lat] },
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
  
  // Détecter la ville (peut lancer error.city_not_supported)
  const cityResult = await detectCity(userCoords.lat, userCoords.lng);
  
  // Récupérer les parkings selon la ville
  let parkingList;
  if (cityResult.city === 'metz') {
    parkingList = await fetchParkingsMetz();
  } else if (cityResult.city === 'london') {
    parkingList = await fetchParkingsLondon();
  }
  
  // Appliquer les filtres
  let filteredParkings = parkingList;

  if (userProfil && userProfil.tarification && userProfil.tarification !== 'tous') {
    filteredParkings = filteredParkings.filter(p => {
      const cout = (p.properties.cout || '').toLowerCase();
      const userTarif = userProfil.tarification.toLowerCase();
      return cout === userTarif;
    });
  }

  if (userProfil && userProfil.type_parking && userProfil.type_parking !== 'tous') {
    filteredParkings = filteredParkings.filter(p => {
      const typ = (p.properties.typ || '').toLowerCase();
      const userType = userProfil.type_parking.toLowerCase();
      return typ === userType;
    });
  }

  parkingList = filteredParkings;

  const parkingsAndDistances = [];

  for (let i=0; i<= parkingList.length-1; i++) {
    const p = parkingList[i];
    const distance = haversineDistanceKM(p.geometry.coordinates[1], p.geometry.coordinates[0], userCoords.lat, userCoords.lng);
    parkingsAndDistances.push({parking: p, distance: distance});
  }

  const sortedParkings = parkingsAndDistances.sort((a, b) => a.distance - b.distance).slice(0,25);

  const destinationsArray = sortedParkings.map(p => ({
      lat: p.parking.geometry.coordinates[1], 
      lng: p.parking.geometry.coordinates[0], 
      parkingDetails: p
  }));

  const formattedDestinations = formatDestinationForDistanceMatrixAPI(destinationsArray);
  const formattedUserCoords = `${userCoords.lat},${userCoords.lng}`;

  const getDistanceMatrixParkings = [];

  return new Promise((resolve, reject) => {
    // Timeout avec clé d'erreur
    const timeout = setTimeout(() => {
      reject(new Error('error.timeout'));
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
          reject(new Error('error.google_quota'));
        } else {
          reject(new Error('error.google_generic'));
        }
    });
  })
}