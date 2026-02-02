const API_BASE = '/api/rider';
const PAYMENT_API = '/api/payment';
const currentUserPhone = localStorage.getItem('wink_phone');

// CONFIGURATION MULTI-PAYS
const COUNTRY_CONFIG = {
    'CM': { 
        name: 'Cameroun', currency: 'XAF', 
        operators: [
            { code: 'orange', label: 'Orange Money', class: 'op-orange' },
            { code: 'mtn', label: 'MTN MoMo', class: 'op-mtn' }
        ]
    },
    'SN': { 
        name: 'Sénégal', currency: 'XOF', 
        operators: [
            { code: 'orange', label: 'Orange Money', class: 'op-orange' },
            { code: 'wave', label: 'Wave', class: 'op-wave' },
            { code: 'free', label: 'Free Money', class: 'op-mtn' }
        ]
    },
    'CI': { 
        name: 'Côte d\'Ivoire', currency: 'XOF', 
        operators: [
            { code: 'orange', label: 'Orange', class: 'op-orange' },
            { code: 'mtn', label: 'MTN', class: 'op-mtn' },
            { code: 'wave', label: 'Wave', class: 'op-wave' }
        ]
    },
    'GA': { 
        name: 'Gabon', currency: 'XAF', 
        operators: [
            { code: 'airtel', label: 'Airtel', class: 'op-mtn' }
        ]
    }
};

let selectedOperator = null;

document.addEventListener('DOMContentLoaded', () => {
    if (!currentUserPhone) { 
        window.location.href = 'index.html'; 
        return; 
    }
    loadDashboard();
    setupEventListeners();
});

// --- 1. CHARGEMENT DES DONNÉES ---
async function loadDashboard() {
    try {
        const res = await fetch(`${API_BASE}/me?phone=${currentUserPhone}`);
        const json = await res.json();
        if (!json.success) { logout(); return; }

        const data = json.data;
        
        // Remplissage de l'UI
        document.getElementById('rider-name').textContent = data.name;
        document.getElementById('stat-days').textContent = data.stats.daysLeft;
        document.getElementById('stat-deliveries').textContent = data.stats.deliveries || 0;
        document.getElementById('stat-rating').textContent = data.stats.rating || "5.0";
        document.getElementById('toggle-online').checked = data.settings.isOnline === 1;
        updateStatusUI(data.settings.isOnline === 1);
        
        window.riderData = data; 

        // Gestion Alerte Expiration
        if (data.stats.isExpired) {
            document.getElementById('alert-expired').classList.remove('hidden');
            document.getElementById('stat-days').style.color = '#DC2626';
        } else {
            document.getElementById('alert-expired').classList.add('hidden');
            document.getElementById('stat-days').style.color = '';
        }
        
        // Parrainage & Liens
        if (data.referral) {
            document.getElementById('referral-code-display').textContent = data.referral.code;
            document.getElementById('referral-count').textContent = data.stats.referralCount;
        }
        document.getElementById('magic-link').value = data.link;
        document.getElementById('custom-msg').value = data.settings.customMessage || "";

    } catch (err) { console.error("Erreur chargement dashboard:", err); }
}

// --- 2. GESTION DES ÉVÉNEMENTS ---
function setupEventListeners() {
    // Bouton Renouveler
    const btnRenew = document.getElementById('btn-renew');
    if(btnRenew) btnRenew.addEventListener('click', openPaymentModal);

    // Fermeture Modal
    document.getElementById('close-modal').addEventListener('click', () => {
        document.getElementById('payment-modal').classList.add('hidden');
    });

    // Changement de Pays
    document.getElementById('pay-country').addEventListener('change', (e) => {
        renderOperators(e.target.value);
    });

    // Confirmation Paiement
    document.getElementById('btn-pay-confirm').addEventListener('click', initiatePayment);

    // Déconnexion
    document.getElementById('btn-logout').addEventListener('click', logout);

    // Toggle Online/Offline
    document.getElementById('toggle-online').addEventListener('change', async (e) => {
        const isOnline = e.target.checked;
        updateStatusUI(isOnline);
        await fetch(`${API_BASE}/status`, {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ phone: currentUserPhone, isOnline: isOnline ? 1 : 0 })
        });
    });

    // --- NOUVELLES FONCTIONNALITÉS (COPIE & PARTAGE) ---

    // Copier le lien
    document.getElementById('btn-copy').addEventListener('click', () => {
        const linkInput = document.getElementById('magic-link');
        linkInput.select();
        linkInput.setSelectionRange(0, 99999); // Mobile
        
        navigator.clipboard.writeText(linkInput.value).then(() => {
            const btn = document.getElementById('btn-copy');
            const originalText = btn.textContent;
            btn.textContent = "Copié ! ✅";
            setTimeout(() => btn.textContent = originalText, 2000);
        });
    });

    // Envoyer le lien au client via WhatsApp
    document.getElementById('btn-share-wa').addEventListener('click', () => {
        const link = document.getElementById('magic-link').value;
        const customMsg = document.getElementById('custom-msg').value || "Salut ! Voici mon lien de localisation :";
        const text = `${customMsg}\n📍 ${link}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    });

    // Inviter un ami (Parrainage)
    document.getElementById('btn-share-referral').addEventListener('click', () => {
        const myCode = document.getElementById('referral-code-display').textContent;
        const shareText = `🚀 Salut ! Utilise Wink Track pour tes livraisons. \n🎁 Mon code : *${myCode}* pour 3 jours offerts !\n🔗 https://track.winkexpress.online`;
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
    });

    // Enregistrer le message personnalisé
    document.getElementById('btn-save-msg').addEventListener('click', async () => {
        const msg = document.getElementById('custom-msg').value;
        const btn = document.getElementById('btn-save-msg');
        btn.textContent = "⏳...";
        try {
            await fetch(`${API_BASE}/message`, {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ phone: currentUserPhone, message: msg })
            });
            btn.textContent = "Sauvé ! ✅";
            setTimeout(() => btn.textContent = "Enregistrer", 2000);
        } catch (err) { btn.textContent = "Erreur"; }
    });
}

// --- 3. LOGIQUE PAIEMENT ---
function openPaymentModal() {
    document.getElementById('payment-modal').classList.remove('hidden');
    document.getElementById('pay-country').value = 'CM'; 
    renderOperators('CM');
    document.getElementById('pay-phone').value = currentUserPhone;
}

function renderOperators(countryCode) {
    const grid = document.getElementById('operator-grid');
    grid.innerHTML = ''; 
    selectedOperator = null;
    const config = COUNTRY_CONFIG[countryCode];
    if (!config) return;

    config.operators.forEach(op => {
        const div = document.createElement('div');
        div.className = `op-card ${op.class}`;
        div.textContent = op.label;
        div.onclick = () => {
            document.querySelectorAll('.op-card').forEach(c => c.classList.remove('selected'));
            div.classList.add('selected');
            selectedOperator = op.code;
        };
        grid.appendChild(div);
    });
}

async function initiatePayment() {
    const country = document.getElementById('pay-country').value;
    const phone = document.getElementById('pay-phone').value;
    const btn = document.getElementById('btn-pay-confirm');

    if (!selectedOperator) { alert("Choisissez un opérateur."); return; }
    
    btn.textContent = "📲 Lancement...";
    btn.disabled = true;

    try {
        const res = await fetch(`${PAYMENT_API}/initiate`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                phone: phone,
                amount: 150,
                currency: COUNTRY_CONFIG[country].currency,
                network: selectedOperator,
                country: country
            })
        });

        const data = await res.json();
        if (data.success) {
            alert("✅ Vérifiez votre téléphone et entrez votre code PIN.");
            document.getElementById('payment-modal').classList.add('hidden');
        } else {
            alert("Erreur: " + data.error);
        }
    } catch (err) { alert("Erreur connexion."); }
    finally {
        btn.disabled = false;
        btn.textContent = "🔒 Payer maintenant";
    }
}

// --- 4. UTILITAIRES ---
function updateStatusUI(isOnline) {
    const badge = document.getElementById('status-badge');
    badge.textContent = isOnline ? "🟢 En Ligne" : "⚪ Hors Ligne";
    badge.style.background = isOnline ? "#D1FAE5" : "#F3F4F6";
    badge.style.color = isOnline ? "#065F46" : "#6B7280";
}

function logout() { 
    localStorage.removeItem('wink_phone'); 
    window.location.href = 'index.html'; 
}