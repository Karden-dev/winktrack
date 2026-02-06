const express = require('express');
const router = express.Router();
const riderController = require('../controllers/rider.controller');

// ==========================================
// 1. DASHBOARD & SETTINGS (EXISTANT)
// ==========================================

// Récupérer les infos du livreur (Stats, Solde, Profil)
router.get('/me', riderController.getDashboardInfo);

// Changer le statut (En Ligne / Hors Ligne)
router.post('/status', riderController.toggleStatus);

// Mettre à jour le message personnalisé (Optionnel)
router.post('/message', riderController.updateMessage);


// ==========================================
// 2. GESTION DES COURSES (NOUVEAU - "UBER")
// ==========================================

// LE RADAR : Voir les courses disponibles (Payées, sans livreur)
router.get('/orders/available', riderController.getAvailableOrders);

// ACCEPTER : Assigner le livreur à une course
router.post('/orders/accept', riderController.acceptOrder);

// MISSION : Mettre à jour l'étape (Pickup -> Delivered)
router.post('/orders/update', riderController.updateOrderState);

module.exports = router;