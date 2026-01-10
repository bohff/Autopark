// Génère le header commun pour toutes les pages
async function initHeader() {
    const header = document.createElement('header');
    header.id = 'mainHeader';
    
    let menuHTML = '';
    
    if (isLoggedIn()) {
        // Menu pour utilisateur connecté (pseudo chargé après)
        menuHTML = `
            <div class="header-left">
                <a href="index.html" class="logo">Autopark</a>
            </div>
            <nav class="header-nav">
                <a href="profil.html">Profil</a>
                <a href="historique.html">Historique</a>
            </nav>
            <div class="header-right">
                <span id="userNameHeader">...</span>
                <a href="#" onclick="logout(); return false;" class="btn-logout">Déconnexion</a>
            </div>
        `;
        
        header.innerHTML = menuHTML;
        document.body.insertBefore(header, document.body.firstChild);
        
        // Charger le nom depuis MongoDB
        const compte = await getCompte();
        document.getElementById('userNameHeader').textContent = `${compte.prenom} ${compte.nom}`;
    } else {
        // Menu pour visiteur
        menuHTML = `
            <div class="header-left">
                <a href="index.html" class="logo">Autopark</a>
            </div>
            <nav class="header-nav"></nav>
            <div class="header-right">
                <a href="connexion.html" class="btn-login">Connexion</a>
                <a href="inscription.html" class="btn-register">Inscription</a>
            </div>
        `;
        
        header.innerHTML = menuHTML;
        document.body.insertBefore(header, document.body.firstChild);
    }
}

// Initialiser le header au chargement
document.addEventListener('DOMContentLoaded', initHeader);
