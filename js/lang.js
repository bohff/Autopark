const translations = {
    fr: {
        // NAV
        "nav.home": "Acceuil",
        "nav.history": "Historique",
        "nav.profile": "Profil",
        "nav.preferences": "Préférences",
        "nav.login": "Connexion",
        "nav.logout": "Déconnexion",
        
        // HOME
        "home.title": "Trouver la place la plus proche",
        "home.subtitle": "Disponible à Metz et Londres",
        "home.gpsBtn": "Me géolocaliser (GPS)",
        "home.addressLabel": "Ou adresse de départ :",
        "home.addressBtn": "Rechercher",
        "home.placeholder": "Ex: 1 Rue de la République, Metz",
        "home.choose_option": "Choisissez une option ci-dessus.", 

        // --- RESULTATS --
        "result.current_pos": "Votre position :",       
        "result.closest_parkings": "Voici les 5 Parkings les plus proches :", 
        "result.distance": "Distance",
        "result.duration": "Durée",                      
        "result.pricing": "Tarif",                       
        "result.type": "Type",                           
        "result.places": "Places",
        "btn.go": "Y aller (App)",                       
        "btn.gmaps": "Voir sur Maps",                    
        "status.locating": "Géolocalisation en cours...",
        "status.geocoding": "Recherche de l'adresse...",

        // AUTH
        "auth.loginTitle": "Connexion",
        "auth.registerTitle": "Inscription",
        "auth.email": "Email",
        "auth.password": "Mot de passe",
        "auth.newPassword": "Nouveau mot de passe",
        "auth.confirmPassword": "Confirmer le mot de passe",
        "auth.nom": "Nom",
        "auth.prenom": "Prénom",
        "auth.submitLogin": "Se connecter",
        "auth.submitRegister": "S'inscrire",
        "auth.noAccount": "Pas encore de compte ?",
        "auth.hasAccount": "Déjà un compte ?",
        "auth.backHome": "Retour à l'accueil",
        "auth.loggingIn": "Connexion en cours...",
        "auth.loginSuccess": "Connexion réussie ! Redirection...",
        "auth.registering": "Inscription en cours...",
        "auth.registerSuccess": "Inscription réussie !",

        // MODAL DÉCONNEXION 
        "modal.logout_title": "Déconnexion",
        "modal.logout_message": "Voulez-vous vraiment vous déconnecter ?",
        "btn.confirm_logout": "Se déconnecter",
        "btn.cancel": "Annuler",
        
        // Placeholders
        "auth.placeholderName": "Votre nom",
        "auth.placeholderFirstName": "Votre prénom",
        "auth.placeholderEmail": "votre@email.com",
        "auth.placeholderPass": "Choisissez un mot de passe",
        "auth.placeholderPassLogin": "Votre mot de passe",
        "auth.placeholderConfirm": "Confirmez votre mot de passe",
        
        // HISTORIQUE
        "history.title": "Historique des trajets",
        "history.list": "Liste des trajets :",
        "history.empty": "Aucun trajet enregistré.",
        "history.visits": "visite(s)",
        "history.unknown": "Inconnu",
        
        // PROFIL & PREFERENCES
        "profile.title": "Mon Compte",
        "profile.myAccount": "Informations personnelles",
        "profile.changePass": "Sécurité",
        "profile.preferences": "Préférences",
        "profile.filters": "Filtres",
        "profile.display": "Affichage",
        "profile.pricing": "Tarification préférée",
        "profile.parkingType": "Type de parking préféré",
        "profile.interface": "Interface",
        "profile.save": "Enregistrer",
        "profile.update": "Mettre à jour",
        "profile.btn_change": "Changer le mot de passe",
        "profile.darkmode": "Mode sombre",
        "profile.success": "Préférences enregistrées !",

        // OPTIONS
        "filter.all": "Tous",
        "filter.free": "Gratuit uniquement",
        "filter.paid": "Payant uniquement",
        "filter.surface": "Aérien (extérieur)",
        "filter.underground": "Souterrain (couvert)",

        // ERREURS
        "error.geolocation": "Erreur GPS.",
        "error.address_not_found": "Adresse introuvable.",
        "error.address_missing": "Veuillez entrer une adresse.", 
        "error.city_not_supported": "Ville non supportée (Metz/Londres).",
        "error.history_fetch": "Erreur historique.",
        "error.profile_fetch": "Erreur profil.",
        "error.api_error": "Erreur de connexion API.",
        "error.timeout": "Délai d'attente dépassé.",
        "error.google_quota": "Quota Google Maps dépassé.",
        "error.google_generic": "Erreur Google Maps."
    },
    en: {
        "nav.home": "Home",
        "nav.history": "History",
        "nav.profile": "Profile",
        "nav.preferences": "Preferences",
        "nav.login": "Login",
        "nav.logout": "Logout",
        
        "home.title": "Find nearest parking",
        "home.subtitle": "Available in Metz & London",
        "home.gpsBtn": "Locate me (GPS)",
        "home.addressLabel": "Or address:",
        "home.addressBtn": "Search",
        "home.placeholder": "Ex: 1 Republic Street, Metz",
        "home.choose_option": "Choose an option",

        
        "result.current_pos": "Your position:",
        "result.closest_parkings": "5 nearest parking :",
        "result.distance": "Distance",
        "result.duration": "Duration",
        "result.pricing": "Price",
        "result.type": "Type",
        "result.places": "Spaces",
        
        "btn.go": "Go (App)",
        "btn.gmaps": "See on Maps",

        "status.locating": "Locating...",
        "status.geocoding": "Searching address...",

        "auth.loginTitle": "Login",
        "auth.registerTitle": "Register",
        "auth.email": "Email",
        "auth.password": "Password",
        "auth.newPassword": "New Password",
        "auth.confirmPassword": "Confirm Password",
        "auth.nom": "Last Name",
        "auth.prenom": "First Name",
        "auth.submitLogin": "Log In",
        "auth.submitRegister": "Sign Up",
        "auth.noAccount": "No account yet?",
        "auth.hasAccount": "Already have an account?",
        "auth.backHome": "Back to Home",
        "auth.loggingIn": "Logging in...",
        "auth.loginSuccess": "Login successful! Redirecting...",
        "auth.registering": "Registering...",
        "auth.registerSuccess": "Registration successful!",

        // --- NEW: LOGOUT MODAL ---
        "modal.logout_title": "Sign Out",
        "modal.logout_message": "Are you sure you want to sign out?",
        "btn.confirm_logout": "Sign Out",
        "btn.cancel": "Cancel",

        "auth.placeholderName": "Your last name",
        "auth.placeholderFirstName": "Your first name",
        "auth.placeholderEmail": "your@email.com",
        "auth.placeholderPass": "Choose password",
        "auth.placeholderPassLogin": "Your password",
        "auth.placeholderConfirm": "Confirm password",
        
        "history.title": "Trip History",
        "history.list": "Trips:",
        "history.empty": "No trips yet.",
        "history.visits": "visit(s)",
        "history.unknown": "Unknown",
        
        "profile.title": "My Account",
        "profile.myAccount": "Personal Info",
        "profile.changePass": "Security",
        "profile.preferences": "Preferences",
        "profile.filters": "Filters",
        "profile.display": "Display",
        "profile.pricing": "Preferred Pricing",
        "profile.parkingType": "Preferred Type",
        "profile.interface": "Interface",
        "profile.save": "Save Preferences",
        "profile.update": "Update",
        "profile.btn_change": "Change Password",
        "profile.darkmode": "Dark Mode",
        "profile.success": "Preferences saved!",
        

        "filter.all": "All",
        "filter.free": "Free only",
        "filter.paid": "Paid only",
        "filter.surface": "Surface",
        "filter.underground": "Underground",

        "error.geolocation": "GPS Error.",
        "error.address_not_found": "Address not found.",
        "error.address_missing": "Please enter an address.",
        "error.city_not_supported": "City not supported.",
        "error.history_fetch": "History error.",
        "error.profile_fetch": "Profile error.",
        "error.api_error": "API Connection Error.",
        "error.timeout": "Request timed out.",
        "error.google_quota": "Google Maps Quota Exceeded.",
        "error.google_generic": "Google Maps Error."
    }
};

function t(key) {
    const lang = localStorage.getItem('autopark_lang') || 'fr';
    return (translations[lang] && translations[lang][key]) ? translations[lang][key] : key;
}

function updateLanguage(lang) {
    localStorage.setItem('autopark_lang', lang);
    const selector = document.getElementById('langSelector');
    if(selector) selector.value = lang;

    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translations[lang][key];
            } else {
                element.textContent = translations[lang][key];
            }
        }
    });
}