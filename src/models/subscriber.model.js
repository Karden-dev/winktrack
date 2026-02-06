const { pool } = require('../app');

class SubscriberModel {
    
    // --- 1. CRÉATION (Avec correction anti-crash "undefined") ---
    static async create(data) {
        // On définit des valeurs par défaut (= null) pour éviter l'erreur SQL si un champ manque
        const { 
            phone_number, 
            magic_slug, 
            first_name = null, 
            last_name = null, 
            city = null, 
            country = 'Cameroun', 
            is_independent = 1, 
            company_name = null,
            referral_code = null, 
            referred_by = null, 
            subscription_expires_at = null 
        } = data;

        const sql = `
            INSERT INTO subscribers 
            (phone_number, magic_slug, first_name, last_name, city, country, is_independent, company_name, 
            is_registered_full, created_at, referral_code, referred_by, subscription_expires_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), ?, ?, ?)
        `;

        try {
            const [result] = await pool.execute(sql, [
                phone_number, magic_slug, first_name, last_name, 
                city, country, is_independent, company_name,
                referral_code, referred_by, subscription_expires_at
            ]);
            return result.insertId;
        } catch (err) {
            console.error("❌ ERREUR SQL Create Subscriber:", err.message);
            throw err;
        }
    }

    // --- 2. RECHERCHE PAR TÉLÉPHONE ---
    static async findByPhone(phone) {
        const sql = `SELECT * FROM subscribers WHERE phone_number = ?`;
        
        try {
            const [rows] = await pool.execute(sql, [phone]);
            return rows[0];
        } catch (err) {
            console.error(`❌ ERREUR SQL (findByPhone):`, err.message);
            throw err;
        }
    }

    // --- 3. RECHERCHE PAR CODE PARRAIN ---
    static async findByReferralCode(code) {
        const sql = `SELECT id FROM subscribers WHERE referral_code = ?`;
        const [rows] = await pool.execute(sql, [code]);
        return rows[0];
    }

    // --- 4. RECHERCHE PAR SLUG (Lien Magique) ---
    static async findBySlug(slug) {
        const sql = `
            SELECT 
                id, phone_number, first_name, last_name, 
                is_independent, company_name, 
                subscription_expires_at, 
                total_gps_captures, magic_slug,
                custom_message_template, is_online,
                photo_url, vehicle_type, reputation_score,
                referral_code
            FROM subscribers 
            WHERE magic_slug = ?
        `;
        const [rows] = await pool.execute(sql, [slug]);
        return rows[0];
    }

    // --- 5. MISE À JOUR ABONNEMENT ---
    static async updateSubscription(id, newExpirationDate) {
        const sql = `UPDATE subscribers SET subscription_expires_at = ? WHERE id = ?`;
        await pool.execute(sql, [newExpirationDate, id]);
    }

    // --- 6. STATISTIQUES (+1 Livraison) ---
    static async incrementStats(id) {
        const sql = `UPDATE subscribers SET total_gps_captures = COALESCE(total_gps_captures, 0) + 1 WHERE id = ?`;
        await pool.execute(sql, [id]);
    }

    // --- 7. MISE À JOUR PROFIL ---
    static async updateProfile(id, data) {
        const { first_name, last_name, city, is_independent, company_name, custom_message_template } = data;
        const sql = `
            UPDATE subscribers 
            SET first_name=?, last_name=?, city=?, is_independent=?, company_name=?, custom_message_template=?
            WHERE id=?
        `;
        await pool.execute(sql, [first_name, last_name, city, is_independent, company_name, custom_message_template, id]);
    }

    // --- 8. COMPTEUR FILLEULS ---
    static async countReferrals(myCode) {
        const sql = `SELECT COUNT(*) as total FROM subscribers WHERE referred_by = ?`;
        const [rows] = await pool.execute(sql, [myCode]);
        return rows[0].total;
    }
}

module.exports = SubscriberModel;