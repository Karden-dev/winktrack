const { pool } = require('../app');
const SubscriberModel = require('../models/subscriber.model');

// Fonction utilitaire pour générer un code (même logique que l'inscription)
function generateReferralCode(name) {
    const cleanName = (name || 'USER').toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 6);
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${cleanName}-${random}`;
}

// 1. Récupérer les infos du Dashboard
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
            
            // Mise à jour de l'objet local pour l'affichage immédiat
            rider.referral_code = newCode;
        }
        // --------------------------------------------------------------------------------

        // Calcul des jours restants
        const now = new Date();
        const expires = new Date(rider.subscription_expires_at);
        const diffTime = expires - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        const isExpired = diffDays <= 0;

        // Calcul des stats Parrainage
        // On vérifie que le code existe bien avant de compter (sécurité)
        let referralCount = 0;
        if (rider.referral_code) {
            referralCount = await SubscriberModel.countReferrals(rider.referral_code);
        }

        res.json({
            success: true,
            data: {
                name: rider.first_name,
                slug: rider.magic_slug,
                photo: rider.photo_url, 
                link: `${req.protocol}://${req.get('host')}/capture.html?slug=${rider.magic_slug}`,
                stats: {
                    deliveries: rider.total_gps_captures,
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

// 2. Changer le statut (En Ligne / Hors Ligne)
exports.toggleStatus = async (req, res) => {
    const { phone, isOnline } = req.body;
    await pool.execute('UPDATE subscribers SET is_online = ? WHERE phone_number = ?', [isOnline, phone]);
    res.json({ success: true, isOnline });
};

// 3. Mettre à jour le message personnalisé (Fonction conservée pour compatibilité, même si moins utilisée)
exports.updateMessage = async (req, res) => {
    const { phone, message } = req.body;
    await pool.execute('UPDATE subscribers SET custom_message_template = ? WHERE phone_number = ?', [message, phone]);
    res.json({ success: true });
};