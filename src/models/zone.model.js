// src/models/zone.model.js

// Variable locale pour stocker le pool injecté par app.js
let pool; 

class ZoneModel {
    /**
     * Initialise le pool de connexion (appelé dans app.js)
     * @param {Object} dbPool 
     */
    static init(dbPool) {
        pool = dbPool;
    }

    /**
     * Récupère les tarifs d'une zone par son nom et sa ville.
     * Utilisé pour la tarification dynamique.
     */
    static async getPricing(name, city = 'Douala') {
        // Utilise l'instance pool injectée
        const [rows] = await pool.execute(
            'SELECT base_fare, price_per_km, surge_multiplier FROM zones WHERE name = ? AND city = ? AND is_active = 1',
            [name, city]
        );
        return rows[0] || null;
    }

    /**
     * Récupère la zone par défaut si aucune zone spécifique n'est trouvée.
     */
    static async getDefaultPricing() {
        const [rows] = await pool.execute(
            'SELECT base_fare, price_per_km, surge_multiplier FROM zones LIMIT 1'
        );
        return rows[0];
    }
}

module.exports = ZoneModel;