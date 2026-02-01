const { pool } = require('../app');

// 1. Récupérer les infos du Dashboard
exports.getDashboardInfo = async (req, res) => {
    try {
        // On suppose que l'ID ou le téléphone est passé via un paramètre ou un token
        // Pour ce MVP, on utilise le header 'x-rider-phone' ou query param
        const phone = req.query.phone || req.headers['x-rider-phone'];

        const [rows] = await pool.execute(`
            SELECT id, first_name, last_name, magic_slug, 
                   subscription_expires_at, total_gps_captures, 
                   reputation_score, is_online, custom_message_template,
                   referral_code, photo_url
            FROM subscribers WHERE phone_number = ?`, [phone]);

        if (rows.length === 0) return res.status(404).json({ error: "Livreur introuvable" });

        const rider = rows[0];
        
        // Calcul des jours restants
        const now = new Date();
        const expires = new Date(rider.subscription_expires_at);
        const diffTime = expires - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        const isExpired = diffDays <= 0;

        res.json({
            success: true,
            data: {
                name: rider.first_name,
                slug: rider.magic_slug,
                link: `${req.protocol}://${req.get('host')}/capture.html?slug=${rider.magic_slug}`,
                stats: {
                    deliveries: rider.total_gps_captures,
                    rating: rider.reputation_score,
                    daysLeft: diffDays > 0 ? diffDays : 0,
                    isExpired: isExpired
                },
                settings: {
                    isOnline: rider.is_online,
                    customMessage: rider.custom_message_template
                }
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

// 2. Changer le statut (En Ligne / Hors Ligne)
exports.toggleStatus = async (req, res) => {
    const { phone, isOnline } = req.body;
    await pool.execute('UPDATE subscribers SET is_online = ? WHERE phone_number = ?', [isOnline, phone]);
    res.json({ success: true, isOnline });
};

// 3. Mettre à jour le message personnalisé
exports.updateMessage = async (req, res) => {
    const { phone, message } = req.body;
    await pool.execute('UPDATE subscribers SET custom_message_template = ? WHERE phone_number = ?', [message, phone]);
    res.json({ success: true });
};