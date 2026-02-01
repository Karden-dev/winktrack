require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mysql = require('mysql2/promise');
const helmet = require('helmet');

// --- 1. CONFIGURATION BASE DE DONNÉES (Pool Global) ---
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'wink_track_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    decimalNumbers: true, // CRUCIAL pour garder la précision GPS (lat/long)
    timezone: 'Z'
};

// Création du pool
const pool = mysql.createPool(dbConfig);

// Test de connexion au démarrage
pool.getConnection()
    .then(connection => {
        console.log('✅ WINK TRACK DB: Connecté avec succès !');
        connection.release();
    })
    .catch(err => {
        console.error('❌ ERREUR DB: Impossible de se connecter :', err.message);
    });

// EXPORT DU POOL
// C'est ici qu'on exporte la connexion pour que les contrôleurs puissent l'utiliser.
// Usage dans un controller: const { pool } = require('../app');
module.exports.pool = pool;

// --- 2. INITIALISATION APP EXPRESS ---
const app = express();
const PORT = process.env.PORT || 3000;

// --- 3. MIDDLEWARES (Sécurité & Parsing) ---
// On désactive CSP temporairement pour autoriser les scripts inline si besoin
app.use(helmet({
    contentSecurityPolicy: false,
}));
app.use(cors()); // Autorise les requêtes externes
app.use(express.json()); // Pour lire le JSON (Flutterwave/Frontend)
app.use(express.urlencoded({ extended: true })); // Pour les formulaires classiques

// --- 4. FICHIERS STATIQUES (Frontend) ---
// Sert le dossier 'public' situé à la racine du projet
app.use(express.static(path.join(__dirname, '../public')));

// --- 5. IMPORTATION DES ROUTES ---
// On charge les fichiers de routes que nous avons créés
const authRoutes = require('./routes/auth.routes');
const trackRoutes = require('./routes/track.routes');
const paymentRoutes = require('./routes/payment.routes');
const riderRoutes = require('./routes/rider.routes');

// --- 6. DÉFINITION DES URLs API ---
// Route de test simple
app.get('/api/status', (req, res) => res.json({ status: 'OK', message: 'Wink Track API v1' }));

// Montage des routes fonctionnelles
app.use('/api/auth', authRoutes);       // Inscription / Connexion
app.use('/api/track', trackRoutes);     // Lien GPS / Capture
app.use('/api/payment', paymentRoutes); // Paiements Flutterwave
app.use('/api/rider', riderRoutes);     // Dashboard Livreur

// --- 7. ROUTE PAR DÉFAUT API (Gestion 404 API) ---
// CORRECTION APPLIQUÉE : On utilise '/api' au lieu de '/api/*' pour éviter le crash
app.use('/api', (req, res) => {
    res.status(404).json({ error: "Endpoint API introuvable" });
});

// --- 8. ROUTE FALLBACK (Frontend SPA) ---
// CORRECTION APPLIQUÉE : On utilise une Regex /.*/ au lieu de '*' pour éviter le crash
// Si l'URL n'est pas une API, on renvoie toujours le site web (index.html)
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// --- 9. DÉMARRAGE DU SERVEUR ---
// Vérifie si le fichier est lancé directement
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 SERVEUR WINK TRACK LANCÉ SUR : http://localhost:${PORT}`);
        console.log(`📂 Dossier public servi : ${path.join(__dirname, '../public')}`);
    });
}

module.exports.app = app;