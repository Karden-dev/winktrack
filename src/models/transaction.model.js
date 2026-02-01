const { pool } = require('../app');

class TransactionModel {

    // 1. Créer une nouvelle transaction (Statut 'pending' par défaut)
    // On l'appelle AVANT d'envoyer la demande à Flutterwave
    static async create(data) {
        const { subscriber_id, amount, external_ref, payment_method } = data;
        
        const sql = `
            INSERT INTO transactions 
            (subscriber_id, amount, external_ref, payment_method, status, created_at)
            VALUES (?, ?, ?, ?, 'pending', NOW())
        `;
        
        const [result] = await pool.execute(sql, [subscriber_id, amount, external_ref, payment_method]);
        return result.insertId;
    }

    // 2. Trouver une transaction par sa référence Flutterwave (tx_ref)
    // Utile quand le Webhook de Flutterwave nous contacte
    static async findByReference(ref) {
        const sql = `SELECT * FROM transactions WHERE external_ref = ?`;
        const [rows] = await pool.execute(sql, [ref]);
        return rows[0];
    }

    // 3. Mettre à jour le statut (Succès ou Échec)
    static async updateStatus(id, status) {
        const sql = `UPDATE transactions SET status = ? WHERE id = ?`;
        await pool.execute(sql, [status, id]);
    }

    // 4. (Bonus) Voir l'historique des paiements d'un livreur
    static async getHistoryBySubscriber(subscriberId) {
        const sql = `SELECT * FROM transactions WHERE subscriber_id = ? ORDER BY created_at DESC`;
        const [rows] = await pool.execute(sql, [subscriberId]);
        return rows;
    }
}

module.exports = TransactionModel;