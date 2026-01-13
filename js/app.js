const gpsButton = document.getElementById('gpsButton');
const addressButton = document.getElementById('addressButton');
const addressInput = document.getElementById('addressInput');
const result = document.getElementById('result');
const formContainer = document.getElementById('formContainer');

let mode = null;
let userProfil = null;
let currentUser = null;

// Charger le profil utilisateur depuis MongoDB
async function loadUserProfil() {
    // Valeurs par défaut
    userProfil = {
        tarification: 'tous',
        type_parking: 'tous',
        darkmode: false
    };
    
    if (isLoggedIn()) {
        try {
            const profil = await getProfil();
            userProfil = {
                tarification: profil.tarification || 'tous',
                type_parking: profil.type_parking || 'tous',
                darkmode: profil.darkmode || false
            };
            
            // Appliquer le dark mode si activé
            if (userProfil.darkmode) {
                document.body.classList.add('darkmode');
            }
        } catch (error) {
            console.error('Erreur chargement profil:', error);
        }
    }
}

loadUserProfil();

gpsButton.addEventListener('click', onLocate);
addressButton.addEventListener('click', onAddress);

function showParkingResult({response, closeParkings}, userCoords) {
    // Cacher le formulaire
    formContainer.style.display = 'none';

    // 1. Titres avec attributs data-i18n pour la mise à jour dynamique
    let content = `<h3><span data-i18n="result.current_pos">${t('result.current_pos')}</span> ${response.originAddresses[0]}</h3>`;
    
    content += `<p><strong data-i18n="result.closest_parkings">${t('result.closest_parkings')}</strong></p>`;

    for (const parking of closeParkings) {
        const destAddress = response.destinationAddresses[parking.indice];
        const distance = response.rows[0].elements[parking.indice].distance.value;
        const duration = response.rows[0].elements[parking.indice].duration.text;
        const mapsURL = buildGoogleMapsURL(userCoords, parking.coords);
        const pricing = parking.parkingDetails.parking.properties.cout;
        const type = parking.parkingDetails.parking.properties.typ;

        // 2. Chaque libellé reçoit son data-i18n
        // Note: capitalizeFirstLetter doit être défini dans utils.js
        content += `
        <div class="parkingItem" style="border:1px solid #ccc; padding:10px; border-radius:8px; margin-bottom:10px;">
            <h4>${destAddress}</h4>
            <p><strong data-i18n="result.distance">${t('result.distance')}</strong> ${distance} m</p>
            <p><strong data-i18n="result.duration">${t('result.duration')}</strong> ${duration}</p>
            <p><strong data-i18n="result.pricing">${t('result.pricing')}</strong> ${ pricing ? capitalizeFirstLetter(pricing) : "Gratuit"}</p>
            <p><strong data-i18n="result.type">${t('result.type')}</strong> ${ type ? capitalizeFirstLetter(type) : "Extérieur"}</p>
            
            ${mode !== "address" ? 
                // Bouton "Y aller" avec data-i18n
                `<button class="showMapBtn" data-i18n="btn.go" data-index="${closeParkings.indexOf(parking)}" data-distance="${distance}" data-duration="${duration}" data-dest="${destAddress}">${t('btn.go')}</button>` 
                : ""}
            
            <a href="${mapsURL}" target="_blank"><button data-i18n="btn.gmaps">${t('btn.gmaps')}</button></a>
        </div>
        `;
    }

    result.innerHTML = content;
    result.style.display = 'block';

    document.querySelectorAll('.showMapBtn').forEach((btn) => {
        const index = parseInt(btn.getAttribute('data-index'));
        const parking = closeParkings[index];
        const distance = btn.getAttribute('data-distance');
        const duration = btn.getAttribute('data-duration');
        const destName = btn.getAttribute('data-dest');
        
        btn.addEventListener('click', async () => {
            // Enregistrer le trajet si l'utilisateur est connecté
            if (isLoggedIn()) {
                try {
                    await saveTrajet({
                        duree: duration,
                        distance: parseInt(distance),
                        origine: response.originAddresses[0],
                        destination_nom: destName,
                        destination_lat: parking.coords.lat,
                        destination_lng: parking.coords.lng
                    });
                } catch (error) {
                    console.error('Erreur enregistrement trajet:', error);
                }
            }
            
            // Cacher la liste des parkings
            result.style.display = 'none';
            // Lancer la map et le guidage
            showMap(userCoords, parking.coords);
        });
    });
}

async function onLocate() {
    mode = "gps";
    // Texte traduit via t()
    result.textContent = t('status.locating');
    try {
        const userLocation = await getUserAccurateLocation();
        if (userLocation === null) {
            result.innerHTML = `<p class="error">${t('error.geolocation')}</p>`;
            return;
        }
        const parkingResult = await getCloseParkings(userLocation, userProfil);
        showParkingResult(parkingResult, userLocation);
    } catch(error) {
        // Traduction de l'erreur si c'est une clé connue
        const msg = error.message.startsWith('error.') ? t(error.message) : error.message;
        result.innerHTML = `<p class="error">${msg}</p>`;
    }
}

async function onAddress() {
    mode = "address";
    const address = addressInput.value.trim();
    if (!address) {
        result.innerHTML = `<p class="error">${t('error.address_missing')}</p>`;
        return;
    }
    result.textContent = t('status.geocoding');
    try {
        const userLocation = await geocodeAddress(address);
        const parkingResult = await getCloseParkings(userLocation, userProfil);
        showParkingResult(parkingResult, userLocation);
    } catch (error) {
        const msg = error.message.startsWith('error.') ? t(error.message) : error.message;
        result.innerHTML = `<p class="error">${msg}</p>`;
    }
}