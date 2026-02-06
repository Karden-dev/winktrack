const { pool } = require('../app');

class OrderModel {

    // ==========================================
    // 📦 PARTIE CLIENT (EXPÉDITEUR / DESTINATAIRE)
    // ==========================================

    // 1. Créer une commande (Expéditeur)
    static async create(data) {
        const { senderId, rPhone, rName, lat, lng, desc, token } = data;
        
        const sql = `
            INSERT INTO orders 
            (sender_id, recipient_phone, recipient_name, pickup_lat, pickup_lng, pickup_desc, status, magic_token, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 'WAITING_DROPOFF', ?, NOW())
        `;
        
        const [result] = await pool.execute(sql, [senderId, rPhone, rName, lat, lng, desc, token]);
        return result.insertId;
    }

    // 2. Trouver une commande par ID (Pour le Polling)
    static async findById(id) {
        const sql = `
            SELECT o.*, s.phone_number as sender_phone 
            FROM orders o 
            LEFT JOIN subscribers s ON o.sender_id = s.id 
            WHERE o.id = ?
        `;
        const [rows] = await pool.execute(sql, [id]);
        return rows[0];
    }

    // 3. Trouver par Token (Pour le lien du Destinataire)
    static async findByToken(token) {
        const sql = `SELECT * FROM orders WHERE magic_token = ?`;
        const [rows] = await pool.execute(sql, [token]);
        return rows[0];
    }

    // 4. Valider le point de livraison (Destinataire)
    static async updateDropoff(id, lat, lng, distance, price) {
        const sql = `
            UPDATE orders 
            SET dropoff_lat = ?, dropoff_lng = ?, distance_km = ?, estimated_price = ?, status = 'READY_TO_PAY', updated_at = NOW()
            WHERE id = ?
        `;
        await pool.execute(sql, [lat, lng, distance, price, id]);
    }

    // ==========================================
    // 🛵 PARTIE LIVREUR (RIDER APP)
    // ==========================================

    // 5. RADAR : Trouver les commandes disponibles (Payées, sans livreur)
    static async findAvailable() {
        const sql = `
            SELECT 
                o.id, 
                o.pickup_lat, o.pickup_lng, o.pickup_desc,
                o.dropoff_lat, o.dropoff_lng,
                o.estimated_price, o.distance_km, o.created_at,
                s.first_name as sender_name, s.phone_number as sender_phone
            FROM orders o
            JOIN subscribers s ON o.sender_id = s.id
            WHERE o.status = 'PAID' 
            AND o.rider_id IS NULL
            ORDER BY o.created_at DESC
        `;
        const [rows] = await pool.execute(sql);
        return rows;
    }

    // 6. ACCEPTER : Assigner un livreur à une commande
    static async assignRider(orderId, riderId) {
        const sql = `
            UPDATE orders 
            SET rider_id = ?, status = 'ASSIGNED', updated_at = NOW()
            WHERE id = ? AND rider_id IS NULL
        `;
        const [result] = await pool.execute(sql, [riderId, orderId]);
        return result.affectedRows > 0; // Retourne true si réussi, false si déjà pris
    }

    // 7. ÉTAPES : Mettre à jour le statut (Pickup)
    static async updateStatus(orderId, status) {
        // Statuts autorisés : PICKED_UP, DELIVERED
        const sql = `UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?`;
        await pool.execute(sql, [status, orderId]);
    }

    // 8. TERMINER : Marquer comme livré et enregistrer les gains
    static async completeOrder(orderId, earnings, commission) {
        const sql = `
            UPDATE orders 
            SET status = 'DELIVERED', rider_earnings = ?, commission_amount = ?, updated_at = NOW()
            WHERE id = ?
        `;
        await pool.execute(sql, [earnings, commission, orderId]);
    }
}

module.exports = OrderModel;