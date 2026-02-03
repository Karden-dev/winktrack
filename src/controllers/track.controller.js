const { pool } = require('../app');

// Fonction utilitaire pour générer un code court aléatoire (ex: xK9z)
function generateShortCode(length = 4) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// 1. RÉSOUDRE LE LIEN (Quand le client clique)
exports.resolveLink = async (req, res) => {
    try {
        const { slug } = req.params;
        
        // On récupère toutes les infos nécessaires pour l'affichage
        const sql = `
            SELECT id, phone_number, first_name, last_name, 
                   is_independent, company_name, 
                   subscription_expires_at, 
                   total_gps_captures, magic_slug,
                   custom_message_template, is_online,
                   reputation_score
            FROM subscribers 
            WHERE magic_slug = ?
        `;
        
        const [rows] = await pool.execute(sql, [slug]);

        // CAS A : Lien introuvable (ou ancien lien désactivé)
        if (rows.length === 0) {
            return res.status(404).json({ 
                error: "Ce lien n'est plus valide ou a été modifié.",
                code: "LINK_INVALID"
            });
        }

        const rider = rows[0];
        const now = new Date();
        const expires = new Date(rider.subscription_expires_at);

        // CAS B : Lien existant mais abonnement expiré
        if (expires < now) {
            return res.status(403).json({ 
                error: "L'abonnement de ce livreur a expiré.",
                riderName: rider.first_name,
                isExpired: true
            });
        }

        // CAS C : Livreur en mode "Hors Ligne" (Pause)
        // Note: Assure-toi d'avoir la colonne 'is_online' dans ta DB, sinon enlève ce bloc
        if (rider.is_online === 0) {
            return res.status(503).json({
                error: "Ce livreur n'est pas en service actuellement.",
                riderName: rider.first_name
            });
        }

        // TOUT EST OK -> On renvoie les données publiques au Frontend
        res.json({
            valid: true,
            rider: {
                id: rider.id,
                name: rider.first_name || "Livreur",
                phone: rider.phone_number,
                stats: rider.total_gps_captures,
                type: rider.is_independent ? "Indépendant" : rider.company_name,
                rating: rider.reputation_score,
                messageTemplate: rider.custom_message_template
            }
        });

    } catch (error) {
        console.error("Erreur Resolve Link:", error);
        res.status(500).json({ error: "Erreur serveur interne" });
    }
};

// 2. ROTATION DU LIEN (Appelé par le système de paiement)
exports.rotateLink = async (subscriberId) => {
    let unique = false;
    let newSlug = '';
    
    // On génère un code et on vérifie qu'il n'existe pas déjà
    // On boucle jusqu'à trouver un code libre (très rapide)
    while (!unique) {
        newSlug = generateShortCode(4); // 4 caractères = millions de possibilités
        const [rows] = await pool.execute('SELECT id FROM subscribers WHERE magic_slug = ?', [newSlug]);
        if (rows.length === 0) unique = true;
    }

    // On met à jour le livreur avec ce nouveau lien
    await pool.execute('UPDATE subscribers SET magic_slug = ? WHERE id = ?', [newSlug, subscriberId]);
    
    return newSlug;
};