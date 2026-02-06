const express = require('express');
const router = express.Router();
const trackController = require('../controllers/track.controller');
const SubscriberModel = require('../models/subscriber.model'); // Nécessaire pour le compteur
const GpsLogModel = require('../models/gps.log.model');

// URL: /api/track/resolve/:slug
// Appelé quand le CLIENT clique sur le lien (ex: wink.track/abcd)
router.get('/resolve/:slug', trackController.resolveLink);

// URL: /api/track/success
// Appelé par la page GPS quand la position est bien envoyée sur WhatsApp
// Sert à dire : "Bravo, +1 livraison pour ce livreur"
router.post('/success', async (req, res) => {
    try {
        const { slug, lat, lng, accuracy } = req.body;
        
        // 1. On retrouve le livreur via le slug
        const rider = await SubscriberModel.findBySlug(slug);
        
        if (rider) {
            // --- AJOUT LOGS POUR DEBUG ---
            console.log(`✅ STAT SUCCESS pour ${rider.first_name} (ID: ${rider.id})`);

            // 2. On incrémente son compteur (+1)
            await SubscriberModel.incrementStats(rider.id);
            
            // 3. (Optionnel) On enregistre la preuve dans les logs
            // On suppose que le frontend envoie aussi lat/lng
            if (lat && lng) {
                await GpsLogModel.create({
                    subscriber_id: rider.id,
                    latitude: lat,
                    longitude: lng,
                    accuracy: accuracy || 0,
                    user_agent: req.headers['user-agent'] || 'Unknown'
                });
            }
            
            res.json({ success: true });
        } else {
            // --- AJOUT LOGS POUR DEBUG ---
            console.warn(`⚠️ STAT ÉCHOUÉE : Slug inconnu (${slug})`);
            res.status(404).json({ error: "Livreur introuvable" });
        }
    } catch (error) {
        console.error("❌ Erreur stat success:", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

module.exports = router;