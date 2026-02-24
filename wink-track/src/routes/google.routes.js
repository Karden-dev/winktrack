// src/routes/google.routes.js
const express = require('express');
const router = express.Router();
const googleController = require('../controllers/google.controller');

// Ces routes correspondent aux appels faits par api.js dans votre frontend
router.get('/autocomplete', googleController.autocomplete);
router.get('/reverse', googleController.reverseGeocode);
router.get('/details', googleController.getPlaceDetails);

// Route POST pour le calcul complexe d'itinéraire (distance + polyline)
router.post('/calculate', googleController.calculateRoute);

module.exports = router;