// src/controllers/auth.controller.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); 
const ClientModel = require('../models/client.model');
const RiderModel = require('../models/rider.model');

// ✅ Clé secrète récupérée depuis le .env (indispensable en production)
const JWT_SECRET = process.env.JWT_SECRET || 'wink_secret_dev_key';

/**
 * 1. CONNEXION CLIENT (Shadow Login)
 */
exports.loginClient = async (req, res) => {
    const { phone } = req.body;

    if (!phone) {
        return res.status(400).json({ success: false, error: "Numéro de téléphone requis" });
    }

    try {
        let user = await ClientModel.findByPhone(phone);
        let isNewUser = false;

        if (!user) {
            const newId = await ClientModel.create({ 
                phone, 
                first_name: 'Nouveau', 
                last_name: 'Client' 
            });
            
            user = { id: newId, phone, first_name: 'Nouveau', role: 'CLIENT' };
            isNewUser = true; 
        }

        const token = jwt.sign(
            { id: user.id, role: 'CLIENT', phone: user.phone }, 
            JWT_SECRET, 
            { expiresIn: '30d' }
        );

        res.json({ 
            success: true, 
            token, 
            user, 
            isNewUser 
        });

    } catch (err) {
        console.error("Login Client Error:", err);
        res.status(500).json({ success: false, error: "Erreur serveur lors de la connexion" });
    }
};

/**
 * 2. INSCRIPTION LIVREUR (Avec Connexion Automatique)
 */
exports.registerRider = async (req, res) => {
    try {
        // ✅ Récupération des données selon le format du formulaire React
        const { phone, firstName, lastName, password, city, vehicleInfo, licensePlate } = req.body;

        if (!phone || !password) {
            return res.status(400).json({ success: false, message: "Téléphone et Code PIN requis." });
        }

        // 1. Vérification d'existence
        const existingRider = await RiderModel.findByPhone(phone);
        if (existingRider) {
            return res.status(400).json({ success: false, message: "Ce numéro est déjà inscrit." });
        }

        // 2. Hachage du PIN (4 chiffres)
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Création via le modèle (on transmet city pour éviter le crash toUpperCase)
        const riderId = await RiderModel.enroll({
            phone,
            firstName,
            lastName,
            city: city || 'Yaoundé', 
            password: hashedPassword,
            vehicle_info: vehicleInfo || null,
            license_plate: licensePlate || null
        });

        // 4. ✅ GÉNÉRATION DU TOKEN POUR CONNEXION IMMÉDIATE
        const token = jwt.sign(
            { id: riderId, role: 'RIDER', phone }, 
            JWT_SECRET, 
            { expiresIn: '30d' }
        );

        res.json({ 
            success: true, 
            token, 
            rider: { id: riderId, firstName, phone, role: 'RIDER' } 
        });

    } catch (err) {
        console.error("Register Error:", err);
        res.status(500).json({ success: false, message: "Erreur lors de l'inscription" });
    }
};

/**
 * 3. CONNEXION LIVREUR
 */
exports.loginRider = async (req, res) => {
    const { phone, password } = req.body; // 'password' ici correspond au PIN envoyé par l'API

    if (!phone || !password) {
        return res.status(400).json({ success: false, message: "Téléphone et PIN requis" });
    }

    try {
        const rider = await RiderModel.findByPhone(phone);
        
        if (!rider) {
            return res.status(404).json({ success: false, message: "Compte livreur introuvable" });
        }

        // Vérification sécurisée avec Bcrypt
        const isMatch = await bcrypt.compare(password, rider.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Code PIN incorrect" });
        }

        // Génération du badge d'accès (Token)
        const token = jwt.sign(
            { id: rider.id, role: 'RIDER', phone: rider.phone }, 
            JWT_SECRET, 
            { expiresIn: '30d' }
        );

        res.json({ 
            success: true, 
            token, 
            rider: {
                id: rider.id,
                firstName: rider.first_name,
                lastName: rider.last_name,
                phone: rider.phone,
                role: 'RIDER'
            } 
        });

    } catch (err) {
        console.error("Login Rider Error:", err);
        res.status(500).json({ success: false, message: "Erreur serveur connexion" });
    }
};

/**
 * 4. CONNEXION ADMIN
 */
exports.loginAdmin = async (req, res) => {
    const { username, password } = req.body;
    const adminUser = process.env.ADMIN_USERNAME || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD || 'wink2026';

    try {
        if (username === adminUser && password === adminPass) {
            const token = jwt.sign(
                { id: 'admin_root', role: 'ADMIN', username: adminUser }, 
                JWT_SECRET, 
                { expiresIn: '24h' }
            );

            return res.json({ 
                success: true, 
                token, 
                user: { username: adminUser, role: 'ADMIN' } 
            });
        } else {
            return res.status(401).json({ success: false, message: "Identifiants admin incorrects" });
        }
    } catch (err) {
        console.error("Admin Login Error:", err);
        res.status(500).json({ success: false, message: "Erreur serveur connexion admin" });
    }
};