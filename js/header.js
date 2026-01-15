async function initHeader() {
    const header = document.createElement('header');
    header.id = 'mainHeader';

    // Sélecteur de langue
    const langSelectorHTML = `
        <select id="langSelector" onchange="updateLanguage(this.value)" class="lang-select">
            <option value="fr">🇫🇷 FR</option>
            <option value="en">🇬🇧 EN</option>
        </select>
    `;

    let headerHTML = '';

    if (isLoggedIn()) {
        // UTILISATEUR CONNECTÉ 

        
        headerHTML = `
            <div class="header-left">
                <a href="index.html" class="logo">Autopark</a>
            </div>
            
            <nav class="header-nav">
                <a href="index.html" data-i18n="nav.home">Accueil</a>
                <a href="historique.html" data-i18n="nav.history">Historique</a>
                <a href="profil.html" data-i18n="nav.profile">Profil</a>
                <a href="preferences.html" data-i18n="nav.preferences">Préférences</a>
            </nav>

            <div class="header-right">
                ${langSelectorHTML}
                <span id="userNameHeader" style="font-weight:600; font-size:0.9rem; margin-right:5px;">Chargement...</span>
                
                <a href="#" id="headerLogoutBtn" class="btn-logout" title="Déconnexion"> 
                    <i class="fas fa-sign-out-alt"></i> 
                </a>
            </div>
        `;

        //  INJECTION DE LA FENÊTRE MODALE (Cachée par défaut) 
        
        const logoutModalHTML = `
            <div id="logoutModal" class="modal-overlay" style="display:none;">
                <div class="modal-box">
                    <h3 data-i18n="modal.logout_title">Déconnexion</h3>
                    <p data-i18n="modal.logout_message">Voulez-vous vraiment vous déconnecter ?</p>
                    <div class="modal-buttons">
                        <button id="btnCancelLogout" class="btn-modal-cancel" data-i18n="btn.cancel">Annuler</button>
                        <button id="btnConfirmLogout" class="btn-modal-confirm" data-i18n="btn.confirm_logout">Se déconnecter</button>
                    </div>
                </div>
            </div>
        `;
        
    
        if (!document.getElementById('logoutModal')) {
            document.body.insertAdjacentHTML('beforeend', logoutModalHTML);
        }


        setTimeout(async () => {
            try {
                if(typeof getCompte === 'function'){
                    const compte = await getCompte();
                    const userSpan = document.getElementById('userNameHeader');
                    if(userSpan) userSpan.textContent = `${compte.prenom} ${compte.nom}`;
                }
            } catch (e) { console.error(e); }
        }, 100);

        if(typeof getProfil === 'function') {
            getProfil().then(profil => {
                if (profil.darkmode) document.body.classList.add('darkmode');
                else document.body.classList.remove('darkmode');
            }).catch(() => {});
        }

    } else {

        // VISITEUR (NON CONNECTÉ) 
        headerHTML = `
            <div class="header-left">
                <a href="index.html" class="logo">Autopark</a>
            </div>
            <nav class="header-nav"></nav>
            <div class="header-right">
                ${langSelectorHTML}
                <a href="connexion.html" class="btn-login" data-i18n="nav.login">Connexion</a>
            </div>
        `;
    }


    header.innerHTML = headerHTML;

    const existingHeader = document.getElementById('mainHeader');
    if (existingHeader) existingHeader.remove();

    document.body.insertBefore(header, document.body.firstChild);
    
    //  GESTION DES CLICS (MODAL LOGOUT) 

    if (isLoggedIn()) {
        const logoutBtn = document.getElementById('headerLogoutBtn');
        const logoutModal = document.getElementById('logoutModal');
        const btnCancel = document.getElementById('btnCancelLogout');
        const btnConfirm = document.getElementById('btnConfirmLogout');

        //Clic sur le bouton rouge -> Ouvre la fenêtre
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                logoutModal.style.display = 'flex';
            });
        }

        //Clic sur Annuler -> Ferme la fenêtre
        if (btnCancel) {
            btnCancel.addEventListener('click', () => {
                logoutModal.style.display = 'none';
            });
        }

        //Clic sur Confirmer -> Déconnecte vraiment
        if (btnConfirm) {
            btnConfirm.addEventListener('click', () => {
                if (typeof logout === 'function') {
                    logout(); 
                } else {
                    console.error("Fonction logout() introuvable");
                }
            });
        }
    }
    
    // Appliquer la langue
    if(typeof updateLanguage === 'function') {
        const savedLang = localStorage.getItem('autopark_lang') || 'fr';
        updateLanguage(savedLang);
    }
}

document.addEventListener('DOMContentLoaded', initHeader);