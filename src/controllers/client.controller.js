// src/controllers/client.controller.js
const OrderModel = require('../models/order.model');
const ClientModel = require('../models/client.model');

/**
 * 1. Profil Client (Lecture)
 */
exports.getProfile = async (req, res) => {
    try {
        const { phone } = req.params;
        const client = await ClientModel.findByPhone(phone);
        
        if (!client) {
            return res.status(404).json({ error: "Client introuvable" });
        }

        // On renvoie les données formatées pour le Dashboard
        res.json({
            id: client.id,
            first_name: client.first_name,
            last_name: client.last_name,
            phone: client.phone,
            wallet_balance: client.wallet_balance || 0,
            payment_number: client.payment_number || client.phone
        });
    } catch (error) {
        console.error("❌ Erreur Get Profile:", error);
        res.status(500).json({ error: "Erreur lors de la récupération du profil" });
    }
};

/**
 * 2. Mise à jour du Profil
 */
exports.updateProfile = async (req, res) => {
    try {
        const { phone } = req.params;
        const { firstName, lastName, paymentNumber } = req.body;

        // Note: Assure-toi que ClientModel.update existe ou utilise une requête directe
        // Ici on suppose une méthode update générique
        await ClientModel.update(phone, {
            first_name: firstName,
            last_name: lastName,
            payment_number: paymentNumber
        });

        res.json({ success: true, message: "Profil mis à jour" });
    } catch (error) {
        console.error("❌ Erreur Update Profile:", error);
        res.status(500).json({ error: "Erreur lors de la mise à jour" });
    }
};

/**
 * 3. Historique des Commandes (Crucial pour le Dashboard)
 */
exports.getHistory = async (req, res) => {
    try {
        const { phone } = req.params;

        // 1. Trouver l'ID du client
        const client = await ClientModel.findByPhone(phone);
        if (!client) return res.status(404).json({ error: "Client introuvable" });

        // 2. Récupérer toutes les commandes via le nouveau modèle
        // ✅ Utilise la méthode qu'on a prévue dans l'étape précédente
        const history = await OrderModel.findAllByClientId(client.id);

        res.json(history);
    } catch (error) {
        console.error("❌ Erreur History:", error);
        res.status(500).json({ error: "Impossible de récupérer l'historique" });
    }
};

/**
 * 4. Créer une commande (Directe)
 */
exports.createOrder = async (req, res) => {
    try {
        const { clientPhone, pickup, dropoff, price, distance } = req.body;

        let client = await ClientModel.findByPhone(clientPhone);
        if (!client) {
            const clientId = await ClientModel.create({ phone: clientPhone });
            client = { id: clientId, phone: clientPhone };
        }

        const orderId = await OrderModel.create({
            client_id: client.id,
            pickup_lat: pickup.lat,
            pickup_lng: pickup.lng,
            pickup_address: pickup.address,
            dropoff_lat: dropoff?.lat,
            dropoff_lng: dropoff?.lng,
            dropoff_address: dropoff?.address,
            distance_km: distance,
            total_price: price,
            rider_earnings: price * 0.9,
            wink_commission: price * 0.1,
            otp_pickup: Math.floor(1000 + Math.random() * 9000),
            otp_delivery: Math.floor(1000 + Math.random() * 9000)
        });

        res.json({ success: true, orderId, message: "Commande créée" });
    } catch (error) {
        console.error("❌ Erreur Create Order:", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

/**
 * 5. Vérifier le statut (Tracking)
 */
exports.checkStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await OrderModel.findById(orderId);
        if (!order) return res.status(404).json({ error: "Commande introuvable" });

        res.json({
            status: order.status,
            rider: order.rider_id ? { name: order.rider_name, phone: order.rider_phone } : null,
            location: { lat: order.pickup_lat, lng: order.pickup_lng }
        });
    } catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};

// --- Deprecated ---
exports.resolveOrderToken = (req, res) => res.status(410).json({ error: "Utilisez /api/orders/:token" });
exports.validateDropoff = (req, res) => res.status(410).json({ error: "Utilisez /api/orders/confirm-destination" });