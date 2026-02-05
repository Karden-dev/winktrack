const API_BASE = '/api/rider';
const PAYMENT_API = '/api/payment';
const currentUserPhone = localStorage.getItem('wink_phone');

// Variable pour le polling (Vérification paiement)
let pollInterval = null; 

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
        window.riderData = data; 
        
        // Remplissage de l'UI
        document.getElementById('rider-name').textContent = data.name;
        
        // Stats Jours restants
        const daysEl = document.getElementById('stat-days');
        daysEl.textContent = data.stats.daysLeft;
        
        // Couleur dynamique
        if (data.stats.daysLeft <= 3) {
            daysEl.style.color = '#DC2626'; // Rouge
        } else {
            daysEl.style.color = '#10B981'; // Vert
        }

        document.getElementById('stat-deliveries').textContent = data.stats.deliveries || 0;
        document.getElementById('stat-rating').textContent = data.stats.rating || "5.0";
        document.getElementById('toggle-online').checked = data.settings.isOnline === 1;
        updateStatusUI(data.settings.isOnline === 1);
        
        // Gestion Alerte Expiration
        if (data.stats.isExpired) {
            document.getElementById('alert-expired').classList.remove('hidden');
        } else {
            document.getElementById('alert-expired').classList.add('hidden');
        }
        
        // Parrainage
        if (data.referral) {
            document.getElementById('referral-code-display').textContent = data.referral.code;
            document.getElementById('referral-count').textContent = data.stats.referralCount;
        }

        // Liens cachés pour le copier/coller
        document.getElementById('magic-link').value = data.link;
        
        // Aperçu du lien dans le texte (S'assure que l'élément existe)
        const linkPreview = document.getElementById('link-preview');
        if(linkPreview) linkPreview.textContent = data.link.replace('https://', '');

    } catch (err) { console.error("Erreur chargement dashboard:", err); }
}

// --- 2. GESTION DES ÉVÉNEMENTS ---
function setupEventListeners() {
    // Bouton Renouveler
    const btnRenew = document.getElementById('btn-renew');
    if(btnRenew) btnRenew.addEventListener('click', openPaymentModal);

    // Fermeture Modal
    document.getElementById('close-modal').addEventListener('click', closePaymentModal);

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

    // --- LOGIQUE DE PARTAGE (Ton code personnalisé) ---
    
    // 1. Bouton WhatsApp (Envoi direct)
    const btnShareWa = document.getElementById('btn-share-wa');
    if(btnShareWa) {
        btnShareWa.addEventListener('click', () => {
            const link = document.getElementById('magic-link').value;
            const text = `Bonjour, pour faciliter la livraison, confirmez votre position via ce lien sécurisé :\n📍 ${link}`;
            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
        });
    }

    // 2. Bouton Copier MESSAGE COMPLET
    const btnCopyMsg = document.getElementById('btn-copy-msg');
    if(btnCopyMsg) {
        btnCopyMsg.addEventListener('click', () => {
            const link = document.getElementById('magic-link').value;
            const text = `Bonjour, pour faciliter la livraison, confirmez votre position via ce lien sécurisé :\n📍 ${link}`;
            navigator.clipboard.writeText(text).then(() => {
                showFeedback('btn-copy-msg', "Message Copié ! ✅");
            });
        });
    }

    // 3. Bouton Copier LIEN SEUL
    const btnCopyLink = document.getElementById('btn-copy-link');
    if(btnCopyLink) {
        btnCopyLink.addEventListener('click', () => {
            const linkInput = document.getElementById('magic-link');
            linkInput.select();
            linkInput.setSelectionRange(0, 99999); // Mobile
            navigator.clipboard.writeText(linkInput.value).then(() => {
                showFeedback('btn-copy-link', "Lien Copié ! ✅");
            });
        });
    }

    // 4. Inviter un ami (Parrainage)
    const btnReferral = document.getElementById('btn-share-referral');
    if(btnReferral) {
        btnReferral.addEventListener('click', () => {
            const myCode = document.getElementById('referral-code-display').textContent;
            const shareText = `🚀 Salut ! Utilise Wink Track pour tes livraisons. \n🎁 Inscris-toi avec mon code *${myCode}* et gagne 3 jours offerts !\n🔗 https://track.winkexpress.online`;
            window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
        });
    }
}

// Fonction utilitaire pour changer le texte du bouton temporairement
function showFeedback(btnId, msg) {
    const btn = document.getElementById(btnId);
    if(!btn) return;
    const originalText = btn.textContent;
    btn.textContent = msg;
    btn.style.background = "#10B981"; // Vert temporaire
    btn.style.color = "white";
    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = ""; // Retour style CSS
        btn.style.color = "";
    }, 2000);
}


// --- 3. LOGIQUE PAIEMENT (CAMPAY - NOUVELLE VERSION) ---

function openPaymentModal() {
    document.getElementById('payment-modal').classList.remove('hidden');
    // On réinitialise toujours à l'étape 1
    switchPaymentStep(1);
    // On pré-remplit le numéro
    document.getElementById('pay-phone').value = currentUserPhone;
}

function closePaymentModal() {
    document.getElementById('payment-modal').classList.add('hidden');
    stopPolling(); // Arrêt de la surveillance
}

function switchPaymentStep(step) {
    // Cache tout
    document.getElementById('payment-step-1').classList.add('hidden');
    document.getElementById('payment-step-loading').classList.add('hidden');
    document.getElementById('payment-step-success').classList.add('hidden');

    // Affiche l'étape demandée
    if(step === 1) document.getElementById('payment-step-1').classList.remove('hidden');
    if(step === 2) document.getElementById('payment-step-loading').classList.remove('hidden');
    if(step === 3) document.getElementById('payment-step-success').classList.remove('hidden');
}

async function initiatePayment() {
    const phone = document.getElementById('pay-phone').value.replace(/\s/g, '');
    const btn = document.getElementById('btn-pay-confirm');

    if (phone.length < 9) { alert("Numéro invalide."); return; }
    
    // Feedback visuel
    btn.textContent = "Connexion...";
    btn.disabled = true;

    try {
        const res = await fetch(`${PAYMENT_API}/initiate`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                phone: phone,
                amount: 150 
            })
        });

        const data = await res.json();
        
        if (data.success) {
            // Succès : On passe à l'écran de chargement et on lance le polling
            switchPaymentStep(2);
            startPolling(data.ref);
        } else {
            alert("Erreur: " + data.error);
        }
    } catch (err) {
        console.error(err);
        alert("Erreur de connexion.");
    } finally {
        btn.disabled = false;
        btn.textContent = "🔒 Payer 150 FCFA";
    }
}

// Fonction de surveillance du statut (Polling)
function startPolling(reference) {
    if(pollInterval) clearInterval(pollInterval);

    pollInterval = setInterval(async () => {
        try {
            const res = await fetch(`${PAYMENT_API}/status/${reference}`);
            const data = await res.json();

            if (data.status === 'success') {
                stopPolling();
                switchPaymentStep(3); // Affiche l'écran succès
                loadDashboard(); // Met à jour les infos en arrière-plan
            }
        } catch (e) {
            console.error("Polling error", e);
        }
    }, 3000); // Vérifie toutes les 3 secondes
}

function stopPolling() {
    if(pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
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