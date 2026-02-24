// src/controllers/google.controller.js
const googleService = require('../services/google.service');

// Fonction utilitaire pour centraliser la gestion des erreurs
const handleServiceError = (res, message) => {
    res.status(500).json({ success: false, error: message });
};

// 1. RECHERCHE D'ADRESSE (Autocomplete)
exports.autocomplete = async (req, res) => {
    try {
        const { input } = req.query;
        if (!input) return res.status(400).json({ error: "Texte de recherche requis" });

        // Appel au service centralisé
        const data = await googleService.getAutocomplete(input);
        res.json(data);
    } catch (error) {
        handleServiceError(res, "Erreur lors de l'autocomplétion");
    }
};

// 2. GPS VERS ADRESSE (Reverse Geocoding)
exports.reverseGeocode = async (req, res) => {
    try {
        const { lat, lng } = req.query;
        if (!lat || !lng) return res.status(400).json({ error: "Coordonnées requises" });

        // Appel au service (Lat/Lng -> Adresse)
        const result = await googleService.getAddressFromCoords(lat, lng);
        
        if (result) {
            // Nettoyage de l'adresse pour le frontend (optionnel)
            const shortAddress = result.address.replace(', Cameroun', '');
            res.json({ 
                success: true, 
                address: shortAddress, 
                placeId: result.place_id 
            });
        } else {
            res.json({ success: false, address: "Lieu inconnu" });
        }
    } catch (error) {
        handleServiceError(res, "Erreur de géocodage inverse");
    }
};

// 3. CALCUL D'ITINÉRAIRE (Distance Matrix)
exports.calculateRoute = async (req, res) => {
    try {
        const { origin, destination } = req.body;
        if (!origin || !destination) return res.status(400).json({ error: "Origine et destination requises" });

        // Utilise la puissance du service pour le calcul de distance/durée
        const routeData = await googleService.getDistanceMatrix(origin, destination);

        if (routeData) {
            res.json({
                success: true,
                distanceKm: routeData.distanceKm,
                durationMin: routeData.durationMin
            });
        } else {
            res.status(404).json({ error: "Aucun itinéraire trouvé" });
        }
    } catch (error) {
        handleServiceError(res, "Erreur lors du calcul d'itinéraire");
    }
};

// 4. DÉTAILS D'UN LIEU (Place ID -> Lat/Lng)
exports.getPlaceDetails = async (req, res) => {
    try {
        const { placeId } = req.query;
        if (!placeId) return res.status(400).json({ error: "Place ID requis" });

        const details = await googleService.getPlaceDetails(placeId);

        if (details) {
            res.json({
                success: true,
                lat: details.lat,
                lng: details.lng,
                address: details.address
            });
        } else {
            res.status(400).json({ error: "Impossible de récupérer les détails" });
        }
    } catch (error) {
        handleServiceError(res, "Erreur lors de la récupération des détails du lieu");
    }
};