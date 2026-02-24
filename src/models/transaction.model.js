// src/models/transaction.model.js

let pool; 

class TransactionModel {
    static init(dbPool) {
        pool = dbPool;
    }

    // Créer une transaction (Enregistrement d'un paiement ou d'un gain)
    static async create(data) {
        const { user_type, user_id, order_id, amount, type, description } = data;
        
        // Note: Ta table SQL actuelle n'a pas de colonne 'status' ou 'external_ref'.
        // On insère donc l'historique brut.
        const sql = `
            INSERT INTO transactions 
            (user_type, user_id, order_id, amount, type, created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        `;
        
        const [result] = await pool.execute(sql, [
            user_type, // 'CLIENT' ou 'RIDER'
            user_id, 
            order_id || null, 
            amount, 
            type // 'PAYMENT', 'EARNING', etc.
        ]);
        return result.insertId;
    }

    // Récupérer l'historique d'un utilisateur
    static async getHistory(userType, userId) {
        const sql = `
            SELECT * FROM transactions 
            WHERE user_type = ? AND user_id = ? 
            ORDER BY created_at DESC
        `;
        const [rows] = await pool.execute(sql, [userType, userId]);
        return rows;
    }
}

module.exports = TransactionModel;