// --- CONFIGURATION ---
const API_BASE = '/api/track';
const TARGET_ACCURACY = 15; // On vise 15 mètres ou mieux
const TIMEOUT_MS = 15000;   // 15 secondes max avant d'abandonner et prendre la meilleure
let currentSlug = '';
let riderPhone = '';
let messageTemplate = ''; // Pour stocker le message perso du livreur

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
    // Récupérer le slug depuis l'URL (ex: /capture.html?id=moussa-123 ou path rewriting)
    // Pour ce prototype, on supporte les query params: capture.html?slug=xyz
    const urlParams = new URLSearchParams(window.location.search);
    currentSlug = urlParams.get('slug');

    // Si tu utilises le routing propre (track.wink.com/xyz), décommente ceci :
    // currentSlug = window.location.pathname.split('/').pop();

    if (!currentSlug) {
        showError("Lien invalide", "Aucun identifiant de livraison trouvé.");
        return;
    }

    // Appeler l'API pour vérifier le lien
    try {
        const response = await fetch(`${API_BASE}/resolve/${currentSlug}`);
        const data = await response.json();

        if (!response.ok) {
            showError("Lien Invalide", data.error || "Impossible de charger les infos.");
            return;
        }

        // Si tout est OK, on affiche le profil
        displayRiderProfile(data.rider);
        
    } catch (err) {
        showError("Erreur Connexion", "Vérifiez votre connexion internet.");
    }
});

// --- 2. AFFICHAGE PROFIL ---
function displayRiderProfile(rider) {
    document.getElementById('rider-name').textContent = rider.name;
    document.getElementById('rider-vehicle').textContent = rider.type; // Moto/Voiture
    document.getElementById('rider-rating').textContent = rider.rating || "5.0";
    
    // Sauvegarde des infos pour la redirection
    riderPhone = rider.phone;
    messageTemplate = rider.messageTemplate || "📍 Voici ma position exacte :";

    // Si le livreur a une photo custom
    if (rider.photo) {
        document.getElementById('rider-photo').src = rider.photo;
    } else {
         document.getElementById('rider-photo').src = `https://ui-avatars.com/api/?name=${rider.name}&background=10B981&color=fff`;
    }

    switchState('profile');

    // Attacher l'événement au bouton
    document.getElementById('btn-share').addEventListener('click', startSniperGPS);
}

// --- 3. LOGIQUE GPS "SNIPER" ---
function startSniperGPS() {
    switchState('gps');

    if (!navigator.geolocation) {
        showError("Erreur GPS", "Votre téléphone ne supporte pas la géolocalisation.");
        return;
    }

    let bestCoords = null;
    let bestAccuracy = 9999;
    let watchId = null;

    // Timer de sécurité (Si après 15s on n'a pas 10m, on prend ce qu'on a)
    const timeoutId = setTimeout(() => {
        finishGPS(bestCoords, watchId);
    }, TIMEOUT_MS);

    // Lancement du Radar
    watchId = navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            
            // Mise à jour visuelle
            updateRadarUI(accuracy);

            // On garde toujours la meilleure position trouvée
            if (accuracy < bestAccuracy) {
                bestAccuracy = accuracy;
                bestCoords = { latitude, longitude, accuracy };
            }

            // BINGO : Si précision suffisante, on arrête tout de suite
            if (accuracy <= TARGET_ACCURACY) {
                clearTimeout(timeoutId);
                finishGPS(bestCoords, watchId);
            }
        },
        (error) => {
            console.warn("Erreur GPS:", error);
            // On continue d'essayer, ne pas bloquer tout de suite sauf si erreur fatale
            if (error.code === 1) { // PERMISSION_DENIED
                clearTimeout(timeoutId);
                showError("Permission Refusée", "Vous devez autoriser la localisation pour que le livreur vous trouve.");
            }
        },
        {
            enableHighAccuracy: true, // FORCE LE CHIPSET GPS
            timeout: 5000,
            maximumAge: 0 // PAS DE CACHE
        }
    );
}

function updateRadarUI(accuracy) {
    const el = document.getElementById('accuracy-val');
    const bar = document.getElementById('accuracy-bar');
    
    el.textContent = Math.round(accuracy);
    
    // Animation de la barre (100m = 0%, 10m = 100%)
    let percent = 100 - Math.min(accuracy, 100);
    if (accuracy <= 15) percent = 100;
    
    bar.style.width = `${percent}%`;
    
    // Change couleur selon précision
    if (accuracy < 20) bar.style.backgroundColor = "#10B981"; // Vert
    else if (accuracy < 50) bar.style.backgroundColor = "#FBBF24"; // Orange
    else bar.style.backgroundColor = "#EF4444"; // Rouge
}

// --- 4. FIN & REDIRECTION ---
async function finishGPS(coords, watchId) {
    if (watchId) navigator.geolocation.clearWatch(watchId);
    
    if (!coords) {
        showError("Signal Faible", "Impossible de trouver une position précise. Réessayez à ciel ouvert.");
        return;
    }

    switchState('success');

    // 1. Envoyer la confirmation au serveur (pour les stats)
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
    } catch (e) {
        console.error("Erreur log stats", e);
    }

    // 2. Construire le lien WhatsApp
    // Format lien Maps : https://maps.google.com/?q=LAT,LNG
    const mapsLink = `https://maps.google.com/?q=${coords.latitude},${coords.longitude}`;
    
    // Message personnalisé
    const text = `👋 ${messageTemplate}\n${mapsLink}`;
    
    const waUrl = `https://wa.me/${riderPhone}?text=${encodeURIComponent(text)}`;

    // 3. Redirection finale (Petit délai pour l'effet Wow)
    setTimeout(() => {
        window.location.href = waUrl;
    }, 1500);
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