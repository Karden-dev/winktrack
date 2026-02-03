const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// URL: /api/auth/register
// Appelé quand le livreur clique sur "Activer mon GPS" ou met à jour son profil
router.post('/register', authController.register);

// URL: /api/auth/check
// (Optionnel) Pour vérifier si un numéro existe déjà sans l'inscrire
router.post('/check', authController.checkUser);

module.exports = router;