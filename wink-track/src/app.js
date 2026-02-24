require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
const http = require('http');

// ============================================================
// 1. IMPORTS DES ROUTES
// ============================================================
const authRoutes = require('./routes/auth.routes');
const orderRoutes = require('./routes/order.routes');
const riderRoutes = require('./routes/rider.routes');
const clientRoutes = require('./routes/client.routes');
const googleRoutes = require('./routes/google.routes');

const clientModel = require('./models/client.model');
const riderModel = require('./models/rider.model');
const orderModel = require('./models/order.model');
const socketService = require('./socket');

const app = express();
const port = process.env.PORT || 3000;

// ✅ CONFIGURATION CORS
const allowedOrigins = [
    'http://localhost:5173',
    'https://liv.winkexpress.online',
    'http://liv.winkexpress.online'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) return callback(new Error('CORS Error'), false);
        return callback(null, true);
    },
    credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ============================================================
// 🛠️ GESTION DES FICHIERS STATIQUES (FRONTEND REACT)
// ============================================================

// 1. Dossier des uploads (dans backend/uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 2. Dossier des assets React (JS/CSS) qui sont à la racine du dossier public_html/wink_liv
// Puisque app.js est dans 'src', on remonte d'un niveau avec '../'
app.use('/assets', express.static(path.join(__dirname, '../assets')));
app.use(express.static(path.join(__dirname, '../')));

// ============================================================
// 📡 ROUTES API
// ============================================================

// Route de santé
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Wink API is running' });
});

// Montage des routes
// Note : Si ton app cPanel est sur "/" et que tes appels frontend sont vers "/api/..."
// On ajoute le préfixe /api ici pour plus de clarté
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/riders', riderRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/google', googleRoutes);

// ============================================================
// 🏠 GESTION DU "CATCH-ALL" POUR REACT (SPA)
// ============================================================

// IMPORTANT : Cette route doit être la DERNIÈRE, après toutes les autres.
// Elle renvoie index.html pour n'importe quelle URL qui n'est pas une API ou un fichier.
app.get('*', (req, res) => {
    // Si c'est un appel à /api qui n'existe pas, on renvoie une 404 au lieu du HTML
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ message: "Route API non trouvée" });
    }
    // Sinon, on sert le fichier index.html de React
    res.sendFile(path.join(__dirname, '../index.html'));
});

// ============================================================
// 5. CONFIGURATION BASE DE DONNÉES
// ============================================================
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: '+01:00'
};

let dbPool;

async function connectToDatabase() {
    try {
        dbPool = mysql.createPool(dbConfig);
        const connection = await dbPool.getConnection();
        console.log('✅ Connexion MySQL réussie.');
        connection.release();
    } catch (error) {
        console.error('❌ Erreur BDD :', error.message);
    }
}

async function startServer() {
    await connectToDatabase();

    if (dbPool) {
        clientModel.init(dbPool);
        riderModel.init(dbPool);
        orderModel.init(dbPool);
    }

    const server = http.createServer(app);
    socketService.initSocket(server);

    server.listen(port, () => {
        console.log(`🚀 SERVEUR WINK V2 PRÊT SUR LE PORT ${port}`);
    });
}

startServer();