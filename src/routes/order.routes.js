// src/routes/order.routes.js
const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/order.controller');
const OrderModel = require('../models/order.model');

// ============================================================
// 1. FLUX CLIENT & DESTINATAIRE (MAGIC LINK)
// ============================================================

// Initier la commande (Expéditeur crée le lien)
router.post('/initiate', OrderController.initiateOrder);

// Résoudre le token du Magic Link (Le destinataire clique)
router.get('/token/:token', OrderController.resolveToken);

// Confirmer la destination finale (Le destinataire valide)
router.post('/confirm-destination', OrderController.confirmDestination);

// Confirmer le paiement et lancer la recherche (L'expéditeur paie)
router.post('/finalize', OrderController.finalizeAndPay);

// ============================================================
// 2. ACTIONS LIVREUR (MissionsPage.jsx)
// ============================================================

/**
 * MISE À JOUR DU STATUT (Acceptation, Ramassage, Livraison)
 * Cette fonction unique remplace validatePickup et validateDelivery
 */
router.put('/status/:orderId', OrderController.updateStatus);

// ============================================================
// 3. ADMINISTRATION (BACK-OFFICE)
// ============================================================

// Récupérer toutes les commandes (AdminOrdersPage.jsx)
router.get('/all', OrderController.getAllOrders);

// Récupérer les commandes actives pour la carte (AdminDashboard.jsx)
router.get('/status/active', OrderController.getActiveOrders);

// ============================================================
// 4. TRACKING & ÉTAT (TRACKING PAGE)
// ============================================================

/**
 * RÉCUPÉRER L'ÉTAT D'UNE COMMANDE
 * Gère à la fois l'ID (Expéditeur) et le TOKEN (Destinataire)
 */
router.get('/:identifier', async (req, res) => {
    try {
        const { identifier } = req.params;
        let order;

        // Si l'identifiant est un nombre, on cherche par ID (Expéditeur)
        if (!isNaN(identifier)) {
            order = await OrderModel.findById(identifier);
        } else {
            // Sinon, c'est le TOKEN (Destinataire via Magic Link)
            order = await OrderModel.findByToken(identifier);
        }

        if (!order) {
            return res.status(404).json({ error: "Commande introuvable ou lien expiré" });
        }
        
        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error("Erreur Get Order Status:", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

module.exports = router;