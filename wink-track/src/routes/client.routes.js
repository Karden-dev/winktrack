const express = require('express');
const router = express.Router();
const clientController = require('../controllers/client.controller');

// ==========================================
// 📦 GESTION DES COMMANDES (FLUX PRINCIPAL)
// ==========================================

// 1. Créer une nouvelle commande (Appelé par l'Expéditeur)
router.post('/order/create', clientController.createOrder);

// 2. Vérifier le statut d'une commande (Polling Expéditeur)
router.get('/order/:orderId/status', clientController.checkStatus);

// 3. Résoudre le token (Appelé par le Destinataire sur confirm.html)
router.get('/order/resolve/:token', clientController.resolveOrderToken);

// 4. Valider la destination et calculer le prix (Appelé par le Destinataire)
router.post('/order/validate-destination', clientController.validateDropoff);


// ==========================================
// 👤 ESPACE CLIENT (DASHBOARD & PROFIL)
// ==========================================

// 5. Récupérer l'historique des courses
router.get('/history/:phone', clientController.getHistory);

// 6. Récupérer les infos du profil (Nom, Solde, Paiement par défaut)
router.get('/profile/:phone', clientController.getProfile);

// 7. Mettre à jour le profil (Modifier nom ou numéro de paiement)
router.put('/profile/:phone', clientController.updateProfile);

module.exports = router;