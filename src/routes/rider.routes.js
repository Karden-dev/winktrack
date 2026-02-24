const express = require('express');
const router = express.Router();
const riderController = require('../controllers/rider.controller');
const upload = require('../middlewares/upload.middleware'); // ✅ Import du middleware Multer

// --- 1. DASHBOARD & PROFIL ---
// Récupère les infos du livreur (Profil, Stats, Véhicule)
// GET /api/riders/me?phone=699...
router.get('/me', riderController.getDashboardInfo);

// Change le statut (En ligne / Hors ligne)
// POST /api/riders/status
router.post('/status', riderController.toggleStatus);

// --- 1.1 DOCUMENTS (UPLOAD) ---
// Envoi des documents officiels (CNI, Permis, Carte Grise)
// POST /api/riders/documents
router.post('/documents', upload.fields([
    { name: 'cni', maxCount: 1 },
    { name: 'license', maxCount: 1 },
    { name: 'greyCard', maxCount: 1 }
]), riderController.uploadDocuments);

// --- 1.2 ÉQUIPEMENT ---
// Mise à jour du matériel (Sac, Support smartphone)
// PUT /api/riders/equipment
router.put('/equipment', riderController.updateEquipment);

// --- 2. RADAR & MISSIONS ---
// Radar : Voir les commandes autour (Lat/Lng requis en query)
// GET /api/riders/available?lat=4.05&lng=9.70
router.get('/available', riderController.getAvailableOrders);

// Accepter une commande (Le "Ding")
// POST /api/riders/accept/42
router.post('/accept/:orderId', riderController.acceptOrder);

// --- 3. TRACKING GPS ---
// Mise à jour de la position en temps réel
// POST /api/riders/location
router.post('/location', riderController.updateLocation);

// --- 4. FINANCE ---
// Récupérer le solde et l'historique
// GET /api/riders/wallet/15
router.get('/wallet/:riderId', riderController.getWallet);

// --- 5. ADMINISTRATION (BACK-OFFICE) ---
// Récupérer toutes les positions des livreurs en ligne pour la carte Admin
// GET /api/riders/all-positions
router.get('/all-positions', riderController.getAllPositions);

module.exports = router;