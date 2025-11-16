const mapDiv = document.getElementById('map');
const panelDiv = document.getElementById('directionPanel');

mapDiv.style.display = 'none';

function showMap(userLatLng, destinationCoords) {

  mapDiv.style.display = 'block';

  // Clean panelDiv
  panelDiv.innerHTML = "";

  // False later
  const map = new google.maps.Map(mapDiv, {mapTypeControl: false, streetViewControl: (true),})

  const directionsService = new google.maps.DirectionsService();
  const directionsRenderer = new google.maps.DirectionsRenderer({map, panel: panelDiv, polylineOptions: { strokeColor: '#1a73e8', strokeWeight: 6 },});

  origin = {lat: userLatLng.lat, lng: userLatLng.lng};
  destination = destinationCoords;

  directionsService.route(
    {
      origin,
      destination,
      travelMode: google.maps.TravelMode.DRIVING
    },
    (response, status) => {
      if (status === 'OK') {
        directionsRenderer.setDirections(response);
      } else {
        console.error('Erreur:', status);
      }
    }
  );
}