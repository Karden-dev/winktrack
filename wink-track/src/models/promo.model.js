// src/models/promo.model.js

// Variable locale pour stocker le pool injecté par app.js
let pool; 

class PromoModel {
    /**
     * Initialise le pool de connexion (appelé dans app.js)
     * @param {Object} dbPool 
     */
    static init(dbPool) {
        pool = dbPool;
    }

    /**
     * Vérifie si un code promo est valide et disponible.
     */
    static async validateCode(code) {
        const sql = `
            SELECT * FROM promo_codes 
            WHERE code = ? 
            AND (expires_at IS NULL OR expires_at > NOW())
            AND current_uses < max_uses
        `;
        // Utilise l'instance pool injectée
        const [rows] = await pool.execute(sql, [code]);
        return rows[0] || null;
    }

    /**
     * Incrémente le compteur d'utilisation après une commande réussie.
     */
    static async incrementUsage(id) {
        await pool.execute(
            'UPDATE promo_codes SET current_uses = current_uses + 1 WHERE id = ?',
            [id]
        );
    }
}

module.exports = PromoModel;