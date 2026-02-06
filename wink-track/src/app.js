require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mysql = require('mysql2/promise');
const helmet = require('helmet');

// --- 1. CONFIGURATION BASE DE DONNÉES & LOGS DE DÉMARRAGE ---
console.log("------------------------------------------------");
console.log("🚀 DÉMARRAGE DU SERVEUR WINK TRACK (Mode cPanel)");
console.log("------------------------------------------------");

const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    decimalNumbers: true, 
    timezone: 'Z'
};

console.log(`[CONFIG DB] Hôte: ${dbConfig.host}`);
console.log(`[CONFIG DB] User: ${dbConfig.user}`);

const pool = mysql.createPool(dbConfig);

// Test de connexion immédiat
pool.getConnection()
    .then(connection => {
        console.log('✅ SUCCÈS : Base de données connectée !');
        connection.release();
    })
    .catch(err => {
        console.error('❌ ERREUR FATALE DB (Au démarrage) :', err.message);
        console.error('   -> Vérifiez vos variables .env dans cPanel');
    });

// Export du pool pour les modèles
module.exports.pool = pool;

// --- 2. INITIALISATION APP ---
const app = express();
const PORT = process.env.PORT || 3000;

// --- 3. MIDDLEWARES ---
app.use(helmet({
    contentSecurityPolicy: false, 
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- [MOUCHARD] LOG DES REQUÊTES ---
app.use((req, res, next) => {
    console.log(`🔔 [REQUÊTE REÇUE] ${req.method} ${req.url}`);
    if (Object.keys(req.body).length > 0) {
        const safeBody = { ...req.body };
        if(safeBody.password) safeBody.password = "*****";
        console.log(`   📦 Payload: ${JSON.stringify(safeBody)}`);
    }
    next();
});

// --- 4. ROUTES API ---
const authRoutes = require('./routes/auth.routes');
const trackRoutes = require('./routes/track.routes');
const paymentRoutes = require('./routes/payment.routes');
const riderRoutes = require('./routes/rider.routes');
// AJOUT CRITIQUE : Import des routes pour l'application client (Expéditeur)
const clientRoutes = require('./routes/client.routes'); 

app.use('/api/auth', authRoutes);
app.use('/api/track', trackRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/rider', riderRoutes);
// AJOUT CRITIQUE : Activation des routes Client
app.use('/api/client', clientRoutes);

// Route de test
app.get('/api/status', (req, res) => res.json({ status: 'OK', message: 'API opérationnelle' }));

// --- 5. FICHIERS STATIQUES & SPA FALLBACK ---
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));

// Gestion du rafraîchissement des pages (SPA)
app.get('/', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

app.get(/.*/, (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

// --- 6. DÉMARRAGE ---
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`👂 Serveur en écoute sur le port ${PORT}`);
        console.log(`🔌 API Client active sur : /api/client`);
    });
}

module.exports = app;