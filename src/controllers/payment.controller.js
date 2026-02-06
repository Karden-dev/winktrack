const { pool } = require('../app');
const TransactionModel = require('../models/transaction.model');
const SubscriberModel = require('../models/subscriber.model');
const trackController = require('./track.controller');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY;
const FLW_SECRET_HASH = process.env.FLW_SECRET_HASH; 

/**
 * 1. INITIALISER LE PAIEMENT (Déclenche le Push USSD sur le téléphone)
 */
exports.initiatePayment = async (req, res) => {
    try {
        let { phone, amount, currency, network, country } = req.body;

        // Nettoyage et Indicatif
        phone = phone.replace(/\D/g, ''); 
        const countryCodes = { 'CM': '237', 'SN': '221', 'CI': '225', 'BF': '226', 'GN': '224' };
        const prefix = countryCodes[country] || '237';
        if (!phone.startsWith(prefix)) phone = prefix + phone;

        const txRef = `WINK-${uuidv4().substring(0, 8)}-${Date.now()}`;

        // On cherche le livreur avec le numéro original (tel qu'inscrit)
        const rider = await SubscriberModel.findByPhone(req.body.phone);
        if (!rider) {
            return res.status(404).json({ success: false, error: "Livreur non trouvé." });
        }

        await TransactionModel.create({
            subscriber_id: rider.id,
            amount: amount,
            payment_method: network,
            external_ref: txRef
        });

        const payload = {
            tx_ref: txRef,
            amount: amount,
            currency: currency,
            email: rider.email || 'contact@winktrack.com',
            phone_number: phone,
            fullname: rider.first_name,
            country: country,
            network: network.toUpperCase()
        };

        const response = await axios.post(
            'https://api.flutterwave.com/v3/charges?type=mobile_money_franco',
            payload,
            { 
                headers: { 
                    Authorization: `Bearer ${FLW_SECRET_KEY}`,
                    'Content-Type': 'application/json'
                } 
            }
        );

        if (response.data.status === 'success') {
            res.json({ success: true, message: "Demande envoyée. Validez la transaction sur votre téléphone." });
        } else {
            res.status(400).json({ success: false, error: response.data.message });
        }

    } catch (error) {
        console.error("ERREUR PAIEMENT:", error.response ? error.response.data : error.message);
        res.status(500).json({ success: false, error: "Impossible de joindre l'opérateur. Réessayez." });
    }
};

/**
 * 2. WEBHOOK (Validation et Récompenses)
 */
exports.handleWebhook = async (req, res) => {
    try {
        const signature = req.headers['verif-hash'];
        if (!signature || signature !== FLW_SECRET_HASH) {
            return res.status(401).end();
        }

        const event = req.body;
        
        if (event.event === 'charge.completed' && event.data.status === 'successful') {
            const txRef = event.data.tx_ref;
            const transaction = await TransactionModel.findByReference(txRef);
            
            if (!transaction || transaction.status === 'success') {
                return res.sendStatus(200);
            }

            const subscriberId = transaction.subscriber_id;
            const connection = await pool.getConnection();
            
            try {
                await connection.beginTransaction();

                // 1. Valider la transaction
                await connection.execute(
                    'UPDATE transactions SET status = ? WHERE id = ?', 
                    ['success', transaction.id]
                );
                
                // 2. Prolonger l'abonnement du FILLEUL (+7 jours pour son achat)
                const [rows] = await connection.execute(
                    'SELECT subscription_expires_at, referred_by FROM subscribers WHERE id = ?', 
                    [subscriberId]
                );
                const currentRider = rows[0];
                
                let newExpiry = new Date();
                if (currentRider.subscription_expires_at && new Date(currentRider.subscription_expires_at) > new Date()) {
                    newExpiry = new Date(currentRider.subscription_expires_at);
                }
                newExpiry.setDate(newExpiry.getDate() + 7); // Le filleul a payé pour 7 jours

                await connection.execute(
                    'UPDATE subscribers SET subscription_expires_at = ? WHERE id = ?', 
                    [newExpiry, subscriberId]
                );

                // --- 3. CORRECTION RÉCOMPENSE PARRAIN (+3 jours seulement) ---
                if (currentRider.referred_by) {
                    console.log(`🎁 Récompense Parrainage détectée pour : ${currentRider.referred_by}`);
                    
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
                        
                        // ICI : On ajoute 3 jours au lieu de 7
                        pExpiry.setDate(pExpiry.getDate() + 3);

                        await connection.execute(
                            'UPDATE subscribers SET subscription_expires_at = ? WHERE id = ?', 
                            [pExpiry, p.id]
                        );
                        console.log(`✅ Parrain récompensé (+3 jours).`);
                    }
                }

                await connection.commit();
                await trackController.rotateLink(subscriberId);

            } catch (dbErr) {
                await connection.rollback();
                throw dbErr;
            } finally {
                connection.release();
            }
        }
        res.sendStatus(200);
    } catch (error) {
        console.error("❌ ERREUR WEBHOOK:", error);
        res.sendStatus(500);
    }
};