const { pool } = require('../app');

class SubscriberModel {
    
    // Créer un nouvel abonné (Avec support Parrainage)
    static async create(data) {
        const { 
            phone_number, magic_slug, first_name, last_name, 
            city, country, is_independent, company_name,
            referral_code, referred_by, subscription_expires_at // <--- Nouveaux champs
        } = data;

        const sql = `
            INSERT INTO subscribers 
            (phone_number, magic_slug, first_name, last_name, city, country, is_independent, company_name, 
            is_registered_full, created_at, referral_code, referred_by, subscription_expires_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), ?, ?, ?)
        `;

        const [result] = await pool.execute(sql, [
            phone_number, magic_slug, first_name, last_name, 
            city, country, is_independent, company_name,
            referral_code, referred_by, subscription_expires_at
        ]);

        return result.insertId;
    }

    static async findByPhone(phone) {
        const sql = `SELECT * FROM subscribers WHERE phone_number = ?`;
        const [rows] = await pool.execute(sql, [phone]);
        return rows[0];
    }

    // Vérifier si un code parrain existe (pour validation)
    static async findByReferralCode(code) {
        const sql = `SELECT id FROM subscribers WHERE referral_code = ?`;
        const [rows] = await pool.execute(sql, [code]);
        return rows[0];
    }

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

    static async updateSubscription(id, newExpirationDate) {
        const sql = `UPDATE subscribers SET subscription_expires_at = ? WHERE id = ?`;
        await pool.execute(sql, [newExpirationDate, id]);
    }

    static async incrementStats(id) {
        const sql = `UPDATE subscribers SET total_gps_captures = total_gps_captures + 1 WHERE id = ?`;
        await pool.execute(sql, [id]);
    }

    static async updateProfile(id, data) {
        const { first_name, last_name, city, is_independent, company_name, custom_message_template } = data;
        const sql = `
            UPDATE subscribers 
            SET first_name=?, last_name=?, city=?, is_independent=?, company_name=?, custom_message_template=?
            WHERE id=?
        `;
        await pool.execute(sql, [first_name, last_name, city, is_independent, company_name, custom_message_template, id]);
    }

    // Compter combien de personnes j'ai parrainé (Pour le Dashboard)
    static async countReferrals(myCode) {
        const sql = `SELECT COUNT(*) as total FROM subscribers WHERE referred_by = ?`;
        const [rows] = await pool.execute(sql, [myCode]);
        return rows[0].total;
    }
}

module.exports = SubscriberModel;