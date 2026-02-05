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
    database: process.env.DB_NAME, // Vérifie que cette variable n'est pas vide
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    decimalNumbers: true, 
    timezone: 'Z'
};

console.log(`[CONFIG DB] Hôte: ${dbConfig.host}`);
console.log(`[CONFIG DB] User: ${dbConfig.user}`);
// Ne jamais afficher le mot de passe dans les logs par sécurité

const pool = mysql.createPool(dbConfig);

// Test de connexion immédiat pour voir si ça plante au démarrage
pool.getConnection()
    .then(connection => {
        console.log('✅ SUCCÈS : Base de données connectée !');
        connection.release();
    })
    .catch(err => {
        console.error('❌ ERREUR FATALE DB (Au démarrage) :', err.message);
        console.error('   -> Vérifiez vos variables .env (DB_HOST, DB_USER, etc.) dans cPanel');
    });

module.exports.pool = pool;

// --- 2. INITIALISATION APP ---
const app = express();
// Sur cPanel avec Passenger, le port est géré automatiquement, 
// mais on garde cette ligne pour le local ou le debug.
const PORT = process.env.PORT || 3000;

// --- 3. MIDDLEWARES ---
app.use(helmet({
    contentSecurityPolicy: false, 
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- [MOUCHARD] LOG DE CHAQUE REQUÊTE ENTRANTE ---
app.use((req, res, next) => {
    console.log(`🔔 [REQUÊTE REÇUE] ${req.method} ${req.url}`);
    if (Object.keys(req.body).length > 0) {
        console.log(`   📦 Payload: ${JSON.stringify(req.body)}`);
    }
    next();
});

// --- 4. FICHIERS STATIQUES ---
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));
app.get('/favicon.ico', (req, res) => res.status(204).end());

// --- 5. ROUTES API ---
// Assurez-vous que ces fichiers existent bien dans src/routes/
const authRoutes = require('./routes/auth.routes');
const trackRoutes = require('./routes/track.routes');
const paymentRoutes = require('./routes/payment.routes');
const riderRoutes = require('./routes/rider.routes');

app.use('/api/auth', authRoutes);
app.use('/api/track', trackRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/rider', riderRoutes);

// Route de test pour vérifier que l'API répond
app.get('/api/status', (req, res) => res.json({ status: 'OK', message: 'API opérationnelle' }));

// --- 6. ROUTE RACINE (FALLBACK) ---
// Pour renvoyer l'index.html si aucune route API ne correspond (SPA)
app.get('/', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

app.get(/.*/, (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

// --- 7. DÉMARRAGE (Mode Local vs Mode Passenger) ---
if (require.main === module) {
    // Mode Local (node src/app.js)
    app.listen(PORT, () => {
        console.log(`👂 Serveur en écoute sur le port ${PORT}`);
        console.log(`📂 Dossier public : ${publicPath}`);
    });
}

// --- LA CORRECTION CRITIQUE POUR CPANEL/PASSENGER ---
// Passenger a besoin d'importer l'application directement.
module.exports = app;