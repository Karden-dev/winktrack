// src/controllers/order.controller.js
const OrderModel = require('../models/order.model');
const ClientModel = require('../models/client.model');
const RiderModel = require('../models/rider.model'); 
const googleService = require('../services/google.service');
const pricingService = require('../services/pricing.service');
const paymentService = require('../services/payment.service');
const notificationService = require('../services/notification.service');
const socketService = require('../socket'); 

// ✅ Utilisation de la variable d'environnement pour la production
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://liv.winkexpress.online';

const generateShortToken = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return 'WINK-' + result; 
};

const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

class OrderController {
    
    // 1. INITIER LA COMMANDE (Expéditeur crée le Magic Link)
    async initiateOrder(req, res) {
        try {
            const { senderPhone, pickup, recipient, packageDesc } = req.body;

            // ✅ ADAPTATION : Appel à getAddressFromCoords
            let pickupAddress = "Position actuelle";
            try {
                const geoResult = await googleService.getAddressFromCoords(pickup.lat, pickup.lng);
                // Ton service renvoie un objet { address, place_id }
                if (geoResult && geoResult.address) {
                    pickupAddress = geoResult.address;
                }
            } catch (err) {
                console.warn("Google Geo Error:", err.message);
            }
            
            let client = await ClientModel.findByPhone(senderPhone);
            if (!client) {
                const clientId = await ClientModel.create({ phone: senderPhone });
                client = { id: clientId, phone: senderPhone };
            }

            const token = generateShortToken();
            const magicLink = `${FRONTEND_URL}/confirm-destination/${token}`;
            
            await notificationService.sendMagicLink(recipient.phone, magicLink, client.first_name || "Un expéditeur");

            const orderId = await OrderModel.create({
                client_id: client.id,
                pickup_lat: pickup.lat,
                pickup_lng: pickup.lng,
                pickup_address: pickupAddress, // Adresse extraite ou par défaut
                package_description: packageDesc,
                recipient_name: recipient.name,
                recipient_phone: recipient.phone,
                magic_token: token,
                status: 'INITIATED'
            });

            res.json({ 
                success: true, 
                orderId, 
                magicLink,
                message: "Lien magique envoyé au destinataire" 
            });

        } catch (error) {
            console.error("Erreur Initiate Order:", error);
            res.status(500).json({ error: "Erreur lors de l'initialisation" });
        }
    }

    /**
     * 2. RÉSOUDRE LE TOKEN (Le destinataire ouvre le lien)
     */
    async resolveToken(req, res) {
        try {
            const { token } = req.params;
            const order = await OrderModel.findByToken(token);

            if (!order) {
                return res.status(404).json({ error: "Lien invalide ou expiré" });
            }

            res.json({
                success: true,
                order: {
                    id: order.id,
                    sender_name: order.sender_name,
                    pickup_address: order.pickup_address,
                    package_description: order.package_description
                }
            });
        } catch (error) {
            res.status(500).json({ error: "Erreur serveur" });
        }
    }

    /**
     * 3. CONFIRMER LA DESTINATION (Le destinataire valide sa position)
     */
    async confirmDestination(req, res) {
        try {
            const { orderId, dropoff } = req.body;

            const order = await OrderModel.findById(orderId);
            if (!order) return res.status(404).json({ error: "Commande introuvable" });

            // ✅ ADAPTATION : Reverse Geocoding pour la destination
            let dropoffAddress = "Destination choisie";
            try {
                const geoResult = await googleService.getAddressFromCoords(dropoff.lat, dropoff.lng);
                if (geoResult && geoResult.address) {
                    dropoffAddress = geoResult.address;
                }
            } catch (e) {}

            // ✅ ADAPTATION : Calcul de distance avec getDistanceMatrix
            // Ton service renvoie { distanceKm, durationMin }
            let distance = 0;
            try {
                const distResult = await googleService.getDistanceMatrix(
                    { lat: order.pickup_lat, lng: order.pickup_lng },
                    dropoff
                );
                if (distResult && distResult.distanceKm) {
                    distance = distResult.distanceKm;
                }
            } catch (e) {
                console.error("Erreur Calcul Distance:", e.message);
                // On peut définir une distance par défaut ou renvoyer une erreur
                return res.status(500).json({ error: "Impossible de calculer la distance" });
            }

            const price = pricingService.calculatePrice(distance);

            await OrderModel.update(orderId, {
                dropoff_lat: dropoff.lat,
                dropoff_lng: dropoff.lng,
                dropoff_address: dropoffAddress,
                distance_km: distance,
                total_price: price,
                rider_earnings: price * 0.8,
                wink_commission: price * 0.2,
                status: 'READY_TO_PAY'
            });

            socketService.notifyOrderUpdate(orderId, {
                id: orderId,
                status: 'READY_TO_PAY',
                total_price: price,
                distance_km: distance
            });

            res.json({ success: true, price, distance });

        } catch (error) {
            console.error("Erreur Confirm Dest:", error);
            res.status(500).json({ error: "Erreur lors de la confirmation" });
        }
    }

    /**
     * 4. FINALISER ET PAYER (L'expéditeur paie)
     */
    async finalizeAndPay(req, res) {
        try {
            const { orderId, paymentMethod } = req.body;

            const order = await OrderModel.findById(orderId);
            if (!order) return res.status(404).json({ error: "Commande introuvable" });

            const otpPickup = generateOTP();
            const otpDelivery = generateOTP();

            await OrderModel.update(orderId, {
                status: 'PAYMENT_PENDING',
                otp_pickup: otpPickup,
                otp_delivery: otpDelivery
            });

            const paymentResult = await paymentService.requestPayment({
                orderId,
                amount: order.total_price,
                phone: order.sender_phone,
                method: paymentMethod
            });

            if (paymentResult.success) {
                await OrderModel.update(orderId, { status: 'SEARCHING_RIDER' });
                
                socketService.notifyNewAvailableOrder({
                    id: order.id,
                    pickup_address: order.pickup_address,
                    dropoff_address: order.dropoff_address,
                    price: order.total_price,
                    distance: order.distance_km
                });

                res.json({ success: true, message: "Paiement réussi, recherche de livreur..." });
            } else {
                res.status(400).json({ error: "Échec du paiement" });
            }

        } catch (error) {
            res.status(500).json({ error: "Erreur lors du paiement" });
        }
    }

    /**
     * 5. ACTIONS LIVREUR (Accepter, Récupérer, Livrer)
     */
    async updateStatus(req, res) {
        try {
            const { orderId } = req.params;
            const { status, riderId, otp } = req.body;

            const order = await OrderModel.findById(orderId);
            if (!order) return res.status(404).json({ error: "Commande introuvable" });

            if (status === 'PICKED_UP' && otp !== order.otp_pickup) {
                return res.status(400).json({ error: "Code de récupération incorrect" });
            }
            if (status === 'DELIVERED' && otp !== order.otp_delivery) {
                return res.status(400).json({ error: "Code de livraison incorrect" });
            }

            await OrderModel.update(orderId, { status, rider_id: riderId });

            if (status === 'DELIVERED') {
                await RiderModel.addEarnings(riderId, order.rider_earnings);
            }

            socketService.notifyOrderUpdate(orderId, { status });

            res.json({ success: true, message: `Statut mis à jour : ${status}` });
        } catch (error) {
            res.status(500).json({ error: "Erreur lors de la mise à jour du statut" });
        }
    }

    /**
     * 7. ADMIN : COMMANDES ACTIVES
     */
    async getActiveOrders(req, res) {
        try {
            const orders = await OrderModel.findActive();
            res.json({ 
                success: true, 
                data: orders.map(o => ({
                    id: o.id,
                    status: o.status,
                    pickup_lat: o.pickup_lat,
                    pickup_lng: o.pickup_lng,
                    pickup_address: o.pickup_address,
                    dropoff_address: o.dropoff_address,
                    total_price: o.total_price,
                    recipient_name: o.recipient_name
                }))
            });
        } catch (error) {
            console.error("Erreur Get Active Orders Admin:", error);
            res.status(500).json({ error: "Erreur serveur" });
        }
    }

    /**
     * 8. ADMIN : TOUTES LES COMMANDES
     */
    async getAllOrders(req, res) {
        try {
            const orders = await OrderModel.findAll();
            res.json({ 
                success: true, 
                data: orders 
            });
        } catch (error) {
            console.error("Erreur Get All Orders Admin:", error);
            res.status(500).json({ error: "Erreur serveur" });
        }
    }
}

module.exports = new OrderController();