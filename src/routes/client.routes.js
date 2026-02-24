// src/routes/client.routes.js
const express = require('express');
const router = express.Router();
const clientController = require('../controllers/client.controller');

// ==========================================
// 👤 DASHBOARD & PROFIL CLIENT
// ==========================================

/**
 * @route   GET /api/clients/profile/:phone
 * @desc    Récupérer les infos complètes d'un client
 */
router.get('/profile/:phone', clientController.getProfile);

/**
 * @route   PUT /api/clients/profile/:phone
 * @desc    Mettre à jour le prénom, nom et numéro de paiement
 */
router.put('/profile/:phone', clientController.updateProfile);

/**
 * @route   GET /api/clients/history/:phone
 * @desc    Récupérer toutes les courses passées d'un client (Historique)
 */
router.get('/history/:phone', clientController.getHistory);


// ==========================================
// 📦 GESTION DES COMMANDES (FLUX DIRECT)
// ==========================================

/**
 * @route   POST /api/clients/order
 * @desc    Créer une commande directement (sans passer par le lien magique)
 */
router.post('/order', clientController.createOrder); 

/**
 * @route   GET /api/clients/order/:orderId
 * @desc    Vérifier le statut d'une commande spécifique (Tracking)
 */
router.get('/order/:orderId', clientController.checkStatus);


// ==========================================
// ⚠️ ROUTES OBSOLÈTES (V1)
// ==========================================
// Ces routes sont conservées pour éviter les plantages si d'anciens liens existent encore.
router.get('/resolve/:token', clientController.resolveOrderToken);
router.post('/validate-dropoff', clientController.validateDropoff);

module.exports = router;