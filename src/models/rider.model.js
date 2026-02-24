// src/models/rider.model.js

// Variable locale pour stocker le pool injecté par app.js
let pool; 

class RiderModel {
    /**
     * Initialise le pool de connexion (appelé dans app.js)
     * @param {Object} dbPool 
     */
    static init(dbPool) {
        pool = dbPool;
    }

    // ============================================================
    // 1. AUTH & ENRÔLEMENT
    // ============================================================

    /**
     * Enrôlement (Inscription)
     * ✅ Correction du crash toUpperCase() et intégration du champ City
     */
    static async enroll(data) {
        // On récupère les variables envoyées par le contrôleur (auth.controller.js)
        const { phone, firstName, lastName, vehicle_info, license_plate, password, city } = data;
        
        // ✅ SÉCURITÉ : Empêche le crash si firstName est absent pour le code parrainage
        const namePrefix = (firstName || "WNK").toUpperCase().substring(0, 3);
        const referralCode = `WINK-${namePrefix}${Math.floor(Math.random() * 1000)}`;
        
        // ✅ SÉCURITÉ : Correction de l'erreur TypeError sur .toUpperCase()
        // Si la ville est absente, on utilise 'YAOUNDÉ' par défaut
        const finalCity = (city || 'YAOUNDÉ').toUpperCase();

        // Le mot de passe (PIN) arrive déjà haché du contrôleur
        const finalPassword = password || 'TEMPORARY_PASS';

        const sql = `
            INSERT INTO riders 
            (phone, password, first_name, last_name, vehicle_info, license_plate, referral_code, city, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', NOW())
        `;
        
        const [result] = await pool.execute(sql, [
            phone, 
            finalPassword, 
            firstName || '', 
            lastName || '', 
            vehicle_info || null, 
            license_plate || null, 
            referralCode,
            finalCity
        ]);
        return result.insertId;
    }

    static async findByPhone(phone) {
        const [rows] = await pool.execute('SELECT * FROM riders WHERE phone = ?', [phone]);
        return rows[0];
    }

    static async findById(id) {
        const [rows] = await pool.execute('SELECT * FROM riders WHERE id = ?', [id]);
        return rows[0];
    }

    // ============================================================
    // 2. GÉOLOCALISATION, STATUT & PERSISTANCE
    // ============================================================

    static async updateLocation(id, lat, lng) {
        const sql = `
            UPDATE riders 
            SET current_lat = ?, current_lng = ?, is_online = 1, last_active = NOW()
            WHERE id = ?
        `;
        await pool.execute(sql, [lat, lng, id]);
    }

    static async toggleOnline(id, isOnline) {
        await pool.execute('UPDATE riders SET is_online = ? WHERE id = ?', [isOnline ? 1 : 0, id]);
    }

    /**
     * LOGIQUE DE PERSISTANCE : Vérifie si le livreur a une mission en cours
     */
    static async getCurrentMission(riderId) {
        const sql = `
            SELECT id, status, pickup_address, dropoff_address, total_price, otp_pickup, otp_delivery 
            FROM orders 
            WHERE rider_id = ? 
            AND status IN ('ACCEPTED', 'PICKED_UP') 
            LIMIT 1
        `;
        const [rows] = await pool.execute(sql, [riderId]);
        return rows[0]; 
    }

    /**
     * ADMINISTRATION : Récupère tous les livreurs en ligne pour le Dashboard Admin
     */
    static async findAllPositions() {
        const sql = `
            SELECT id, first_name, last_name, status, current_lat, current_lng, is_online
            FROM riders 
            WHERE is_online = 1 
            AND current_lat IS NOT NULL
        `;
        const [rows] = await pool.execute(sql);
        return rows;
    }

    // ============================================================
    // 3. ÉQUIPEMENT & DOCUMENTS
    // ============================================================

    static async updateDocuments(id, fields) {
        const keys = Object.keys(fields);
        if (keys.length === 0) return;

        const setClause = keys.map(key => `${key} = ?`).join(', ');
        const values = Object.values(fields);
        values.push(id);

        await pool.execute(`UPDATE riders SET ${setClause} WHERE id = ?`, values);
    }

    static async updateEquipment(id, fields) {
        const keys = Object.keys(fields);
        if (keys.length === 0) return;

        const setClause = keys.map(key => `${key} = ?`).join(', ');
        const values = Object.values(fields);
        values.push(id);

        await pool.execute(`UPDATE riders SET ${setClause} WHERE id = ?`, values);
    }

    // ============================================================
    // 4. WALLET & STATS
    // ============================================================

    static async getWalletData(riderId) {
        const [riderRows] = await pool.execute(
            'SELECT wallet_balance, referral_code, status, payment_number FROM riders WHERE id = ?', 
            [riderId]
        );
        const rider = riderRows[0];
        if (!rider) return null;

        const [todayStats] = await pool.execute(`
            SELECT 
                COALESCE(SUM(rider_earnings), 0) as incomeToday,
                COUNT(id) as missionsCount
            FROM orders 
            WHERE rider_id = ? 
            AND status = 'DELIVERED' 
            AND DATE(created_at) = CURDATE()
        `, [riderId]);

        const [transactions] = await pool.execute(`
            SELECT 
                id, 
                'EARNING' as type, 
                CONCAT('Course #', id) as description, 
                rider_earnings as amount, 
                created_at 
            FROM orders 
            WHERE rider_id = ? AND status = 'DELIVERED'
            ORDER BY created_at DESC 
            LIMIT 20
        `, [riderId]);

        return {
            balance: rider.wallet_balance,
            referralCode: rider.referral_code,
            paymentNumber: rider.payment_number,
            status: rider.status,
            incomeToday: todayStats[0].incomeToday,
            missionsCount: todayStats[0].missionsCount,
            transactions: transactions
        };
    }

    static async addEarnings(id, amount) {
        const sql = `
            UPDATE riders 
            SET wallet_balance = wallet_balance + ?, 
                total_deliveries = total_deliveries + 1 
            WHERE id = ?
        `;
        const [result] = await pool.execute(sql, [amount, id]);
        return result.affectedRows > 0;
    }

    static async getStats(id) {
        const [rows] = await pool.execute('SELECT * FROM riders WHERE id = ?', [id]);
        return rows[0];
    }
}

module.exports = RiderModel;