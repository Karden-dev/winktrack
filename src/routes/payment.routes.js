const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');

// URL: /api/payment/initiate
// Appelé quand le livreur clique sur "Payer 150 FCFA"
router.post('/initiate', paymentController.initiatePayment);

// URL: /api/payment/webhook
// Appelé par FLUTTERWAVE automatiquement quand le paiement est validé
router.post('/webhook', paymentController.handleWebhook);

module.exports = router;