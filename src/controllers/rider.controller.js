// src/controllers/rider.controller.js
const RiderModel = require('../models/rider.model');
const OrderModel = require('../models/order.model'); 
const socketService = require('../socket');
const axios = require('axios');

// 🔑 La clé Backend (stockée dans .env)
const GOOGLE_KEY = process.env.GOOGLE_MAPS_SERVER_KEY;

class RiderController {

    // 1. Récupérer les infos du Dashboard Livreur (AVEC PERSISTANCE)
    async getDashboardInfo(req, res) {
        try {
            // On privilégie l'ID du token si présent, sinon le téléphone en query
            const phone = req.query.phone || (req.user ? req.user.phone : null);
            if (!phone) return res.status(400).json({ error: "Numéro de téléphone requis" });

            let rider = await RiderModel.findByPhone(phone);
            if (!rider) return res.status(404).json({ error: "Livreur introuvable" });

            // --- LOGIQUE DE PERSISTANCE ---
            // On vérifie si ce livreur a une commande en cours (statut ACCEPTED ou PICKED_UP)
            const activeMission = await RiderModel.getCurrentMission(rider.id);

            res.json({
                success: true,
                data: {
                    id: rider.id,
                    first_name: rider.first_name,
                    last_name: rider.last_name,
                    phone: rider.phone,
                    avatar_url: rider.avatar_url || null, 
                    
                    activeMissionId: activeMission ? activeMission.id : null,
                    activeMissionStatus: activeMission ? activeMission.status : null,

                    stats: {
                        rating: parseFloat(rider.rating_avg || 5.0),
                        walletBalance: parseInt(rider.wallet_balance || 0),
                        completedOrders: parseInt(rider.total_deliveries || 0),
                        acceptanceRate: parseInt(rider.acceptance_rate || 100)
                    },
                    status: rider.status,
                    settings: {
                        isOnline: rider.is_online === 1,
                        vehicle: rider.vehicle_info,
                        plate: rider.license_plate
                    },
                    has_bag: rider.has_bag === 1,
                    has_mount: rider.has_mount === 1,
                    
                    documents: [
                        { id: 1, label: 'CNI', status: rider.doc_cni_path ? 'VALID' : 'MISSING' },
                        { id: 2, label: 'Permis', status: rider.doc_license_path ? 'VALID' : 'MISSING' },
                        { id: 3, label: 'Carte Grise', status: rider.doc_grey_path ? 'VALID' : 'MISSING' }
                    ],
                    referral: {
                        code: rider.referral_code
                    }
                }
            });
        } catch (error) {
            console.error("Erreur Dashboard:", error);
            res.status(500).json({ error: "Erreur serveur" });
        }
    }

    // 1.1 UPLOAD DES DOCUMENTS
    async uploadDocuments(req, res) {
        try {
            const { cni, license, greyCard } = req.files;
            const riderId = req.body.riderId || (req.user ? req.user.id : null);

            if (!riderId) return res.status(400).json({ error: "ID Livreur requis" });

            const updateData = {
                status: 'PENDING_VALIDATION',
                doc_updated_at: new Date()
            };

            if (cni) updateData.doc_cni_path = cni[0].path;
            if (license) updateData.doc_license_path = license[0].path;
            if (greyCard) updateData.doc_grey_path = greyCard[0].path;

            await RiderModel.updateDocuments(riderId, updateData);

            res.json({ 
                success: true, 
                message: "Documents reçus. Votre profil est en cours d'examen." 
            });
        } catch (error) {
            console.error("Erreur Upload Docs:", error);
            res.status(500).json({ error: "Erreur lors de l'enregistrement." });
        }
    }

    // 1.2 MISE À JOUR ÉQUIPEMENT
    async updateEquipment(req, res) {
        try {
            const riderId = req.user ? req.user.id : req.body.riderId; 
            const fields = req.body;

            if (!riderId) return res.status(400).json({ error: "ID Livreur requis" });

            await RiderModel.updateEquipment(riderId, fields);
            res.json({ success: true, message: "Équipement mis à jour" });
        } catch (error) {
            console.error("Erreur Update Equipment:", error);
            res.status(500).json({ error: "Erreur serveur" });
        }
    }

    // 2. Changer le statut
    async toggleStatus(req, res) {
        try {
            const id = req.body.id || (req.user ? req.user.id : null);
            const isOnline = req.body.isOnline;
            
            if (!id) return res.status(400).json({ error: "ID Livreur requis" });

            await RiderModel.toggleOnline(id, isOnline);
            res.json({ success: true, isOnline });
        } catch (error) {
            console.error("Erreur Toggle Status:", error);
            res.status(500).json({ error: error.message });
        }
    }

    // 3. Radar Intelligent
    async getAvailableOrders(req, res) {
        try {
            const { lat, lng } = req.query;
            if (!lat || !lng) return res.status(400).json({ error: "Position GPS requise" });

            const orders = await OrderModel.getAvailableOrders(); 
            if (!orders || orders.length === 0) {
                return res.json({ success: true, orders: [], message: "Aucune commande proche." });
            }

            const destinations = orders.map(o => `${o.pickup_lat},${o.pickup_lng}`).join('|');
            const origin = `${lat},${lng}`;
            const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destinations}&mode=driving&key=${GOOGLE_KEY}`;
            
            let elements = [];
            try {
                const googleRes = await axios.get(url);
                if (googleRes.data.status === 'OK') {
                     elements = googleRes.data.rows[0].elements;
                }
            } catch (err) {
                console.error("Erreur Google API:", err.message);
            }

            const ordersWithDistance = orders.map((order, index) => {
                const info = elements[index];
                const distanceValue = info && info.status === 'OK' ? info.distance.value : 999999;
                const durationValue = info && info.status === 'OK' ? info.duration.value : 999999;
                const durationText = info && info.status === 'OK' ? info.duration.text : '~ min';

                return {
                    ...order,
                    pickup_distance_m: distanceValue,
                    pickup_duration_s: durationValue,
                    pickup_duration_text: durationText
                };
            });

            const sortedOrders = ordersWithDistance
                .filter(o => o.pickup_distance_m < 15000) 
                .sort((a, b) => a.pickup_duration_s - b.pickup_duration_s);

            res.json({
                success: true,
                count: sortedOrders.length,
                orders: sortedOrders.map(o => ({
                    id: o.id,
                    pickup: o.pickup_address,
                    dropoff: o.dropoff_address,
                    price: o.rider_earnings,
                    distanceToPickup: o.pickup_duration_text,
                    tripDistance: `${o.distance_km} km`,
                    pickup_lat: o.pickup_lat,
                    pickup_lng: o.pickup_lng
                }))
            });
        } catch (error) {
            console.error("❌ Erreur Radar:", error);
            res.status(500).json({ error: "Erreur serveur radar" });
        }
    }

    // 4. ACCEPTER UNE MISSION
    async acceptOrder(req, res) {
        try {
            const { orderId } = req.params;
            const riderId = req.body.riderId || (req.user ? req.user.id : null);

            const order = await OrderModel.findById(orderId);
            if (!order) return res.status(404).json({ error: "Commande introuvable" });
            if (order.status !== 'SEARCHING') return res.status(409).json({ error: "Déjà prise." });

            await OrderModel.assignRider(orderId, riderId);

            const rider = await RiderModel.findById(riderId);
            if (socketService) {
                socketService.notifyOrderUpdate(orderId, {
                    status: 'ACCEPTED',
                    rider: { name: rider.first_name, phone: rider.phone, lat: rider.current_lat, lng: rider.current_lng }
                });
                socketService.notifyRidersOrderTaken(orderId);
            }

            res.json({ success: true, message: "Mission acceptée !" });
        } catch (error) {
            console.error("Erreur Accept Order:", error);
            res.status(500).json({ error: "Erreur serveur" });
        }
    }

    // 5. TRACKING GPS
    async updateLocation(req, res) {
        try {
            const riderId = req.body.riderId || (req.user ? req.user.id : null);
            const { lat, lng } = req.body;
            await RiderModel.updateLocation(riderId, lat, lng);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: "Erreur GPS" });
        }
    }

    // 6. PORTEFEUILLE
    async getWallet(req, res) {
        try {
            const riderId = req.params.riderId || (req.user ? req.user.id : null);
            const walletData = await RiderModel.getWalletData(riderId);
            res.json({ success: true, data: walletData });
        } catch (error) {
            console.error("Erreur Wallet:", error);
            res.status(500).json({ error: "Erreur Wallet" });
        }
    }

    // 7. ADMINISTRATION : RÉCUPÉRER TOUTES LES POSITIONS (BACK-OFFICE)
    async getAllPositions(req, res) {
        try {
            // Seuls les livreurs en ligne avec une position connue
            const riders = await RiderModel.findAllPositions();
            res.json({ 
                success: true, 
                data: riders.map(r => ({
                    id: r.id,
                    first_name: r.first_name,
                    last_name: r.last_name,
                    status: r.status, // Pour savoir s'il est BUSY ou AVAILABLE
                    current_lat: r.current_lat,
                    current_lng: r.current_lng,
                    heading: r.heading || 0
                }))
            });
        } catch (error) {
            console.error("Erreur All Positions Admin:", error);
            res.status(500).json({ error: "Erreur serveur" });
        }
    }
}

module.exports = new RiderController();