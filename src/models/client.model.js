// src/models/client.model.js

// Variable locale pour stocker la connexion
let pool; 

class ClientModel {
    /**
     * Initialise le pool de connexion (appelé dans app.js)
     * @param {Object} dbPool 
     */
    static init(dbPool) {
        pool = dbPool;
    }

    /**
     * Trouver un client par son numéro de téléphone
     */
    static async findByPhone(phone) {
        const [rows] = await pool.execute(
            'SELECT * FROM clients WHERE phone = ?',
            [phone]
        );
        return rows[0];
    }

    /**
     * Créer un nouveau client
     */
    static async create(data) {
        const { phone, first_name = 'Nouveau', last_name = 'Client', referral_code = null } = data;
        const [result] = await pool.execute(
            'INSERT INTO clients (phone, first_name, last_name, referral_code, created_at) VALUES (?, ?, ?, ?, NOW())',
            [phone, first_name, last_name, referral_code]
        );
        return result.insertId;
    }

    /**
     * ✅ NOUVEAU : Mettre à jour les informations du profil
     * Permet d'éditer le nom, prénom et le numéro de paiement
     */
    static async update(phone, data) {
        const { first_name, last_name, payment_number } = data;
        
        const sql = `
            UPDATE clients 
            SET first_name = ?, 
                last_name = ?, 
                payment_number = ? 
            WHERE phone = ?
        `;

        const [result] = await pool.execute(sql, [
            first_name, 
            last_name, 
            payment_number, 
            phone
        ]);
        
        return result.affectedRows > 0;
    }

    /**
     * Trouver par ID
     */
    static async findById(id) {
        const [rows] = await pool.execute('SELECT * FROM clients WHERE id = ?', [id]);
        return rows[0];
    }

    /**
     * Mettre à jour le solde du portefeuille
     */
    static async updateWallet(id, amount) {
        const [result] = await pool.execute(
            'UPDATE clients SET wallet_balance = wallet_balance + ? WHERE id = ?',
            [amount, id]
        );
        return result.affectedRows > 0;
    }

    /**
     * Récupérer l'historique complet des commandes
     */
    static async getOrderHistory(clientId) {
        const [rows] = await pool.execute(
            `SELECT id, pickup_address, dropoff_address, total_price, status, created_at 
             FROM orders WHERE client_id = ? ORDER BY created_at DESC`,
            [clientId]
        );
        return rows;
    }
}

module.exports = ClientModel;