const OrderModel = require('../models/order.model');
const SubscriberModel = require('../models/subscriber.model');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const { pool } = require('../app'); // Import direct du pool pour les requêtes spécifiques Dashboard

// ============================================================
// CONFIGURATION DU SYSTÈME
// ============================================================
const BASE_FARE = 500;      // Tarif de base (Prise en charge) en FCFA
const PRICE_PER_KM = 80;   // Prix au kilomètre
const OSRM_API_URL = 'http://router.project-osrm.org/route/v1/driving';

// ============================================================
// FONCTIONS UTILITAIRES (CALCULS)
// ============================================================

// 1. Calcul Itinéraire Routier (OSRM)
async function getRoadDistance(lat1, lon1, lat2, lon2) {
    try {
        // Format OSRM : {lon},{lat};{lon},{lat}
        const url = `${OSRM_API_URL}/${lon1},${lat1};${lon2},${lat2}?overview=false`;
        
        // Timeout de 3s pour éviter de bloquer l'app si OSRM est lent
        const response = await axios.get(url, { timeout: 3000 });
        
        if (response.data.routes && response.data.routes.length > 0) {
            // OSRM renvoie des mètres, on convertit en KM
            return response.data.routes[0].distance / 1000;
        }
        return null;
    } catch (error) {
        console.warn("⚠️ OSRM indisponible (Fallback activé):", error.message);
        return null;
    }
}

// 2. Calcul Vol d'Oiseau (Fallback de secours)
function calculateHaversine(lat1, lon1, lat2, lon2) {
    const R = 6371; // Rayon Terre (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// ============================================================
// CONTRÔLEUR PRINCIPAL
// ============================================================

// --- A. GESTION DES COMMANDES (FLUX EXPÉDITEUR) ---

// 1. Créer une commande
exports.createOrder = async (req, res) => {
    try {
        const { senderPhone, pickupLoc, packageDesc, recipientPhone, recipientName } = req.body;

        // Gestion Shadow Account (Si le client n'existe pas, on le crée)
        let sender = await SubscriberModel.findByPhone(senderPhone);
        if (!sender) {
            console.log(`👤 Nouveau Shadow Account : ${senderPhone}`);
            const newId = await SubscriberModel.create({
                phone_number: senderPhone,
                magic_slug: `user-${Date.now()}`,
                is_independent: 0 // Client Standard
            });
            sender = { id: newId };
        }

        // Génération du lien magique
        const token = uuidv4().split('-')[0];
        
        // Création en base
        const orderId = await OrderModel.create({
            senderId: sender.id,
            rPhone: recipientPhone,
            rName: recipientName,
            lat: pickupLoc.lat,
            lng: pickupLoc.lng,
            desc: packageDesc,
            token: token
        });

        // Simulation SMS
        const magicLink = `http://localhost:3000/confirm.html?slug=${token}`;
        console.log(`-----------------------------------------------------------`);
        console.log(`📱 SMS À ${recipientPhone} : "Colis de ${senderPhone}. Validez ici : ${magicLink}"`);
        console.log(`-----------------------------------------------------------`);

        res.json({
            success: true,
            orderId: orderId,
            message: "Commande créée.",
            debugToken: token
        });

    } catch (error) {
        console.error("❌ Erreur Create Order:", error);
        res.status(500).json({ error: "Erreur serveur creation" });
    }
};

// 2. Vérifier le statut (Polling)
exports.checkStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await OrderModel.findById(orderId);
        
        if (!order) return res.status(404).json({ error: "Commande introuvable" });

        res.json({
            status: order.status,
            price: order.estimated_price,
            distance: order.distance_km
        });

    } catch (error) {
        console.error("❌ Erreur Polling:", error);
        res.status(500).json({ error: "Erreur serveur polling" });
    }
};

// --- B. GESTION DESTINATAIRE (FLUX RÉCEPTION) ---

// 3. Résoudre le Token (Pour afficher la page confirm.html)
exports.resolveOrderToken = async (req, res) => {
    try {
        const { token } = req.params;
        const order = await OrderModel.findByToken(token);
        
        if (!order) {
            return res.status(404).json({ success: false, error: "Lien invalide ou expiré." });
        }

        res.json({
            success: true,
            order: {
                recipientName: order.recipient_name,
                packageDesc: order.pickup_desc,
                status: order.status
            }
        });

    } catch (error) {
        console.error("❌ Erreur Resolve:", error);
        res.status(500).json({ error: "Erreur serveur resolve" });
    }
};

// 4. Valider la Destination & Calculer le Prix
exports.validateDropoff = async (req, res) => {
    try {
        const { token, lat, lng } = req.body;
        
        const order = await OrderModel.findByToken(token);
        if (!order) return res.status(404).json({ error: "Commande introuvable" });

        if (order.status !== 'WAITING_DROPOFF' && order.status !== 'DRAFT') {
            return res.status(400).json({ error: "Commande déjà validée." });
        }

        // 1. Calcul Distance
        let dist = await getRoadDistance(order.pickup_lat, order.pickup_lng, lat, lng);
        let method = "OSRM (Route)";

        if (dist === null) {
            dist = calculateHaversine(order.pickup_lat, order.pickup_lng, lat, lng);
            method = "Haversine (Vol d'oiseau)";
        }

        // 2. Calcul Prix (Base + Km) avec Arrondi au 50 Supérieur
        let rawPrice = BASE_FARE + (dist * PRICE_PER_KM);
        const price = Math.ceil(rawPrice / 50) * 50;

        console.log(`📍 Trajet Validé [${method}] : ${dist.toFixed(2)} km -> ${price} FCFA`);

        // 3. Update DB
        await OrderModel.updateDropoff(order.id, lat, lng, dist, price);

        res.json({ 
            success: true, 
            message: "Position validée !", 
            price: price,
            distance: dist
        });

    } catch (error) {
        console.error("❌ Erreur Validation:", error);
        res.status(500).json({ error: "Erreur serveur validation" });
    }
};

// --- C. DASHBOARD CLIENT & PROFIL ---

// 5. Récupérer l'historique complet
exports.getHistory = async (req, res) => {
    try {
        const { phone } = req.params;

        // On récupère l'ID du client
        const client = await SubscriberModel.findByPhone(phone);
        if (!client) return res.json({ success: true, history: [] });

        // Requête SQL pour récupérer les commandes du client
        // NOTE: On simule le "rider" pour l'instant car la table assignments n'est pas jointe ici
        const sql = `
            SELECT 
                o.id, 
                o.pickup_desc, 
                o.created_at, 
                o.estimated_price, 
                o.status, 
                o.distance_km
            FROM orders o 
            WHERE o.sender_id = ? 
            ORDER BY o.created_at DESC 
            LIMIT 20
        `;
        
        const [rows] = await pool.execute(sql, [client.id]);

        // Formatage des données pour le Frontend React
        const history = rows.map(row => ({
            id: row.id,
            pickup: "Départ Client",
            dest: row.pickup_desc || "Destination Inconnue", // Idéalement, faire un reverse geocoding
            date: new Date(row.created_at).toLocaleDateString('fr-FR', { 
                day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' 
            }),
            price: row.estimated_price || 0,
            status: row.status === 'COMPLETED' ? 'LIVRÉ' : (row.status === 'CANCELLED' ? 'ANNULÉ' : 'EN COURS'),
            distance: row.distance_km,
            rider: null // On met null pour l'instant, le dashboard gère l'absence de livreur
        }));

        res.json({ success: true, history });

    } catch (error) {
        console.error("❌ Erreur History:", error);
        res.status(500).json({ error: "Erreur serveur historique" });
    }
};

// 6. Récupérer le Profil
exports.getProfile = async (req, res) => {
    try {
        const { phone } = req.params;
        const client = await SubscriberModel.findByPhone(phone);
        
        if (!client) return res.status(404).json({ error: "Client introuvable" });

        res.json({
            firstName: client.first_name || "",
            lastName: client.last_name || "",
            phone: client.phone_number,
            paymentNumber: client.default_payment_number || "", // Le fameux champ ajouté
            balance: 0 // Placeholder pour le futur wallet
        });

    } catch (error) {
        console.error("❌ Erreur Get Profile:", error);
        res.status(500).json({ error: "Erreur serveur profil" });
    }
};

// 7. Mettre à jour le Profil (Nom + Paiement par défaut)
exports.updateProfile = async (req, res) => {
    try {
        const { phone } = req.params;
        const { firstName, lastName, paymentNumber } = req.body;

        const client = await SubscriberModel.findByPhone(phone);
        if (!client) return res.status(404).json({ error: "Client introuvable" });

        const sql = `
            UPDATE subscribers 
            SET first_name = ?, last_name = ?, default_payment_number = ? 
            WHERE id = ?
        `;
        
        await pool.execute(sql, [firstName, lastName, paymentNumber, client.id]);

        res.json({ success: true, message: "Profil mis à jour" });

    } catch (error) {
        console.error("❌ Erreur Update Profile:", error);
        res.status(500).json({ error: "Erreur serveur update profil" });
    }
};