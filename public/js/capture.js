// --- CONFIGURATION ---
const API_BASE = '/api/track';
const TARGET_ACCURACY = 15; // Cible : 15 mètres ou mieux
const TIMEOUT_MS = 20000;   // 20 secondes max
let currentSlug = '';
let riderPhone = '';
let messageTemplate = '';

// --- TEXTES DYNAMIQUES ---
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

    const photoEl = document.getElementById('rider-photo');
    if (rider.photo) {
        photoEl.src = rider.photo;
    } else {
        photoEl.src = `https://ui-avatars.com/api/?name=${rider.name}&background=10B981&color=fff&size=128`;
    }

    switchState('profile');
    document.getElementById('btn-share').addEventListener('click', startSniperGPS);
}

// --- 3. LOGIQUE GPS "SNIPER" ---
function startSniperGPS() {
    switchState('gps');
    updateStatusText(GPS_MESSAGES.searching[0], 'searching');

    if (!navigator.geolocation) {
        showError("Erreur GPS", "Votre téléphone ne supporte pas la géolocalisation.");
        return;
    }

    let bestCoords = null;
    let bestAccuracy = 9999;
    let watchId = null;

    const timeoutId = setTimeout(() => {
        finishGPS(bestCoords, watchId);
    }, TIMEOUT_MS);

    watchId = navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            updateRadarUI(accuracy);

            if (accuracy < bestAccuracy) {
                bestAccuracy = accuracy;
                bestCoords = { latitude, longitude, accuracy };
            }

            if (accuracy <= TARGET_ACCURACY) {
                clearTimeout(timeoutId);
                updateStatusText(GPS_MESSAGES.good[0], 'good');
                setTimeout(() => finishGPS(bestCoords, watchId), 800);
            }
        },
        (error) => {
            console.warn("Erreur GPS:", error);
            if (error.code === 1) {
                clearTimeout(timeoutId);
                showError("Permission Refusée", "Vous devez autoriser la localisation.");
            }
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
}

// --- 4. INTELLIGENCE UI ---
let lastMessageCategory = '';

function updateRadarUI(accuracy) {
    const bar = document.getElementById('accuracy-bar');
    const accuracyVal = document.getElementById('accuracy-val');
    accuracyVal.textContent = Math.round(accuracy);
    
    let percent = accuracy > 100 ? 10 : accuracy > 50 ? 40 : accuracy > 20 ? 75 : 100;
    bar.style.width = `${percent}%`;

    let category = accuracy <= TARGET_ACCURACY + 5 ? 'good' : accuracy <= 50 ? 'medium' : 'poor';
    let colorClass = category;

    if (category !== lastMessageCategory) {
        const messages = GPS_MESSAGES[category];
        const randomMsg = messages[Math.floor(Math.random() * messages.length)];
        updateStatusText(randomMsg, colorClass);
        lastMessageCategory = category;
    }
}

function updateStatusText(msg, type) {
    const statusEl = document.querySelector('#gps-state h3');
    const hintEl = document.querySelector('.hint');
    const bar = document.getElementById('accuracy-bar');

    statusEl.style.opacity = 0;
    setTimeout(() => {
        statusEl.textContent = msg;
        statusEl.style.opacity = 1;
        
        if (type === 'good') {
            statusEl.style.color = '#10B981';
            bar.style.backgroundColor = '#10B981';
            hintEl.textContent = "Ne bougez plus, c'est parfait !";
        } else if (type === 'medium') {
            statusEl.style.color = '#F59E0B';
            bar.style.backgroundColor = '#F59E0B';
            hintEl.textContent = "On y est presque...";
        } else {
            statusEl.style.color = '#EF4444';
            bar.style.backgroundColor = '#EF4444';
            hintEl.textContent = "Cherchez une zone dégagée 🌤️";
        }
    }, 200);
}

// --- 5. FIN & REDIRECTION ---
async function finishGPS(coords, watchId) {
    if (watchId) navigator.geolocation.clearWatch(watchId);
    
    if (!coords) {
        showError("Signal Faible", "Impossible de trouver une position précise.");
        return;
    }

    switchState('success');

    // --- CORRECTION ULTIME COMPTEUR (SendBeacon + Fetch Keepalive) ---
    const payload = JSON.stringify({
        slug: currentSlug,
        lat: coords.latitude,
        lng: coords.longitude,
        accuracy: coords.accuracy
    });

    try {
        // Méthode 1 : sendBeacon (Le plus fiable pour la fermeture de page)
        if (navigator.sendBeacon) {
            const blob = new Blob([payload], { type: 'application/json' });
            const sent = navigator.sendBeacon(`${API_BASE}/success`, blob);
            if(!sent) throw new Error("Beacon failed");
        } 
        // Méthode 2 : Fetch Keepalive (Backup pour anciens téléphones)
        else {
            fetch(`${API_BASE}/success`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: payload,
                keepalive: true 
            });
        }
    } catch (e) { 
        console.error("Erreur envoi stats:", e); 
    }

    // Nettoyage et formatage du numéro du livreur pour WhatsApp
    let cleanPhone = riderPhone.replace(/\D/g, ''); 
    const defaultPrefix = "237"; 
    if (!cleanPhone.startsWith(defaultPrefix)) {
        cleanPhone = defaultPrefix + cleanPhone;
    }

    // URL Google Maps standard (Universelle)
    const mapsLink = `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`;
    
    // Construction du message WhatsApp
    const text = `👋 ${messageTemplate}\n📍 Ma position exacte : ${mapsLink}`;
    
    // Lien wa.me international forcé
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;

    // Délai pour laisser l'animation de succès se jouer
    setTimeout(() => {
        window.location.href = waUrl;
    }, 1500);
}

function switchState(stateName) {
    Object.values(views).forEach(el => el.classList.add('hidden'));
    views[stateName].classList.remove('hidden');
}

function showError(title, msg) {
    switchState('error');
    document.getElementById('error-title').textContent = title;
    document.getElementById('error-msg').textContent = msg;
}