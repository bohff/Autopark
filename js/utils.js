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