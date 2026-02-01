const { pool } = require('../app');

class SubscriberModel {
    
    // Créer un nouvel abonné (ou mettre à jour s'il existe déjà est géré par le contrôleur)
    static async create(data) {
        const { 
            phone_number, magic_slug, first_name, last_name, 
            city, country, is_independent, company_name 
        } = data;

        const sql = `
            INSERT INTO subscribers 
            (phone_number, magic_slug, first_name, last_name, city, country, is_independent, company_name, is_registered_full, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())
        `;

        const [result] = await pool.execute(sql, [
            phone_number, magic_slug, first_name, last_name, 
            city, country, is_independent, company_name
        ]);

        return result.insertId;
    }

    // Trouver un abonné par son numéro de téléphone (pour le Login/Register)
    static async findByPhone(phone) {
        const sql = `SELECT * FROM subscribers WHERE phone_number = ?`;
        const [rows] = await pool.execute(sql, [phone]);
        return rows[0];
    }

    // Trouver un abonné par son SLUG (C'est la méthode utilisée quand un client clique sur le lien)
    static async findBySlug(slug) {
        const sql = `
            SELECT 
                id, phone_number, first_name, last_name, 
                is_independent, company_name, 
                subscription_expires_at, 
                total_gps_captures, magic_slug,
                custom_message_template, is_online
            FROM subscribers 
            WHERE magic_slug = ?
        `;
        const [rows] = await pool.execute(sql, [slug]);
        return rows[0];
    }

    // Mettre à jour la date d'expiration (Paiement réussi)
    static async updateSubscription(id, newExpirationDate) {
        const sql = `UPDATE subscribers SET subscription_expires_at = ? WHERE id = ?`;
        await pool.execute(sql, [newExpirationDate, id]);
    }

    // Incrémenter le compteur de livraisons (Après capture GPS réussie)
    static async incrementStats(id) {
        const sql = `UPDATE subscribers SET total_gps_captures = total_gps_captures + 1 WHERE id = ?`;
        await pool.execute(sql, [id]);
    }

    // Mettre à jour les infos du profil
    static async updateProfile(id, data) {
        const { first_name, last_name, city, is_independent, company_name, custom_message_template } = data;
        const sql = `
            UPDATE subscribers 
            SET first_name=?, last_name=?, city=?, is_independent=?, company_name=?, custom_message_template=?
            WHERE id=?
        `;
        await pool.execute(sql, [first_name, last_name, city, is_independent, company_name, custom_message_template, id]);
    }
}

module.exports = SubscriberModel;