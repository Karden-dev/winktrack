// src/models/order.model.js

// Variable locale pour stocker la connexion
let pool; 

class OrderModel {
    /**
     * Initialise le pool de connexion (appelé dans app.js)
     */
    static init(dbPool) {
        pool = dbPool;
    }

    // ============================================================
    // 1. CRÉATION & MODIFICATION (CRUD)
    // ============================================================

    /**
     * ✅ CRÉER UNE COMMANDE (Utilisé par initiateOrder)
     */
    static async create(data) {
        // CORRECTION : Utilisation de 'package_desc' pour correspondre à la BDD
        const sql = `
            INSERT INTO orders 
            (client_id, pickup_lat, pickup_lng, pickup_address, 
             recipient_name, recipient_phone, package_desc, 
             magic_link_token, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;

        const [result] = await pool.execute(sql, [
            data.client_id,
            data.pickup_lat,
            data.pickup_lng,
            data.pickup_address,
            data.recipient_name,
            data.recipient_phone,
            data.package_description || 'Colis standard', // On récupère la valeur envoyée par le contrôleur
            data.magic_token,
            data.status || 'INITIATED'
        ]);
        return result.insertId;
    }

    /**
     * ✅ METTRE À JOUR UNE COMMANDE (Générique)
     * Utilisé par confirmDestination, finalizeAndPay, etc.
     */
    static async update(id, fields) {
        const keys = Object.keys(fields);
        if (keys.length === 0) return;

        const setClause = keys.map(key => `${key} = ?`).join(', ');
        const values = Object.values(fields);
        values.push(id);

        await pool.execute(`UPDATE orders SET ${setClause} WHERE id = ?`, values);
    }

    /**
     * Crée une commande en mode "Brouillon" (En attente du destinataire)
     * (Ancienne méthode, gardée pour compatibilité si nécessaire)
     */
    static async createDraft(data) {
        const sql = `
            INSERT INTO orders 
            (client_id, pickup_lat, pickup_lng, pickup_address, 
             recipient_name, recipient_phone, package_desc,
             otp_pickup, otp_delivery, magic_link_token, 
             status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'WAITING_DROPOFF', NOW())
        `;

        const [result] = await pool.execute(sql, [
            data.client_id,
            data.pickup.lat,
            data.pickup.lng,
            data.pickup.address,
            data.recipient_name,
            data.recipient_phone,
            data.package_desc || 'Colis standard',
            data.otp_pickup,    
            data.otp_delivery,  
            data.token
        ]);
        return result.insertId;
    }

    // ============================================================
    // 2. RECHERCHE & LECTURE
    // ============================================================

    /**
     * RECHERCHE : Par Token (Magic Link)
     */
    static async findByToken(token) {
        const sql = "SELECT * FROM orders WHERE magic_link_token = ?";
        const [rows] = await pool.execute(sql, [token]);
        return rows[0];
    }

    /**
     * RECHERCHE : Par ID avec détails complets (Client + Livreur)
     */
    static async findById(id) {
        const sql = `
            SELECT o.*, 
                   c.phone as client_phone, c.first_name as client_name,
                   r.phone as rider_phone, r.first_name as rider_name
            FROM orders o
            JOIN clients c ON o.client_id = c.id
            LEFT JOIN riders r ON o.rider_id = r.id
            WHERE o.id = ?
        `;
        const [rows] = await pool.execute(sql, [id]);
        return rows[0];
    }

    /**
     * CLIENT : Historique des commandes d'un client
     */
    static async findAllByClientId(clientId) {
        const sql = `
            SELECT o.*, r.first_name as rider_name, r.phone as rider_phone 
            FROM orders o
            LEFT JOIN riders r ON o.rider_id = r.id
            WHERE o.client_id = ? 
            ORDER BY o.created_at DESC
        `;
        const [rows] = await pool.execute(sql, [clientId]);
        return rows;
    }

    /**
     * LIVREUR : Historique des courses effectuées par un livreur
     */
    static async findAllByRiderId(riderId) {
        const sql = `
            SELECT o.*, c.first_name as client_name, c.phone as client_phone
            FROM orders o
            JOIN clients c ON o.client_id = c.id
            WHERE o.rider_id = ? 
            ORDER BY o.created_at DESC
        `;
        const [rows] = await pool.execute(sql, [riderId]);
        return rows;
    }

    /**
     * ADMIN : Liste complète de toutes les commandes
     */
    static async findAll() {
        const sql = `
            SELECT o.*, c.phone as client_phone, r.first_name as rider_name
            FROM orders o
            LEFT JOIN clients c ON o.client_id = c.id
            LEFT JOIN riders r ON o.rider_id = r.id
            ORDER BY o.created_at DESC
        `;
        const [rows] = await pool.execute(sql);
        return rows;
    }

    // ============================================================
    // 3. ACTIONS RADAR ET ADMIN
    // ============================================================

    /**
     * LIVREUR : Commandes en attente de livreur (Radar)
     */
    static async getAvailableOrders() {
        const [rows] = await pool.execute(
            'SELECT * FROM orders WHERE status = "SEARCHING_RIDER" ORDER BY created_at DESC'
        );
        return rows;
    }

    /**
     * ADMIN : Commandes en cours pour la carte temps réel
     */
    static async findActive() {
        const sql = `
            SELECT id, status, pickup_lat, pickup_lng, pickup_address, 
                   dropoff_lat, dropoff_lng, dropoff_address, 
                   total_price, recipient_name
            FROM orders 
            WHERE status NOT IN ('DELIVERED', 'CANCELLED')
            ORDER BY created_at DESC
        `;
        const [rows] = await pool.execute(sql);
        return rows;
    }

    // ============================================================
    // 4. MISES À JOUR DE STATUT (SPÉCIFIQUES)
    // ============================================================

    static async updateStatus(id, status) {
        await pool.execute('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
    }

    static async assignRider(orderId, riderId) {
        await pool.execute(
            'UPDATE orders SET rider_id = ?, status = "ACCEPTED" WHERE id = ?',
            [riderId, orderId]
        );
    }
    
    // Gère les gains du livreur
    static async addEarnings(riderId, amount) {
         // Note: Cette logique est gérée directement dans RiderModel pour l'instant
    }
}

module.exports = OrderModel;