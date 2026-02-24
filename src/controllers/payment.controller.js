// src/controllers/payment.controller.js
const TransactionModel = require('../models/transaction.model');
const ClientModel = require('../models/client.model');
const RiderModel = require('../models/rider.model');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Clés Campay (si utilisées)
const CAMPAY_TOKEN = process.env.CAMPAY_TOKEN;

/**
 * 1. INITIALISER LE PAIEMENT (Recharge Wallet ou Paiement Commande)
 */
exports.initiatePayment = async (req, res) => {
    try {
        let { phone, amount, userType } = req.body; // userType: 'CLIENT' ou 'RIDER'

        // Nettoyage du numéro
        phone = phone.replace(/\D/g, ''); 
        if (!phone.startsWith('237')) phone = '237' + phone;

        // Vérification de l'utilisateur
        let user = null;
        if (userType === 'RIDER') {
            user = await RiderModel.findByPhone(req.body.phone);
        } else {
            user = await ClientModel.findByPhone(req.body.phone);
        }

        if (!user) {
            return res.status(404).json({ success: false, error: "Utilisateur introuvable." });
        }

        // --- ICI : Logique d'appel à l'API de Paiement (ex: Campay, CinetPay) ---
        // Pour l'instant, on simule une réponse positive pour avancer
        const externalRef = `PAY-${uuidv4().substring(0, 8)}`;

        console.log(`💳 Paiement initié pour ${userType} ${phone} : ${amount} FCFA`);

        // On renvoie la référence au frontend
        res.json({ 
            success: true, 
            message: "Validez le paiement sur votre mobile.",
            ref: externalRef
        });

    } catch (error) {
        console.error("❌ ERREUR INIT PAIEMENT:", error.message);
        res.status(500).json({ success: false, error: "Erreur paiement" });
    }
};

/**
 * 2. WEBHOOK (Validation du paiement)
 * Appelé par le fournisseur de paiement quand c'est validé
 */
exports.handleWebhook = async (req, res) => {
    try {
        const event = req.body;
        console.log("Webhook reçu:", event);

        // --- Simulation de traitement ---
        // Dans la vraie vie : vérifier la signature, trouver l'user, créditer le wallet
        
        // Exemple : Si succès, on crédite le wallet via le Modèle
        // await ClientModel.updateWallet(userId, amount);
        
        res.sendStatus(200);
    } catch (error) {
        console.error("❌ ERREUR WEBHOOK:", error);
        res.sendStatus(500);
    }
};