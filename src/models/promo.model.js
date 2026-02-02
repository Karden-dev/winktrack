const { pool } = require('../app');

class PromoModel {
    
    // Trouver un code promo valide
    static async findActiveCode(code) {
        const sql = `
            SELECT * FROM promo_codes 
            WHERE code = ? 
            AND (expires_at IS NULL OR expires_at > NOW())
            AND current_uses < max_uses
        `;
        const [rows] = await pool.execute(sql, [code]);
        return rows[0];
    }

    // Compter une utilisation (+1)
    static async incrementUsage(id) {
        const sql = `UPDATE promo_codes SET current_uses = current_uses + 1 WHERE id = ?`;
        await pool.execute(sql, [id]);
    }
}

module.exports = PromoModel;