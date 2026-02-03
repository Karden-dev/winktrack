const { pool } = require('../app');
const TransactionModel = require('../models/transaction.model');
const SubscriberModel = require('../models/subscriber.model');
const trackController = require('./track.controller');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Récupération des clés Campay depuis le .env
const CAMPAY_TOKEN = process.env.CAMPAY_TOKEN;
const CAMPAY_WEBHOOK_KEY = process.env.CAMPAY_WEBHOOK_KEY; 

/**
 * 1. INITIALISER LE PAIEMENT (Via Campay)
 */
exports.initiatePayment = async (req, res) => {
    try {
        let { phone, amount } = req.body;

        // Nettoyage du numéro
        phone = phone.replace(/\D/g, ''); 
        
        // Format international (237...)
        if (!phone.startsWith('237')) {
            phone = '237' + phone;
        }

        // Référence unique
        const externalRef = `WINK-${uuidv4().substring(0, 8)}-${Date.now()}`;

        // Vérification du livreur
        const rider = await SubscriberModel.findByPhone(req.body.phone);
        if (!rider) {
            return res.status(404).json({ success: false, error: "Livreur non trouvé." });
        }

        // Création transaction 'pending'
        await TransactionModel.create({
            subscriber_id: rider.id,
            amount: amount,
            payment_method: 'campay',
            external_ref: externalRef
        });

        // Appel API Campay
        const payload = {
            amount: amount.toString(),
            currency: "XAF",
            from: phone,
            description: "Abonnement Wink Track",
            external_reference: externalRef
        };

        const campayResponse = await axios.post(
            'https://www.campay.net/api/collect/',
            payload,
            { 
                headers: { 
                    'Authorization': `Token ${CAMPAY_TOKEN}`,
                    'Content-Type': 'application/json'
                } 
            }
        );

        console.log("✅ Campay Init Success:", campayResponse.data);

        res.json({ 
            success: true, 
            message: "Validez le code USSD sur votre téléphone.",
            ref: externalRef
        });

    } catch (error) {
        console.error("❌ ERREUR CAMPAY INIT:", error.response ? error.response.data : error.message);
        res.status(500).json({ 
            success: false, 
            error: "Échec de la demande. Vérifiez le numéro et réessayez." 
        });
    }
};

/**
 * 2. WEBHOOK (Validation automatique)
 */
exports.handleWebhook = async (req, res) => {
    try {
        const event = req.body;
        
        // Vérification statut
        if (event.status.toLowerCase() !== 'successful') {
            return res.sendStatus(200); 
        }

        const myRef = event.external_reference;
        if (!myRef) return res.sendStatus(400);

        const transaction = await TransactionModel.findByReference(myRef);
        
        if (!transaction || transaction.status === 'success') {
            return res.sendStatus(200);
        }

        // Validation DB
        const subscriberId = transaction.subscriber_id;
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();

            // A. Marquer payé
            await connection.execute(
                'UPDATE transactions SET status = ? WHERE id = ?', 
                ['success', transaction.id]
            );
            
            // B. Prolonger l'abonnement (+7 jours)
            const [rows] = await connection.execute(
                'SELECT subscription_expires_at, referred_by FROM subscribers WHERE id = ?', 
                [subscriberId]
            );
            const currentRider = rows[0];
            
            let newExpiry = new Date();
            if (currentRider.subscription_expires_at && new Date(currentRider.subscription_expires_at) > new Date()) {
                newExpiry = new Date(currentRider.subscription_expires_at);
            }
            newExpiry.setDate(newExpiry.getDate() + 7);

            await connection.execute(
                'UPDATE subscribers SET subscription_expires_at = ? WHERE id = ?', 
                [newExpiry, subscriberId]
            );

            // C. Bonus Parrain (+7 jours)
            if (currentRider.referred_by) {
                const [parrains] = await connection.execute(
                    'SELECT id, subscription_expires_at FROM subscribers WHERE referral_code = ?', 
                    [currentRider.referred_by]
                );
                
                if (parrains.length > 0) {
                    const p = parrains[0];
                    let pExpiry = new Date();
                    if (p.subscription_expires_at && new Date(p.subscription_expires_at) > new Date()) {
                        pExpiry = new Date(p.subscription_expires_at);
                    }
                    pExpiry.setDate(pExpiry.getDate() + 7);

                    await connection.execute(
                        'UPDATE subscribers SET subscription_expires_at = ? WHERE id = ?', 
                        [pExpiry, p.id]
                    );
                }
            }

            await connection.commit();
            
            // D. Rotation lien
            await trackController.rotateLink(subscriberId);
            console.log(`✅ ABONNEMENT ACTIVÉ : Livreur #${subscriberId}`);

        } catch (dbErr) {
            await connection.rollback();
            throw dbErr;
        } finally {
            connection.release();
        }

        res.sendStatus(200);

    } catch (error) {
        console.error("❌ ERREUR WEBHOOK:", error);
        res.sendStatus(500);
    }
};

/**
 * 3. CHECK STATUS (Pour le polling Frontend)
 */
exports.checkStatus = async (req, res) => {
    try {
        const { ref } = req.params;
        const transaction = await TransactionModel.findByReference(ref);
        
        if (!transaction) {
            return res.json({ status: 'unknown' });
        }
        res.json({ status: transaction.status });
        
    } catch (error) {
        console.error("Erreur checkStatus:", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
};