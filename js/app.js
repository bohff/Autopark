const gpsButton = document.getElementById('gpsButton');
const addressButton = document.getElementById('addressButton');
const addressInput = document.getElementById('addressInput');
const result = document.getElementById('result');
const formContainer = document.getElementById('formContainer');

const stopBtn = document.getElementById('stopBtn');
const stopModal = document.getElementById('stopModal');
const btnCancelStop = document.getElementById('btnCancelStop');
const btnConfirmStop = document.getElementById('btnConfirmStop');

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

if (stopBtn) {
    stopBtn.addEventListener('click', () => {
        // On affiche la fenêtre de confirmation
        stopModal.style.display = 'flex';
    });
}

// Quand on clique sur Annuler
if (btnCancelStop) {
    btnCancelStop.addEventListener('click', () => {
        // On cache juste la fenêtre, le guidage continue
        stopModal.style.display = 'none';
    });
}

// Quand on clique sur Confirmer l'arrêt
if (btnConfirmStop) {
    btnConfirmStop.addEventListener('click', () => {
        // On cache la fenêtre
        stopModal.style.display = 'none';
        window.location.href = "index.html"; 
    });
}

function showParkingResult({response, closeParkings}, userCoords) {
    // Cacher le formulaire
    formContainer.style.display = 'none';

    // Titres
    let content = `<h3><span data-i18n="result.current_pos">${t('result.current_pos')}</span> ${response.originAddresses[0]}</h3>`;
    content += `<p><strong data-i18n="result.closest_parkings">${t('result.closest_parkings')}</strong></p>`;

    for (const parking of closeParkings) {
        // Données Google
        const destAddress = response.destinationAddresses[parking.indice];
        const distance = response.rows[0].elements[parking.indice].distance.value;
        const duration = response.rows[0].elements[parking.indice].duration.text;
        const mapsURL = buildGoogleMapsURL(userCoords, parking.coords);
        
        // Données Parking
        const props = parking.parkingDetails.parking.properties;
        const pricingRaw = props.cout; 
        const typeRaw = props.typ;

        //  LOGIQUE NOM DU PARKING
        const nomParking = props.LIB || props.lib || props.nom || props.commonName || destAddress;

  
        
        // PRIX
        let pricingHTML;
        if (pricingRaw === 'gratuit' || !pricingRaw) {
            
            pricingHTML = `<span data-i18n="parking.free">${t('parking.free')}</span>`;
        } else if (pricingRaw === 'payant') {
            pricingHTML = `<span data-i18n="parking.paid">${t('parking.paid')}</span>`;
        } else {
            // Si c'est un prix chiffré (ex: 2€), on l'affiche tel quel sans traduction
            pricingHTML = pricingRaw;
        }

        // TYPE
        let typeHTML;
        if (typeRaw === 'souterrain') {
            typeHTML = `<span data-i18n="parking.indoor">${t('parking.indoor')}</span>`;
        } else {
            typeHTML = `<span data-i18n="parking.outdoor">${t('parking.outdoor')}</span>`;
        }

        content += `
        <div class="parkingItem" style="border:1px solid #ccc; padding:10px; border-radius:8px; margin-bottom:10px;">
            <h4>${nomParking}</h4>
            
            <p><strong data-i18n="result.distance">${t('result.distance')}</strong> ${distance} m</p>
            <p><strong data-i18n="result.duration">${t('result.duration')}</strong> ${duration}</p>
            
            <p><strong data-i18n="result.pricing">${t('result.pricing')}</strong> ${pricingHTML}</p>
            <p><strong data-i18n="result.type">${t('result.type')}</strong> ${typeHTML}</p>
            
            ${mode !== "address" ? 
                `<button class="showMapBtn" data-i18n="btn.go" 
                    data-index="${closeParkings.indexOf(parking)}" 
                    data-distance="${distance}" 
                    data-duration="${duration}" 
                    data-dest="${nomParking}">
                    ${t('btn.go')}
                </button>` 
                : ""}
            
            <a href="${mapsURL}" target="_blank"><button data-i18n="btn.gmaps">${t('btn.gmaps')}</button></a>
        </div>
        `;
    }

    result.innerHTML = content;
    result.style.display = 'block';

    // GESTION DES CLICS 
    document.querySelectorAll('.showMapBtn').forEach((btn) => {
        const index = parseInt(btn.getAttribute('data-index'));
        const parking = closeParkings[index];
        const distance = btn.getAttribute('data-distance');
        const duration = btn.getAttribute('data-duration');
        const destName = btn.getAttribute('data-dest');
        
        btn.addEventListener('click', async () => {
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
            
            result.style.display = 'none';
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