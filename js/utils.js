const gpsButton = document.getElementById('gpsButton');
const addressButton = document.getElementById('addressButton');
const addressInput = document.getElementById('addressInput');
const result = document.getElementById('result');

function getUserLocation() {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const LatLng = {lat: position.coords.latitude, lng: position.coords.longitude, accuracy: position.coords.accuracy};
                    resolve(LatLng)
                },
                (error) => {
                    reject(error);
                }
            )
        } else {
            reject(new Error('Géolocation non supportée'))
        }
    })
}

async function getUserAccurateLocation() {
    let bestPosition = null;
    for (let i=0; i<= 9; i++) {
        const position = await getUserLocation();

        if (bestPosition === null || position.accuracy < bestPosition.accuracy) {
            bestPosition = position;
        }

        if (bestPosition && bestPosition.accuracy < 150) {
            return bestPosition;
        }

        if (i === 9) {
            throw new Error('Précision insuffisante (< ' + 150 + ' m). Meilleure: ' + Math.round(bestPosition.accuracy) + ' m après ' + (i+1) + ' tentatives.');
        }
    }
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
  const url = 'https://maps.eurometropolemetz.eu/public/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=public:pub_tsp_sta&srsName=EPSG:4326&outputFormat=application%2Fjson&cql_lter=id%20is%20not%20null';
  
  const res = await fetch(url);

  if (!res.ok) throw new Error(`Erreur HTTP: ${res.status}`);

  const resJson = await res.json();

  return resJson.features;
}

function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Returns the distance between two positions using the Earth's radius
// https://stackoverflow.com/questions/14560999/using-the-haversine-formula-in-javascript
function haversineDistanceKM(lat1Deg, lon1Deg, lat2Deg, lon2Deg) {
    function toRad(degree) {
        return degree * Math.PI / 180;
    }
    
    const lat1 = toRad(lat1Deg);
    const lon1 = toRad(lon1Deg);
    const lat2 = toRad(lat2Deg);
    const lon2 = toRad(lon2Deg);
    
    const { sin, cos, sqrt, atan2 } = Math;
    
    const R = 6371; // earth radius in km 
    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;
    const a = sin(dLat / 2) * sin(dLat / 2)
            + cos(lat1) * cos(lat2)
            * sin(dLon / 2) * sin(dLon / 2);
    const c = 2 * atan2(sqrt(a), sqrt(1 - a)); 
    const d = R * c;
    return d; // distance in km
}


function formatDestinationForDistanceMatrixAPI(destinationsArray) {
  // destinationsArray = [{lat: ..., lng: ...}, {}]
  return destinationsArray
  .map(({lat, lng}) => `${lat},${lng}`)
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


  function showParkingResult({response, closeParkings}, userCoords) {
   let content = `<h3>Position actuelle : ${response.originAddresses[0]}</h3>`;

  for (const parking of closeParkings) {
    const destAddress = response.destinationAddresses[parking.indice];
    const distance = response.rows[0].elements[parking.indice].distance.value;
    const duration = response.rows[0].elements[parking.indice].duration.text;
    const mapsURL = buildGoogleMapsURL(userCoords, parking.coords);
    const pricing = parking.parkingDetails.parking.properties.cout;
    const type = parking.parkingDetails.parking.properties.typ;
    const freePlaces = parking.parkingDetails.parking.properties.place_libre;
    const totalPlaces = parking.parkingDetails.parking.properties.place_total;

    content += `
      <div style="border:1px solid #ccc; padding:10px; border-radius:8px;">
        <h4>${destAddress}</h4>
        <p><strong>Distance :</strong> ${distance} mètres</p>
        <p><strong>Durée estimée :</strong> ${duration}</p>
        <p><strong>Tarification :</strong> ${ pricing ? capitalizeFirstLetter(pricing) : "Non renseigné"}</p>
        <p><strong>Type :</strong> ${ type ? capitalizeFirstLetter(type) : "Non renseigné"}</p>
        ${freePlaces && totalPlaces ? `<p><strong>Places totales :</strong> ${totalPlaces}</p>
         <p><strong>Places libres :</strong> ${freePlaces}</p>`: `<p style="color:gray;">Disponibilité non vérifiable</p>`}
    <button class="showMapBtn">Voir sur la carte</button>
        <a href="${mapsURL}" target="_blank"><button>Itinéraire Google Maps</button></a>
      </div>
    `;
  }

  result.innerHTML = content;

  document.querySelectorAll('.showMapBtn').forEach((btn, index) => {
    const parking = closeParkings[index];
    btn.addEventListener('click', () => showMap(userCoords, parking.coords));
});

  }