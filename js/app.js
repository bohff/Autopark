gpsButton.addEventListener('click', onLocate);
addressButton.addEventListener('click', onAddress);

async function onLocate() {
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