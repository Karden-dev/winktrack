// --- CONFIGURATION ---
const API_BASE = '/api/track';
const TARGET_ACCURACY = 15; // Cible : 15 mètres ou mieux
const TIMEOUT_MS = 20000;   // 20 secondes max (un peu plus long pour laisser le temps d'affiner)
let currentSlug = '';
let riderPhone = '';
let messageTemplate = '';

// --- TEXTES DYNAMIQUES (Le Cœur du Système) ---
const GPS_MESSAGES = {
    searching: [
        "📡 Initialisation du satellite...",
        "🛰️ Recherche des signaux GPS...",
        "⏳ Connexion en cours..."
    ],
    poor: [
        "🌤️ Signal faible. Mettez-vous à ciel ouvert svp.",
        "🌳 Évitez les arbres ou les toits...",
        "📡 Calibration en cours (Précision > 50m)..."
    ],
    medium: [
        "🔄 On se rapproche ! Restez immobile.",
        "📍 Affinement de la position...",
        "🆗 C'est presque bon (Précision ~30m)..."
    ],
    good: [
        "✅ Signal Excellent ! Verrouillage...",
        "💎 Précision parfaite. On y est !",
        "🚀 Localisation réussie !"
    ]
};

// --- ÉLÉMENTS DOM ---
const views = {
    loading: document.getElementById('loading-state'),
    profile: document.getElementById('profile-state'),
    gps: document.getElementById('gps-state'),
    success: document.getElementById('success-state'),
    error: document.getElementById('error-state')
};

// --- 1. INITIALISATION ---
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    currentSlug = urlParams.get('slug');

    if (!currentSlug) {
        showError("Lien invalide", "Aucun identifiant de livraison trouvé.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/resolve/${currentSlug}`);
        const data = await response.json();

        if (!response.ok) {
            showError("Lien Invalide", data.error || "Impossible de charger les infos.");
            return;
        }

        displayRiderProfile(data.rider);
        
    } catch (err) {
        showError("Erreur Connexion", "Vérifiez votre connexion internet.");
    }
});

// --- 2. AFFICHAGE PROFIL ---
function displayRiderProfile(rider) {
    document.getElementById('rider-name').textContent = rider.name;
    document.getElementById('rider-vehicle').textContent = rider.type || 'Livreur';
    document.getElementById('rider-rating').textContent = rider.rating || "5.0";
    
    riderPhone = rider.phone;
    messageTemplate = rider.messageTemplate || "📍 Voici ma position exacte :";

    // Gestion photo
    const photoEl = document.getElementById('rider-photo');
    if (rider.photo) {
        photoEl.src = rider.photo;
    } else {
        // Fallback propre
        photoEl.src = `https://ui-avatars.com/api/?name=${rider.name}&background=10B981&color=fff&size=128`;
    }

    switchState('profile');
    document.getElementById('btn-share').addEventListener('click', startSniperGPS);
}

// --- 3. LOGIQUE GPS "SNIPER" ---
function startSniperGPS() {
    switchState('gps');
    updateStatusText(GPS_MESSAGES.searching[0], 'searching'); // Message de départ

    if (!navigator.geolocation) {
        showError("Erreur GPS", "Votre téléphone ne supporte pas la géolocalisation.");
        return;
    }

    let bestCoords = null;
    let bestAccuracy = 9999;
    let watchId = null;

    // Timer de sécurité
    const timeoutId = setTimeout(() => {
        finishGPS(bestCoords, watchId);
    }, TIMEOUT_MS);

    // Lancement du Radar
    watchId = navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            
            // Mise à jour de l'UI intelligente
            updateRadarUI(accuracy);

            if (accuracy < bestAccuracy) {
                bestAccuracy = accuracy;
                bestCoords = { latitude, longitude, accuracy };
            }

            // BINGO
            if (accuracy <= TARGET_ACCURACY) {
                clearTimeout(timeoutId);
                // Petit délai pour laisser l'utilisateur voir le message "Vert"
                updateStatusText(GPS_MESSAGES.good[0], 'good');
                setTimeout(() => finishGPS(bestCoords, watchId), 800);
            }
        },
        (error) => {
            console.warn("Erreur GPS:", error);
            if (error.code === 1) { // Refus permission
                clearTimeout(timeoutId);
                showError("Permission Refusée", "Vous devez autoriser la localisation pour que le livreur vous trouve.");
            }
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
}

// --- 4. INTELLIGENCE UI (Animation & Texte) ---
let lastMessageCategory = ''; // Pour ne pas changer le texte trop souvent

function updateRadarUI(accuracy) {
    const bar = document.getElementById('accuracy-bar');
    const accuracyVal = document.getElementById('accuracy-val');
    
    // Mise à jour chiffre
    accuracyVal.textContent = Math.round(accuracy);
    
    // Calcul pourcentage barre (Logarithmique pour que ça bouge vite au début)
    // 100m -> 10%, 20m -> 80%, 10m -> 100%
    let percent = 0;
    if (accuracy > 100) percent = 10;
    else if (accuracy > 50) percent = 40;
    else if (accuracy > 20) percent = 75;
    else percent = 100;

    bar.style.width = `${percent}%`;

    // Décision du message à afficher
    let category = 'searching';
    let colorClass = 'searching'; // CSS class

    if (accuracy <= TARGET_ACCURACY + 5) { // < 20m
        category = 'good';
        colorClass = 'good';
    } else if (accuracy <= 50) { // 20m - 50m
        category = 'medium';
        colorClass = 'medium';
    } else { // > 50m
        category = 'poor';
        colorClass = 'poor';
    }

    // On change le texte seulement si la catégorie change (évite le clignotement)
    if (category !== lastMessageCategory) {
        // Prend un message aléatoire dans la catégorie pour rendre ça vivant
        const messages = GPS_MESSAGES[category];
        const randomMsg = messages[Math.floor(Math.random() * messages.length)];
        
        updateStatusText(randomMsg, colorClass);
        lastMessageCategory = category;
    }
}

function updateStatusText(msg, type) {
    const statusEl = document.querySelector('#gps-state h3'); // Le titre "Localisation..."
    const hintEl = document.querySelector('.hint'); // Le petit texte en bas
    const bar = document.getElementById('accuracy-bar');

    // Animation de transition
    statusEl.style.opacity = 0;
    setTimeout(() => {
        statusEl.textContent = msg;
        statusEl.style.opacity = 1;
        
        // Couleurs
        if (type === 'good') {
            statusEl.style.color = '#10B981'; // Vert
            bar.style.backgroundColor = '#10B981';
            hintEl.textContent = "Ne bougez plus, c'est parfait !";
        } else if (type === 'medium') {
            statusEl.style.color = '#F59E0B'; // Orange
            bar.style.backgroundColor = '#F59E0B';
            hintEl.textContent = "On y est presque...";
        } else {
            statusEl.style.color = '#EF4444'; // Rouge
            bar.style.backgroundColor = '#EF4444';
            hintEl.textContent = "Cherchez une zone dégagée 🌤️";
        }
    }, 200);
}


// --- 5. FIN & REDIRECTION ---
async function finishGPS(coords, watchId) {
    if (watchId) navigator.geolocation.clearWatch(watchId);
    
    if (!coords) {
        showError("Signal Faible", "Impossible de trouver une position précise. Réessayez à ciel ouvert.");
        return;
    }

    switchState('success');

    // Envoi stats
    try {
        await fetch(`${API_BASE}/success`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                slug: currentSlug,
                lat: coords.latitude,
                lng: coords.longitude,
                accuracy: coords.accuracy
            })
        });
    } catch (e) { console.error("Erreur stats", e); }

    // Construction lien WhatsApp
    const mapsLink = `https://www.google.com/maps/search/?api=1&query=${coords.latitude},${coords.longitude}`;
    const text = `👋 ${messageTemplate}\n${mapsLink}`;
    const waUrl = `https://wa.me/${riderPhone}?text=${encodeURIComponent(text)}`;

    setTimeout(() => {
        window.location.href = waUrl;
    }, 2000);
}

// --- UTILITAIRES ---
function switchState(stateName) {
    Object.values(views).forEach(el => el.classList.add('hidden'));
    views[stateName].classList.remove('hidden');
}

function showError(title, msg) {
    switchState('error');
    document.getElementById('error-title').textContent = title;
    document.getElementById('error-msg').textContent = msg;
}