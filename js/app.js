const gpsButton = document.getElementById('gpsButton');
const addressButton = document.getElementById('addressButton');
const addressInput = document.getElementById('addressInput');
const result = document.getElementById('result');
const formContainer = document.getElementById('formContainer');

let mode = null;

gpsButton.addEventListener('click', onLocate);
addressButton.addEventListener('click', onAddress);

function showParkingResult({response, closeParkings}, userCoords) {
    // Cacher le formulaire
    formContainer.style.display = 'none';

    let content = `<h3>Position actuelle : ${response.originAddresses[0]}</h3>`;
    content += `<p><strong>Voici les 5 parkings les plus proches :</strong></p>`;

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
        <div class="parkingItem" style="border:1px solid #ccc; padding:10px; border-radius:8px; margin-bottom:10px;">
            <h4>${destAddress}</h4>
            <p><strong>Distance :</strong> ${distance} mètres</p>
            <p><strong>Durée estimée :</strong> ${duration}</p>
            <p><strong>Tarification :</strong> ${ pricing ? capitalizeFirstLetter(pricing) : "Non renseigné"}</p>
            <p><strong>Type :</strong> ${ type ? capitalizeFirstLetter(type) : "Non renseigné"}</p>
            ${freePlaces && totalPlaces ? `<p><strong>Places totales :</strong> ${totalPlaces}</p>
            <p><strong>Places libres :</strong> ${freePlaces}</p>`: `<p style="color:gray;">Disponibilité non vérifiable</p>`}
            ${mode !== "address" ? `<button class="showMapBtn">Y aller</button>` : ""}
            <a href="${mapsURL}" target="_blank"><button>Itinéraire Google Maps</button></a>
        </div>
        `;
    }

    result.innerHTML = content;
    result.style.display = 'block';

    document.querySelectorAll('.showMapBtn').forEach((btn, index) => {
        const parking = closeParkings[index];
        btn.addEventListener('click', () => {
            // Cacher la liste des parkings
            result.style.display = 'none';
            // Lancer la map et le guidage
            showMap(userCoords, parking.coords);
        });
    });
}

async function onLocate() {
    mode = "gps";
    result.textContent = 'Localisation (tentatives en cours)...';
    try {
        const userLocation = await getUserAccurateLocation();
        if (userLocation === null) {
            result.innerHTML ='<p>Erreur : Impossible d\'obtenir votre localisation. Vérifiez vos permissions ou réessayez.</p>';
            return;
        }
        const parkingResult = await getCloseParkings(userLocation);
        showParkingResult(parkingResult, userLocation);
    } catch(error) {
        result.innerHTML = '<p class="error">' + error.message + '</p>';
    }
}

async function onAddress() {
    mode = "address";
    const address = addressInput.value.trim();
    if (!address) {
        result.innerHTML = '<p class="error">Adresse manquante.</p>';
        return;
    }
    result.textContent = 'En cours de géocodage...'
    try {
        const userLocation = await geocodeAddress(address);
        const parkingResult = await getCloseParkings(userLocation);
        showParkingResult(parkingResult, userLocation);
    } catch (error) {
        result.innerHTML = '<p class="error">' + error.message + '</p>';
    }
}