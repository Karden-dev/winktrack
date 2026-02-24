const axios = require('axios');
const OrderModel = require('../models/order.model');
const ClientModel = require('../models/client.model');
const TransactionModel = require('../models/transaction.model');

class PaymentService {
    constructor() {
        this.campayApiUrl = process.env.CAMPAY_API_URL || 'https://www.campay.net/api';
        this.token = process.env.CAMPAY_TOKEN;
    }

    /**
     * 1. INITIALISER LA DEMANDE DE PAIEMENT (Momo/OM)
     * Envoie le push sur le téléphone du client.
     */
    async requestPayment(orderId, phone, amount) {
        try {
            // Dans un cas réel, on appellerait l'API Campay ici
            // const response = await axios.post(`${this.campayApiUrl}/collect/`, {
            //     amount: amount,
            //     currency: "XAF",
            //     from: phone,
            //     external_reference: `ORDER_${orderId}`
            // }, { headers: { Authorization: `Token ${this.token}` } });

            console.log(`Paiement de ${amount} XAF initié pour la commande ${orderId} sur le ${phone}`);
            
            // On retourne une référence fictive pour le test
            return {
                success: true,
                reference: `REF_${Date.now()}_${orderId}`
            };
        } catch (error) {
            console.error("Erreur Initiation Paiement:", error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 2. CONFIRMER LE PAIEMENT (Webhook ou Check)
     * Une fois l'argent reçu, on débloque la commande et on met à jour les wallets.
     */
    async confirmPayment(orderId, reference) {
        try {
            const order = await OrderModel.findById(orderId);
            if (!order) throw new Error("Commande introuvable");

            // a. Mise à jour de la commande : Status passe à 'SEARCHING' (Radar)
            await OrderModel.updateStatus(orderId, 'SEARCHING');

            // b. Enregistrer la transaction pour le Client
            await TransactionModel.create({
                user_type: 'CLIENT',
                user_id: order.client_id,
                order_id: orderId,
                amount: order.total_price,
                type: 'PAYMENT',
                description: `Paiement course ${orderId}`
            });

            // c. Si le client a payé via son Wallet, on débite le solde
            // (Si paiement direct Momo, on ne touche pas au wallet balance du client)
            
            console.log(`Paiement confirmé pour la commande ${orderId}. Course envoyée au radar.`);
            return { success: true };
        } catch (error) {
            console.error("Erreur Confirmation Paiement:", error);
            return { success: false };
        }
    }

    /**
     * 3. PAYER LE LIVREUR (Transfert Wallet)
     * Déclenché uniquement après validation de l'OTP de livraison.
     */
    async settleRiderEarnings(orderId) {
        const order = await OrderModel.findById(orderId);
        if (order && order.rider_id) {
            // Créditer le wallet du livreur
            await RiderModel.addEarnings(order.rider_id, order.rider_earnings);

            // Enregistrer la transaction de gain
            await TransactionModel.create({
                user_type: 'RIDER',
                user_id: order.rider_id,
                order_id: orderId,
                amount: order.rider_earnings,
                type: 'EARNING',
                description: `Gain course ${orderId}`
            });
        }
    }
}

module.exports = new PaymentService();