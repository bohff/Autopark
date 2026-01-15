async function initFooter() {
    // Si l'utilisateur n'est PAS connecté, pas de footer mobile
    if (!isLoggedIn()) {
        document.body.style.paddingBottom = '20px';
        return; 
    }

    // CONNECTÉ : Affichage de la barre du bas 
    
    // Espace pour ne pas cacher le contenu
    document.body.style.paddingBottom = '80px';

    const mobileNav = document.createElement('div');
    mobileNav.className = 'mobile-bottom-nav';

    const mobileNavHTML = `
        <a href="index.html" class="nav-item">
            <i class="fas fa-home"></i>
            <span data-i18n="nav.home">Accueil</span>
        </a>
        
        <a href="historique.html" class="nav-item">
            <i class="fas fa-history"></i>
            <span data-i18n="nav.history">Historique</span>
        </a>
        
        <a href="profil.html" class="nav-item">
            <i class="fas fa-user"></i>
            <span data-i18n="nav.profile">Profil</span>
        </a>

        <a href="preferences.html" class="nav-item">
            <i class="fas fa-cog"></i>
            <span data-i18n="nav.preferences">Préférences</span>
        </a>
    `;

    mobileNav.innerHTML = mobileNavHTML;

    const existingNav = document.querySelector('.mobile-bottom-nav');
    if (existingNav) existingNav.remove();

    document.body.appendChild(mobileNav); 
    
    highlightActiveLink();


    if(typeof updateLanguage === 'function') {
        const savedLang = localStorage.getItem('autopark_lang') || 'fr';
        updateLanguage(savedLang);
    }
}

// Fonction utilitaire pour colorer l'icône active
function highlightActiveLink() {
    const currentPage = window.location.pathname.split("/").pop() || 'index.html';
    const links = document.querySelectorAll('.mobile-bottom-nav a');
    
    links.forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });
}

document.addEventListener('DOMContentLoaded', initFooter);