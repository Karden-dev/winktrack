const { pool } = require('../app');
const SubscriberModel = require('../models/subscriber.model');
const OrderModel = require('../models/order.model');

// Fonction utilitaire pour générer un code parrain (si absent)
function generateReferralCode(name) {
    const cleanName = (name || 'USER').toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 6);
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${cleanName}-${random}`;
}

// ============================================================
// 1. DASHBOARD & PROFIL LIVREUR
// ============================================================

exports.getDashboardInfo = async (req, res) => {
    try {
        const phone = req.query.phone || req.headers['x-rider-phone'];

        // On utilise le Modèle pour trouver le livreur
        let rider = await SubscriberModel.findByPhone(phone);

        if (!rider) return res.status(404).json({ error: "Livreur introuvable" });

        // --- AUTO-RÉPARATION : Si l'utilisateur n'a pas de code parrain, on en crée un ---
        if (!rider.referral_code) {
            const newCode = generateReferralCode(rider.first_name);
            console.log(`🔧 Auto-Génération Code Parrain pour ${rider.first_name} : ${newCode}`);
            
            // Mise à jour en base de données
            await pool.execute('UPDATE subscribers SET referral_code = ? WHERE id = ?', [newCode, rider.id]);
            
            // Mise à jour de l'objet local
            rider.referral_code = newCode;
        }

        // Calcul des jours restants d'abonnement
        const now = new Date();
        const expires = new Date(rider.subscription_expires_at);
        const diffTime = expires - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        const isExpired = diffDays <= 0;

        // Calcul des stats Parrainage
        let referralCount = 0;
        if (rider.referral_code) {
            referralCount = await SubscriberModel.countReferrals(rider.referral_code);
        }

        res.json({
            success: true,
            data: {
                id: rider.id, // Utile pour les sockets ou autres
                name: rider.first_name,
                slug: rider.magic_slug,
                photo: rider.photo_url, 
                // Lien de capture GPS (L'ancien système, toujours utile)
                link: `${req.protocol}://${req.get('host')}/capture.html?slug=${rider.magic_slug}`,
                
                // Le Wallet (Portefeuille)
                wallet: {
                    balance: rider.wallet_balance || 0,
                    currency: 'FCFA'
                },

                stats: {
                    deliveries: rider.total_gps_captures, // Ou count des orders 'DELIVERED'
                    rating: rider.reputation_score,
                    daysLeft: diffDays > 0 ? diffDays : 0,
                    isExpired: isExpired,
                    referralCount: referralCount 
                },
                settings: {
                    isOnline: rider.is_online,
                    customMessage: rider.custom_message_template
                },
                referral: {
                    code: rider.referral_code
                }
            }
        });

    } catch (error) {
        console.error("Erreur Dashboard:", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

// Changer le statut (En Ligne / Hors Ligne)
exports.toggleStatus = async (req, res) => {
    try {
        const { phone, isOnline } = req.body;
        await pool.execute('UPDATE subscribers SET is_online = ? WHERE phone_number = ?', [isOnline, phone]);
        res.json({ success: true, isOnline });
    } catch (error) {
        res.status(500).json({ error: "Erreur statut" });
    }
};

// Mettre à jour le message personnalisé
exports.updateMessage = async (req, res) => {
    try {
        const { phone, message } = req.body;
        await pool.execute('UPDATE subscribers SET custom_message_template = ? WHERE phone_number = ?', [message, phone]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Erreur message" });
    }
};

// ============================================================
// 2. GESTION DES COURSES (RADAR & MISSION) - NOUVEAU
// ============================================================

// LE RADAR : Voir les courses disponibles
exports.getAvailableOrders = async (req, res) => {
    try {
        const orders = await OrderModel.findAvailable();
        
        // On formate pour l'interface Livreur
        const formattedOrders = orders.map(o => ({
            id: o.id,
            pickup: {
                lat: o.pickup_lat,
                lng: o.pickup_lng,
                desc: o.pickup_desc || "Position client"
            },
            dropoff: {
                lat: o.dropoff_lat,
                lng: o.dropoff_lng,
                desc: "Destination" // À améliorer avec reverse geocoding si besoin
            },
            // Logique de prix pour le livreur (ex: 80% du prix client)
            clientPrice: o.estimated_price,
            earning: Math.floor(o.estimated_price * 0.8), 
            distance: o.distance_km,
            date: o.created_at,
            senderName: o.sender_name
        }));

        res.json({ success: true, orders: formattedOrders });
    } catch (error) {
        console.error("Erreur Radar:", error);
        res.status(500).json({ error: "Erreur serveur radar" });
    }
};

// ACCEPTER UNE COURSE
exports.acceptOrder = async (req, res) => {
    try {
        const { orderId, phone } = req.body;
        
        // 1. Identifier le livreur
        const rider = await SubscriberModel.findByPhone(phone);
        if (!rider) return res.status(403).json({ error: "Livreur inconnu ou non connecté" });

        // 2. Tenter d'assigner la course
        // Cette fonction retourne true si réussi, false si la course a été prise entre temps
        const success = await OrderModel.assignRider(orderId, rider.id);
        
        if (success) {
            console.log(`✅ Course #${orderId} acceptée par ${rider.first_name}`);
            res.json({ success: true, message: "Course acceptée ! Dirigez-vous vers le client." });
            
            // TODO: Ici on pourrait envoyer une notif Push/SMS au client : "Idriss arrive !"
        } else {
            res.status(400).json({ error: "Désolé, cette course vient d'être prise." });
        }
    } catch (error) {
        console.error("Erreur Accept:", error);
        res.status(500).json({ error: "Erreur serveur acceptation" });
    }
};

// MISSION : Mettre à jour l'état (Pickup -> Delivered)
exports.updateOrderState = async (req, res) => {
    try {
        const { orderId, status, phone } = req.body; // status: 'PICKED_UP' ou 'DELIVERED'
        
        // Vérif sécurité
        const rider = await SubscriberModel.findByPhone(phone);
        if (!rider) return res.status(403).json({ error: "Non autorisé" });

        const order = await OrderModel.findById(orderId);
        if (!order) return res.status(404).json({ error: "Commande introuvable" });
        
        // Vérifier que c'est bien CE livreur qui a la course
        if (order.rider_id !== rider.id) {
            return res.status(403).json({ error: "Cette course ne vous appartient pas." });
        }

        if (status === 'DELIVERED') {
            // --- FIN DE MISSION : PAIEMENT ---
            const total = parseFloat(order.estimated_price);
            const riderShare = total * 0.80; // 80% pour le livreur
            const commission = total * 0.20; // 20% pour Wink

            // Transaction Atomique (Tout ou rien)
            const connection = await pool.getConnection();
            try {
                await connection.beginTransaction();

                // 1. Marquer la commande comme LIVRÉE + Enregistrer les gains
                await connection.execute(
                    `UPDATE orders SET status='DELIVERED', rider_earnings=?, commission_amount=?, updated_at=NOW() WHERE id=?`,
                    [riderShare, commission, orderId]
                );

                // 2. Créditer le Wallet du livreur
                await connection.execute(
                    `UPDATE subscribers SET wallet_balance = wallet_balance + ? WHERE id=?`,
                    [riderShare, rider.id]
                );

                // 3. Incrémenter les stats du livreur (+1 course)
                await connection.execute(
                    `UPDATE subscribers SET total_gps_captures = total_gps_captures + 1 WHERE id=?`,
                    [rider.id]
                );

                await connection.commit();
                
                console.log(`💰 Course #${orderId} terminée. Gain Livreur: ${riderShare} FCFA`);
                res.json({ success: true, message: "Course terminée ! Portefeuille crédité.", earned: riderShare });

            } catch (err) {
                await connection.rollback();
                throw err;
            } finally {
                connection.release();
            }

        } else {
            // --- CHANGEMENT DE STATUT SIMPLE (ex: PICKED_UP) ---
            await OrderModel.updateStatus(orderId, status);
            console.log(`📍 Course #${orderId} statut : ${status}`);
            res.json({ success: true, status: status });
        }

    } catch (error) {
        console.error("Erreur Update State:", error);
        res.status(500).json({ error: "Erreur serveur update" });
    }
};