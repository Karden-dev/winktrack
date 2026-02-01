const API_BASE = '/api/auth';
let isNewUser = false;
let selectedType = 'independent'; // independent | company
let referralValid = false; // Pour savoir si on envoie le code ou pas

document.addEventListener('DOMContentLoaded', () => {
    // Vérification rapide de session
    if (localStorage.getItem('wink_phone')) {
        window.location.href = 'dashboard.html';
    }
    setupEvents();
});

function setupEvents() {
    const btnAction = document.getElementById('btn-action');
    const phoneInput = document.getElementById('phone');
    const referralInput = document.getElementById('referral-code');

    // 1. Gestion du Bouton Principal (Continuer / S'inscrire)
    btnAction.addEventListener('click', async () => {
        const phone = phoneInput.value.trim();

        if (phone.length < 9) {
            showError("Numéro invalide");
            return;
        }

        if (isNewUser) {
            await completeRegistration(phone);
        } else {
            await checkPhoneNumber(phone);
        }
    });

    // 2. Gestion du Toggle (Indépendant / Entreprise)
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Mise à jour visuelle
            document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            // Mise à jour logique
            selectedType = e.target.dataset.val;
            
            // Afficher ou cacher le champ "Nom de la structure"
            const companyField = document.getElementById('company-field');
            if (selectedType === 'company') {
                companyField.classList.remove('hidden');
                // Petit focus automatique pour l'UX
                setTimeout(() => document.getElementById('company-name').focus(), 100);
            } else {
                companyField.classList.add('hidden');
            }
        });
    });

    // 3. Vérification du Code Parrain (En direct avec Debounce)
    let timeout = null;
    if (referralInput) { 
        referralInput.addEventListener('keyup', (e) => {
            clearTimeout(timeout);
            const code = e.target.value.trim().toUpperCase();
            
            // Reset de l'état visuel
            document.getElementById('referral-check').classList.add('hidden');
            document.getElementById('referral-success').classList.add('hidden');
            referralValid = false;

            if (code.length < 5) return; // Trop court pour être un code valide

            // On attend 800ms après la fin de la frappe
            timeout = setTimeout(async () => {
                try {
                    const res = await fetch(`${API_BASE}/check-referral`, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ code })
                    });
                    const data = await res.json();
                    
                    if (data.valid) {
                        referralValid = true;
                        document.getElementById('referral-check').classList.remove('hidden');
                        document.getElementById('referral-success').classList.remove('hidden');
                    }
                } catch (err) { console.error(err); }
            }, 800);
        });
    }
}

// --- ÉTAPE 1 : VÉRIFIER SI LE NUMÉRO EXISTE ---
async function checkPhoneNumber(phone) {
    setLoading(true);
    try {
        const res = await fetch(`${API_BASE}/check`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone })
        });
        
        const data = await res.json();
        setLoading(false);

        if (data.exists) {
            // CAS A : UTILISATEUR EXISTANT -> CONNEXION
            loginSuccess(phone);
        } else {
            // CAS B : NOUVEAU -> DÉROULER LE FORMULAIRE
            isNewUser = true;
            document.getElementById('register-fields').classList.remove('hidden');
            document.getElementById('btn-action').textContent = "S'INSCRIRE & COMMENCER 🚀";
            
            // Focus automatique sur le champ Nom
            setTimeout(() => document.getElementById('name').focus(), 100);
        }

    } catch (err) {
        setLoading(false);
        showError("Erreur de connexion serveur");
    }
}

// --- ÉTAPE 2 : CRÉATION DU COMPTE ---
async function completeRegistration(phone) {
    // Récupération des valeurs
    const name = document.getElementById('name').value.trim();
    const city = document.getElementById('city').value.trim();
    // Important : Récupération du Pays (avec fallback)
    const country = document.getElementById('country').value.trim() || 'Cameroun';
    
    const companyName = document.getElementById('company-name').value.trim();
    const referralCode = document.getElementById('referral-code').value.trim().toUpperCase();

    // Validations
    if (!name || !city) {
        showError("Merci de remplir votre nom et votre ville.");
        return;
    }

    if (selectedType === 'company' && !companyName) {
        showError("Le nom de la structure est obligatoire.");
        return;
    }

    setLoading(true);

    const payload = {
        phone: phone,
        firstName: name,
        city: city,
        country: country, // On envoie le pays choisi
        isIndependent: selectedType === 'independent',
        companyName: selectedType === 'company' ? companyName : '',
        referralCode: referralValid ? referralCode : '' // On n'envoie que si le code est valide
    };

    try {
        const res = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        setLoading(false);

        if (data.success) {
            // Message de succès spécial si bonus parrainage
            if (data.hasBonus) {
                alert("🎁 Félicitations ! Votre code parrain est validé. Vous avez 3 jours offerts !");
            }
            loginSuccess(phone);
        } else {
            showError("Erreur lors de l'inscription.");
        }

    } catch (err) {
        setLoading(false);
        showError("Impossible de créer le compte.");
    }
}

function loginSuccess(phone) {
    // Simulation de session (Stockage local)
    localStorage.setItem('wink_phone', phone);
    
    // Feedback visuel sur le bouton
    const btn = document.getElementById('btn-action');
    btn.style.background = "#10B981";
    btn.textContent = "Connexion réussie...";
    
    // Redirection
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 1000);
}

// --- UTILITAIRES ---
function showError(msg) {
    const el = document.getElementById('error-msg');
    el.textContent = msg;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 3000);
}

function setLoading(isLoading) {
    const btn = document.getElementById('btn-action');
    if (isLoading) {
        btn.textContent = "Chargement...";
        btn.disabled = true;
        btn.style.opacity = 0.7;
    } else {
        btn.textContent = isNewUser ? "S'INSCRIRE & COMMENCER 🚀" : "CONTINUER ➤";
        btn.disabled = false;
        btn.style.opacity = 1;
    }
}