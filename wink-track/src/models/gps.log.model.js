const { pool } = require('../app');

class GpsLogModel {

    // 1. Enregistrer une nouvelle position capturée (Le "Journal de Bord")
    static async create(data) {
        const { subscriber_id, latitude, longitude, accuracy, user_agent } = data;
        
        const sql = `
            INSERT INTO gps_logs 
            (subscriber_id, latitude, longitude, accuracy_meters, client_user_agent, created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        `;
        
        // On insère : Qui (subscriber_id), Où (lat/long), Précision (accuracy) et Avec Quoi (user_agent = Android/iPhone)
        const [result] = await pool.execute(sql, [subscriber_id, latitude, longitude, accuracy, user_agent]);
        return result.insertId;
    }

    // 2. Récupérer l'historique pour un livreur (ex: pour afficher ses stats détaillées)
    static async findBySubscriber(subscriberId, limit = 50) {
        const sql = `
            SELECT id, latitude, longitude, accuracy_meters, created_at 
            FROM gps_logs 
            WHERE subscriber_id = ? 
            ORDER BY created_at DESC 
            LIMIT ?
        `;
        const [rows] = await pool.execute(sql, [subscriberId, limit]);
        return rows;
    }

    // 3. (Maintenance) Supprimer les logs très vieux (ex: +90 jours) pour ne pas saturer la base
    // On pourra appeler cette fonction une fois par semaine via un script
    static async cleanOldLogs(daysToKeep = 90) {
        const sql = `DELETE FROM gps_logs WHERE created_at < NOW() - INTERVAL ? DAY`;
        const [result] = await pool.execute(sql, [daysToKeep]);
        return result.affectedRows;
    }
}

module.exports = GpsLogModel;