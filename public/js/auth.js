const API_BASE = '/api/auth';
let isNewUser = false;
let selectedType = 'independent'; // independent | company
let referralValid = false; // État visuel du code

document.addEventListener('DOMContentLoaded', () => {
    // Vérification de session existante
    if (localStorage.getItem('wink_phone')) {
        window.location.href = 'dashboard.html';
    }
    setupEvents();
});

function setupEvents() {
    const btnAction = document.getElementById('btn-action');
    const phoneInput = document.getElementById('phone');
    const referralInput = document.getElementById('referral-code');

    // 1. Bouton Principal : Vérification ou Inscription
    if (btnAction) {
        btnAction.addEventListener('click', async () => {
            const phone = phoneInput.value.trim();

            if (phone.length < 9) {
                showError("Numéro invalide (min 9 chiffres)");
                return;
            }

            if (isNewUser) {
                await completeRegistration(phone);
            } else {
                await checkPhoneNumber(phone);
            }
        });
    }

    // 2. Toggle : Indépendant / Entreprise
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            selectedType = e.target.dataset.val;
            
            const companyField = document.getElementById('company-field');
            if (selectedType === 'company') {
                companyField.classList.remove('hidden');
                setTimeout(() => document.getElementById('company-name').focus(), 100);
            } else {
                companyField.classList.add('hidden');
            }
        });
    });

    // 3. Vérification en direct du Code Parrain/Promo
    let timeout = null;
    if (referralInput) { 
        referralInput.addEventListener('keyup', (e) => {
            clearTimeout(timeout);
            const code = e.target.value.trim().toUpperCase();
            
            document.getElementById('referral-check').classList.add('hidden');
            document.getElementById('referral-success').classList.add('hidden');
            referralValid = false;

            if (code.length < 4) return;

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
                        const successText = document.getElementById('referral-success');
                        successText.classList.remove('hidden');
                        successText.textContent = data.type === 'promo' 
                            ? `🎉 Code Promo : ${data.days} jours offerts !` 
                            : `🎉 Code Parrain : ${data.days} jours offerts !`;
                    }
                } catch (err) { console.error("Erreur code:", err); }
            }, 800);
        });
    }
}

// --- ÉTAPE 1 : VÉRIFIER LE NUMÉRO ---
async function checkPhoneNumber(phone) {
    setLoading(true);
    
    // Timeout de sécurité 8s
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
        const res = await fetch(`${API_BASE}/check`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        const data = await res.json();
        setLoading(false);

        if (data.exists) {
            loginSuccess(phone);
        } else {
            isNewUser = true;
            document.getElementById('register-fields').classList.remove('hidden');
            document.getElementById('btn-action').textContent = "S'INSCRIRE & COMMENCER 🚀";
            document.getElementById('register-fields').scrollIntoView({ behavior: 'smooth' });
            setTimeout(() => document.getElementById('name').focus(), 100);
        }

    } catch (err) {
        setLoading(false);
        if (err.name === 'AbortError') {
            showError("Le serveur met trop de temps à répondre. Vérifiez votre connexion.");
        } else {
            showError("Erreur de connexion au serveur.");
        }
    }
}

// --- ÉTAPE 2 : FINALISER L'INSCRIPTION ---
async function completeRegistration(phone) {
    const name = document.getElementById('name').value.trim();
    const city = document.getElementById('city').value.trim();
    const companyName = document.getElementById('company-name').value.trim();
    const referralCode = document.getElementById('referral-code').value.trim().toUpperCase();

    if (!name || !city) {
        showError("Veuillez remplir votre nom et votre ville.");
        return;
    }

    setLoading(true);

    const payload = {
        phone,
        firstName: name,
        city,
        country: document.getElementById('country').value || 'Cameroun',
        isIndependent: selectedType === 'independent',
        companyName: selectedType === 'company' ? companyName : '',
        referralCode // On envoie toujours, le backend validera
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
            if (data.hasBonus) alert(data.message);
            loginSuccess(phone);
        } else {
            showError(data.error || "Erreur d'inscription.");
        }
    } catch (err) {
        setLoading(false);
        showError("Impossible de créer le compte.");
    }
}

function loginSuccess(phone) {
    localStorage.setItem('wink_phone', phone);
    const btn = document.getElementById('btn-action');
    btn.style.background = "#10B981";
    btn.textContent = "Connexion réussie...";
    setTimeout(() => window.location.href = 'dashboard.html', 1000);
}

function showError(msg) {
    const el = document.getElementById('error-msg');
    el.textContent = msg;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 4000);
}

function setLoading(isLoading) {
    const btn = document.getElementById('btn-action');
    btn.disabled = isLoading;
    if (isLoading) {
        btn.textContent = "Chargement...";
        btn.style.opacity = 0.7;
    } else {
        btn.textContent = isNewUser ? "S'INSCRIRE & COMMENCER 🚀" : "CONTINUER ➤";
        btn.style.opacity = 1;
    }
}