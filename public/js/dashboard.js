const API_BASE = '/api/rider';
const PAYMENT_API = '/api/payment';

// On simule l'authentification via localStorage (définie lors du login)
// Dans une vraie app, ce serait un Token JWT.
const currentUserPhone = localStorage.getItem('wink_phone');

// --- 1. INITIALISATION ---
document.addEventListener('DOMContentLoaded', () => {
    if (!currentUserPhone) {
        window.location.href = 'index.html'; // Redirection si pas connecté
        return;
    }
    
    loadDashboard();
    setupEventListeners();
});

// --- 2. CHARGEMENT DES DONNÉES ---
async function loadDashboard() {
    try {
        const res = await fetch(`${API_BASE}/me?phone=${currentUserPhone}`);
        const json = await res.json();

        if (!json.success) {
            alert("Session expirée");
            logout();
            return;
        }

        const data = json.data;

        // Remplissage Profil
        document.getElementById('rider-name').textContent = data.name;
        document.getElementById('toggle-online').checked = data.settings.isOnline === 1;
        updateStatusUI(data.settings.isOnline === 1);

        // Remplissage Stats
        document.getElementById('stat-deliveries').textContent = data.stats.deliveries;
        document.getElementById('stat-rating').textContent = data.stats.rating || '5.0';
        document.getElementById('stat-days').textContent = data.stats.daysLeft;

        // Gestion Abonnement
        if (data.stats.isExpired) {
            document.getElementById('alert-expired').classList.remove('hidden');
            document.getElementById('stat-days').style.color = 'red';
            // On peut aussi flouter le lien pour forcer le paiement
            document.getElementById('magic-link').style.opacity = '0.5';
        }

        // Remplissage Lien
        document.getElementById('magic-link').value = data.link;
        document.getElementById('custom-msg').value = data.settings.customMessage || "📍 Voici ma position.";

        // Sauvegarde globale pour le paiement
        window.riderData = data; 

    } catch (err) {
        console.error("Erreur chargement", err);
    }
}

// --- 3. ÉVÉNEMENTS ---
function setupEventListeners() {
    // Bouton Déconnexion
    document.getElementById('btn-logout').addEventListener('click', logout);

    // Switch En Ligne / Hors Ligne
    document.getElementById('toggle-online').addEventListener('change', async (e) => {
        const isOnline = e.target.checked;
        updateStatusUI(isOnline);
        await fetch(`${API_BASE}/status`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ phone: currentUserPhone, isOnline: isOnline ? 1 : 0 })
        });
    });

    // Copier le lien
    document.getElementById('btn-copy').addEventListener('click', () => {
        const input = document.getElementById('magic-link');
        input.select();
        document.execCommand('copy'); // Fallback pour vieux navigateurs
        navigator.clipboard.writeText(input.value);
        alert('Lien copié !');
    });

    // Partager WhatsApp
    document.getElementById('btn-share-wa').addEventListener('click', () => {
        const link = document.getElementById('magic-link').value;
        const text = `Salut ! Pour m'envoyer ta position, clique ici : ${link}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    });

    // Sauvegarder Message
    document.getElementById('btn-save-msg').addEventListener('click', async () => {
        const msg = document.getElementById('custom-msg').value;
        await fetch(`${API_BASE}/message`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ phone: currentUserPhone, message: msg })
        });
        alert('Message mis à jour !');
    });

    // Renouveler (Paiement)
    const btnRenew = document.getElementById('btn-renew');
    if(btnRenew) btnRenew.addEventListener('click', startPayment);
}

// --- 4. FONCTIONS UTILITAIRES ---
function updateStatusUI(isOnline) {
    const badge = document.getElementById('status-badge');
    if (isOnline) {
        badge.textContent = "🟢 En Ligne";
        badge.style.background = "#D1FAE5";
        badge.style.color = "#065F46";
    } else {
        badge.textContent = "⚪ Hors Ligne";
        badge.style.background = "#F3F4F6";
        badge.style.color = "#6B7280";
    }
}

function logout() {
    localStorage.removeItem('wink_phone');
    window.location.href = 'index.html';
}

// --- 5. LOGIQUE DE PAIEMENT (Flutterwave) ---
function startPayment() {
    // On génère une référence unique
    const txRef = "WINK-" + Date.now();
    const amount = 150; // Prix hebdomadaire

    FlutterwaveCheckout({
        public_key: "FLWPUBK_TEST-xxxxxxxxxxxxxxxxxxxxx-X", // Remplace par ta clé publique (dans le .env en vrai, mais ici JS)
        tx_ref: txRef,
        amount: amount,
        currency: "XAF",
        payment_options: "mobilemoney, card",
        customer: {
            email: "client@wink.com", // Email générique ou celui du livreur si on l'a
            phone_number: currentUserPhone,
            name: document.getElementById('rider-name').textContent,
        },
        customizations: {
            title: "Abonnement Wink Track",
            description: "Accès 7 jours",
            logo: "https://ton-site.com/logo.png",
        },
        callback: function (data) {
            // Appelé quand le paiement réussit
            console.log("Paiement réussi", data);
            
            // On notifie notre serveur pour activer l'abo
            // Note: Normalement c'est le Webhook qui fait foi, mais on peut forcer un refresh ici
            alert("Paiement validé ! Votre lien a été mis à jour.");
            location.reload();
        },
        onclose: function() {
            // Fermé sans payer
        }
    });
}