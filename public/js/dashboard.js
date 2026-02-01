const API_BASE = '/api/rider';

// Récupération de l'utilisateur connecté
const currentUserPhone = localStorage.getItem('wink_phone');

// --- 1. INITIALISATION ---
document.addEventListener('DOMContentLoaded', () => {
    if (!currentUserPhone) {
        window.location.href = 'index.html'; // Pas connecté ? Dehors.
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
            alert("Session expirée, merci de vous reconnecter.");
            logout();
            return;
        }

        const data = json.data;

        // A. Remplissage Profil
        document.getElementById('rider-name').textContent = data.name;
        document.getElementById('toggle-online').checked = data.settings.isOnline === 1;
        updateStatusUI(data.settings.isOnline === 1);

        // B. Remplissage Stats
        document.getElementById('stat-deliveries').textContent = data.stats.deliveries;
        document.getElementById('stat-rating').textContent = data.stats.rating || '5.0';
        document.getElementById('stat-days').textContent = data.stats.daysLeft;

        // C. Remplissage Parrainage (Nouveau)
        if (data.referral) {
            document.getElementById('referral-code-display').textContent = data.referral.code || '---';
            document.getElementById('referral-count').textContent = data.stats.referralCount || 0;
        }

        // D. Gestion Abonnement Expiré
        if (data.stats.isExpired) {
            document.getElementById('alert-expired').classList.remove('hidden');
            document.getElementById('stat-days').style.color = '#DC2626';
            document.getElementById('magic-link').style.opacity = '0.5';
        }

        // E. Remplissage Lien & Message
        document.getElementById('magic-link').value = data.link;
        document.getElementById('custom-msg').value = data.settings.customMessage || "📍 Voici ma position.";

        // Sauvegarde globale pour usage dans les boutons
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

    // Copier le lien GPS
    document.getElementById('btn-copy').addEventListener('click', () => {
        const input = document.getElementById('magic-link');
        input.select();
        navigator.clipboard.writeText(input.value);
        alert('Lien copié !');
    });

    // Partager Lien GPS sur WhatsApp (Pour le client)
    document.getElementById('btn-share-wa').addEventListener('click', () => {
        const link = document.getElementById('magic-link').value;
        const msg = document.getElementById('custom-msg').value; // On prend le message perso
        const text = `${msg} ${link}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    });

    // Partager Code Parrainage (Pour les amis)
    document.getElementById('btn-share-referral').addEventListener('click', () => {
        const code = window.riderData.referral.code;
        const text = `Salut ! Utilise mon code *${code}* sur Wink Track pour avoir 3 jours d'essai gratuits ! 🎁\nInscris-toi ici : ${window.location.origin}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    });

    // Sauvegarder Message Personnalisé
    document.getElementById('btn-save-msg').addEventListener('click', async () => {
        const msg = document.getElementById('custom-msg').value;
        await fetch(`${API_BASE}/message`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ phone: currentUserPhone, message: msg })
        });
        alert('Message mis à jour !');
    });

    // Renouveler (Bouton Paiement)
    const btnRenew = document.getElementById('btn-renew');
    if(btnRenew) btnRenew.addEventListener('click', () => {
        alert("Intégration Paiement à venir (Flutterwave/Orange Money)");
        // startPayment(); // Appelera la fonction de paiement quand configurée
    });
}

// --- 4. UTILITAIRES ---
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