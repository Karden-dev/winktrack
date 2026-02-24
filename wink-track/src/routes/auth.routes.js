const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Vérification stricte des fonctions (Ajout de registerRider)
if (!authController.loginClient || !authController.loginRider || !authController.registerRider || !authController.loginAdmin) {
    console.error("❌ Erreur : Une ou plusieurs fonctions du contrôleur auth sont undefined !");
}

// Routes Clients
router.post('/loginClient', authController.loginClient);

// Routes Livreurs
router.post('/registerRider', authController.registerRider); // ✅ Nouvelle route d'inscription
router.post('/loginRider', authController.loginRider);

// Routes Admin
router.post('/loginAdmin', authController.loginAdmin);

module.exports = router;