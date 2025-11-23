async function getUserAccurateLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            return reject(new Error("Géolocalisation non supportée"));
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy
                });
            },
            (error) => reject(error),
            {
                enableHighAccuracy: true,
                maximumAge: 0,
                timeout: 10000
            }
        );
    });
}

async function geocodeAddress(address) {
    const searchQuery = address + ', Metz, France';
    const url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=fr&q=' + encodeURIComponent(searchQuery);

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Erreur HTTP: ${res.status}`);

    const jsonRes = await res.json();
    if (jsonRes.length === 0) throw new Error("Adresse introuvable")

    // jsonRes[0].lat This call returns a string

    const LatLng = {lat: parseFloat(jsonRes[0].lat), lng: parseFloat(jsonRes[0].lon)}
    return LatLng;
}

function buildGoogleMapsURL(origin, destination) {
  const originString = origin.lat + ',' + origin.lng;
  const destinationString = destination.lat + ',' + destination.lng;
  
  return 'https://www.google.com/maps/dir/?api=1&origin=' + encodeURIComponent(originString) +
         '&destination=' + encodeURIComponent(destinationString) + '&travelmode=driving';
}

async function fetchParkings() {
  const url = 'https://maps.eurometropolemetz.eu/public/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=public:pub_tsp_sta&srsName=EPSG:4326&outputFormat=application%2Fjson';
  
  const res = await fetch(url);

  if (!res.ok) throw new Error(`Erreur HTTP: ${res.status}`);

  const resJson = await res.json();

  return resJson.features;
}

async function getCloseParkings(userCoords) {
// const userCoords = {lat: 49.119682, lng: 6.1589498, accuracy: 14.762};
  const parkingList = await fetchParkings();

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
    const service = new google.maps.DistanceMatrixService();
    service.getDistanceMatrix({
        origins: [formattedUserCoords],
        destinations: formattedDestinations,
        travelMode: google.maps.TravelMode.DRIVING,
    }, (response, status) => {
        if (status === 'OK') {
        for (let i=0; i< 25; i++) {
            getDistanceMatrixParkings.push({distance: response.rows[0].elements[i].distance.value, indice: i, coords: {lat:destinationsArray[i].lat, lng:destinationsArray[i].lng}, parkingDetails: destinationsArray[i].parkingDetails})
        }
        getDistanceMatrixParkings.sort((a,b) => a.distance - b.distance);
        
        const closeParkings = getDistanceMatrixParkings.slice(0,5);
        resolve({response, closeParkings});
        } else {
        reject(new Error('Erreur:', status))
        }
    });
  })
}