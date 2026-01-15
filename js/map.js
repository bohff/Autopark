const mapDiv = document.getElementById('map');
const panelDiv = document.getElementById('directionPanel');

let map;
let userMarker;
let directionsService;
let directionsRenderer;

let routeSteps = [];
let currentStepIndex = 0;
let watchId = null;

let walkedPolyline;
let remainingPolyline;
let fullPath = [];
let destination = null;
let destinationMarker = null;

function distanceMeters(lat1, lng1, lat2, lng2) {
    return haversineDistanceKM(lat1, lng1, lat2, lng2) * 1000;
}

function showMap(userLatLng, destinationCoords) {
    document.getElementById('map').style.display = 'block';
    
    const btn = document.getElementById('stopBtn');
    if(btn) btn.style.display = 'block';

    destination = destinationCoords;

    mapDiv.style.display = 'block';
    panelDiv.innerHTML = "";

    map = new google.maps.Map(mapDiv, {
        center: userLatLng,
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: true
    });

    userMarker = new google.maps.Marker({
        position: userLatLng,
        map,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#4285f4",
            fillOpacity: 1,
            strokeColor: "#fff",
            strokeWeight: 2
        }
    });

    if (destinationMarker) {
        destinationMarker.setMap(null);
    }

    destinationMarker = new google.maps.Marker({
        position: destinationCoords,
        map,
        label: {
            text: "P",
            color: "white",
            fontWeight: "bold",
            fontSize: "14px"
        },
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#0055FF",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2
        }
    });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        map,
        panel: panelDiv,
        suppressPolylines: true,
        suppressMarkers: true
    });

    calculateRoute(userLatLng, destination);
}

async function calculateRoute(origin, destination) {
    try {
        const response = await directionsService.route({
            origin,
            destination,
            travelMode: google.maps.TravelMode.DRIVING
        });

        if (!response.routes.length) return;

        directionsRenderer.setDirections(response);

        const legs = response.routes[0].legs[0];
        routeSteps = legs.steps;
        currentStepIndex = 0;

        const overview = response.routes[0].overview_path;
        fullPath = overview.filter(p => p !== null).map(normalizeLatLng);

        initializePolylines();
        updatePolylines(origin);
        startRealtimeTracking();
    } catch (error) {

        if (error.message && error.message.includes('OVER_QUERY_LIMIT')) {
            showRouteError(t('error.google_quota'));
        } else {
            showRouteError(t('nav.error_calculation'));
        }
    }
}

function initializePolylines() {
    if (walkedPolyline) walkedPolyline.setMap(null);
    if (remainingPolyline) remainingPolyline.setMap(null);

    walkedPolyline = new google.maps.Polyline({map, strokeColor: "#888888", strokeWeight: 6, zIndex: 2, path: []});
    remainingPolyline = new google.maps.Polyline({map, strokeColor: "#1a73e8", strokeWeight: 6, zIndex: 3, path: fullPath});
}

function showRouteError(message) {
    panelDiv.innerHTML = `
        <div style="padding: 15px; background: #ffebee; border-radius: 8px; color: #c62828;">
            <strong>${t('nav.error_title')}</strong><br/>
            ${message}
        </div>
    `;
}

function updatePolylines(userPos) {
    let closestIndex = 0
    let minDist = Infinity;
    fullPath.forEach((p, i) => {
      const d = distanceMeters(userPos.lat, userPos.lng, p.lat, p.lng);
      if (d < minDist) {
        minDist = d;
        closestIndex = i;
      }
    });
    walkedPolyline.setPath(fullPath.slice(0,closestIndex+1));
    remainingPolyline.setPath(fullPath.slice(closestIndex));
}

function startRealtimeTracking() {
    if (watchId !== null) return;
    watchId = navigator.geolocation.watchPosition(
        pos => {
            const userPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            userMarker.setPosition(userPos);
            updatePolylines(userPos);
            followRoute(userPos);
        },
        err => console.error(err),
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

function stopRealtimeTracking() {
    if (watchId !== null) { navigator.geolocation.clearWatch(watchId); watchId = null; }
}

function getDistanceToRoute(userPos) {
    let minDist = Infinity;
    fullPath.forEach(p => {
        const d = distanceMeters(userPos.lat, userPos.lng, p.lat, p.lng);
        if (d < minDist) {
            minDist = d;
        }
    });
    return minDist;
}

function followRoute(userPos){
    if (!routeSteps.length || currentStepIndex >= routeSteps.length) return;
    const step = routeSteps[currentStepIndex];
    const start = normalizeLatLng(step.start_location);
    const end = normalizeLatLng(step.end_location);

    const distToDest = distanceMeters(userPos.lat, userPos.lng, destination.lat, destination.lng);
    if (distToDest < 20) {
        onArrived();
        stopRealtimeTracking();
        return;
    }
        
    if (!start || !end) {
      currentStepIndex++;
      return;
    }

    const distToEnd = distanceMeters(userPos.lat, userPos.lng, end.lat, end.lng);
    if (distToEnd < 20) {
      currentStepIndex++;
      return;
    }

    const distToRoute = getDistanceToRoute(userPos);
    if (distToRoute > 40) {
        recalcRoute(userPos);
        return;
    }
}

function onArrived() {
    if (walkedPolyline) {
        walkedPolyline.setMap(null);
        walkedPolyline = null;
    }
    if (remainingPolyline) {
        remainingPolyline.setMap(null);
        remainingPolyline = null;
    }
    if (panelDiv) {
        panelDiv.innerHTML = `
            <strong>${t('nav.arrived')}</strong><br/>
            ${t('nav.thanks')}
        `;
    }
}

function recalcRoute(userPos){
    stopRealtimeTracking();
    calculateRoute(userPos, destination);
}

