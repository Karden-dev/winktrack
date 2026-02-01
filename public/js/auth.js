const API_BASE = '/api/auth';
let isNewUser = false;
let selectedType = 'independent'; // independent | company

document.addEventListener('DOMContentLoaded', () => {
    // Vérifier si déjà connecté
    if (localStorage.getItem('wink_phone')) {
        window.location.href = 'dashboard.html';
    }

    setupEvents();
});

function setupEvents() {
    const btnAction = document.getElementById('btn-action');
    const phoneInput = document.getElementById('phone');

    // Gestion du clic "Continuer"
    btnAction.addEventListener('click', async () => {
        const phone = phoneInput.value.trim();

        if (phone.length < 9) {
            showError("Numéro invalide");
            return;
        }

        // Si on est en mode "Inscription" (les champs sont visibles)
        if (isNewUser) {
            await completeRegistration(phone);
        } else {
            // Sinon, on vérifie juste le numéro
            await checkPhoneNumber(phone);
        }
    });

    // Gestion du toggle Indépendant / Entreprise
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // UI Update
            document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            // Logic Update
            selectedType = e.target.dataset.val;
            
            // Show/Hide Company Name
            const companyField = document.getElementById('company-field');
            if (selectedType === 'company') {
                companyField.classList.remove('hidden');
            } else {
                companyField.classList.add('hidden');
            }
        });
    });
}

// ÉTAPE 1 : VÉRIFIER LE NUMÉRO
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
            // CAS A : IL EXISTE -> CONNEXION
            loginSuccess(phone);
        } else {
            // CAS B : NOUVEAU -> AFFICHER INSCRIPTION
            isNewUser = true;
            document.getElementById('register-fields').classList.remove('hidden');
            document.getElementById('btn-action').textContent = "S'INSCRIRE & COMMENCER 🚀";
            // On focus sur le nom
            setTimeout(() => document.getElementById('name').focus(), 100);
        }

    } catch (err) {
        setLoading(false);
        showError("Erreur de connexion serveur");
    }
}

// ÉTAPE 2 : FINALISER L'INSCRIPTION
async function completeRegistration(phone) {
    const name = document.getElementById('name').value.trim();
    const city = document.getElementById('city').value.trim();
    const companyName = document.getElementById('company-name').value.trim();

    if (!name || !city) {
        showError("Merci de remplir votre nom et votre ville.");
        return;
    }

    setLoading(true);

    const payload = {
        phone: phone,
        firstName: name,
        city: city,
        country: 'Cameroun', // Par défaut
        isIndependent: selectedType === 'independent',
        companyName: selectedType === 'company' ? companyName : ''
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
    // Sauvegarde "Session" (Simplifié pour le MVP)
    localStorage.setItem('wink_phone', phone);
    
    // Feedback visuel
    const btn = document.getElementById('btn-action');
    btn.style.background = "#10B981";
    btn.textContent = "Connexion réussie...";
    
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