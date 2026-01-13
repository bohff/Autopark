const API_URL = 'https://autopark.live/api';

// Gestion du token
function getToken() {
    return localStorage.getItem('autopark_token');
}

function setToken(token) {
    localStorage.setItem('autopark_token', token);
}

function removeToken() {
    localStorage.removeItem('autopark_token');
}

function isLoggedIn() {
    return !!getToken();
}

// Headers avec authentification
function getAuthHeaders() {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': token || ''
    };
}

// Inscription
async function register(nom, prenom, email, mot_de_passe) {
    const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom, prenom, email, mot_de_passe })
    });

    const data = await res.json();
    // On utilise t() pour traduire le message si c'est une clé, ou afficher le texte tel quel
    if (!res.ok) throw new Error(t(data.message));

    setToken(data.token);
    return data;
}

// Connexion
async function login(email, mot_de_passe) {
    const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, mot_de_passe })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(t(data.message));

    setToken(data.token);
    return data;
}

// Déconnexion
function logout() {
    removeToken();
    document.body.classList.remove('darkmode');
    window.location.href = 'index.html';
}

// Récupérer le profil
async function getProfil() {
    const res = await fetch(`${API_URL}/profil`, {
        headers: getAuthHeaders()
    });

    // Utilisation d'une clé de traduction pour l'erreur
    if (!res.ok) throw new Error(t('error.profile_fetch'));
    return res.json();
}

// Mettre à jour le profil
async function updateProfil(profilData) {
    const res = await fetch(`${API_URL}/profil`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(profilData)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(t(data.message));
    return data;
}

// Récupérer les infos du compte (nom, prénom, email)
async function getCompte() {
    const res = await fetch(`${API_URL}/profil/compte`, {
        headers: getAuthHeaders()
    });

    if (!res.ok) {
        const data = await res.json();
        // Traduction du message API ou message générique
        throw new Error(t(data.message) || `${t('error.api_error')} ${res.status}`);
    }
    return res.json();
}

// Mettre à jour le nom/prénom
async function updateCompte(nom, prenom) {
    const res = await fetch(`${API_URL}/profil/compte`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ nom, prenom })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(t(data.message));
    return data;
}

// Changer le mot de passe
async function changePassword(ancienPassword, nouveauPassword) {
    const res = await fetch(`${API_URL}/profil/password`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ancienPassword, nouveauPassword })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(t(data.message));
    return data;
}

// Récupérer l'historique des trajets
async function getHistorique() {
    try {
        const res = await fetch(`${API_URL}/trajet/historique`, {
            headers: getAuthHeaders()
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            // Construction d'un message d'erreur complet et traduit
            throw new Error(`${t('error.history_fetch')}: ${res.status} - ${t(errorData.message) || t('error.unknown')}`);
        }
        
        const data = await res.json();
        console.log('Historique récupéré:', data);
        return data;
    } catch (error) {
        console.error('Erreur getHistorique:', error);
        throw error;
    }
}

// Enregistrer un trajet
async function saveTrajet(trajetData) {
    const res = await fetch(`${API_URL}/trajet`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(trajetData)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(t(data.message));
    return data;
}