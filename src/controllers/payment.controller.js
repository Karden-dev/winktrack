const { pool } = require('../app');
const TransactionModel = require('../models/transaction.model');
const trackController = require('./track.controller'); // Pour appeler rotateLink

// Réception du Webhook Flutterwave (Quand le paiement est validé)
exports.handleWebhook = async (req, res) => {
    try {
        // Idéalement, ici on vérifie la signature de sécurité (verif-hash)
        // Pour l'instant, on fait simple pour le prototype.
        
        const event = req.body;
        
        // On vérifie que c'est bien un événement de succès de charge
        if (event.event === 'charge.completed' && event.data.status === 'successful') {
            const txRef = event.data.tx_ref;
            
            // 1. On retrouve la transaction locale
            const transaction = await TransactionModel.findByReference(txRef);
            
            if (!transaction) {
                console.error(`Transaction introuvable pour ref: ${txRef}`);
                return res.sendStatus(200); // On répond 200 pour que Flutterwave arrête d'envoyer
            }

            // Si déjà traitée, on arrête
            if (transaction.status === 'success') return res.sendStatus(200);

            const subscriberId = transaction.subscriber_id;

            // 2. Calcul de la nouvelle date d'expiration
            // On ajoute 7 jours à "Maintenant" (ou à la date actuelle si elle est future ?)
            // Pour faire simple : NOW + 7 Jours
            const daysToAdd = 7;
            const newExpirationDate = new Date();
            newExpirationDate.setDate(newExpirationDate.getDate() + daysToAdd);

            // 3. Mise à jour en Base de Données
            const connection = await pool.getConnection();
            await connection.beginTransaction();

            try {
                // A. Marquer la transaction comme succès
                await connection.execute('UPDATE transactions SET status = ? WHERE id = ?', ['success', transaction.id]);
                
                // B. Mettre à jour la date d'expiration du livreur
                await connection.execute('UPDATE subscribers SET subscription_expires_at = ? WHERE id = ?', [newExpirationDate, subscriberId]);

                // C. ROTATION DU LIEN (Sécurité)
                // On utilise la logique du contrôleur track
                // Note : On doit réimplémenter légèrement ici car on est dans une transaction SQL
                // ou alors on commit d'abord et on rotate après. Rotatons après commit pour simplifier.
                
                await connection.commit();
                
            } catch (err) {
                await connection.rollback();
                throw err;
            } finally {
                connection.release();
            }

            // 4. Exécuter la rotation du lien (Hors transaction, car moins critique si échoue)
            const newLink = await trackController.rotateLink(subscriberId);
            console.log(`✅ Paiement ${txRef} validé. Nouveau lien généré : ${newLink}`);

        }

        res.sendStatus(200); // Toujours répondre 200 OK à un webhook

    } catch (error) {
        console.error("Erreur Webhook:", error);
        res.sendStatus(500);
    }
};

// Initialiser un paiement (Appelé par le Frontend quand le livreur clique "Payer")
exports.initiatePayment = async (req, res) => {
    // Ici on intègrera l'appel API vers Flutterwave pour déclencher le Push USSD
    // Pour l'instant, on prépare juste la structure
    res.json({ message: "Endpoint de paiement prêt" });
};