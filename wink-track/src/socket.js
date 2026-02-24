// src/socket.js
const socketIo = require('socket.io');

let io;

module.exports = {
    initSocket: (server) => {
        io = socketIo(server, {
            // ✅ CRITIQUE : Définit le chemin pour correspondre à ton URL /api
            path: '/api/socket.io', 
            cors: {
                // ✅ Sécurité : Remplace par ton domaine exact
                origin: ["https://liv.winkexpress.online", "http://localhost:5173"], 
                methods: ["GET", "POST"],
                credentials: true
            },
            // ✅ Recommandé pour Namecheap : Polling en premier pour passer les pare-feu
            transports: ['polling', 'websocket']
        });

        io.on('connection', (socket) => {
            console.log('🔌 Nouveau socket connecté:', socket.id);

            // --- A. GESTION DES SALLES (ROOMS) ---
            socket.on('join_order', (orderId) => {
                socket.join(`order_${orderId}`);
                console.log(`Socket ${socket.id} suit la commande #${orderId}`);
            });

            socket.on('join_radar', () => {
                socket.join('riders_radar');
                console.log(`🏍️ Livreur ${socket.id} est sur le Radar`);
            });

            // --- B. RELAIS D'INFORMATIONS EN TEMPS RÉEL ---
            socket.on('rider_location', (data) => {
                if (data.orderId) {
                    io.to(`order_${data.orderId}`).emit('rider_moved', {
                        lat: data.lat,
                        lng: data.lng
                    });
                }
            });

            socket.on('disconnect', () => {
                // console.log('Client déconnecté');
            });
        });
    },

    // --- C. MÉTHODES APPELÉES DEPUIS LES CONTROLLERS ---
    notifyOrderUpdate: (orderId, data) => {
        if (io) {
            io.to(`order_${orderId}`).emit('order_updated', data);
            console.log(`🔔 Update envoyé room order_${orderId}:`, data.status);
        }
    },

    notifyNewAvailableOrder: (orderData) => {
        if (io) {
            io.to('riders_radar').emit('new_order_available', orderData);
            console.log(`📡 Nouvelle commande diffusée au Radar`);
        }
    },

    notifyRidersOrderTaken: (orderId) => {
        if (io) {
            io.to('riders_radar').emit('order_taken', { id: orderId });
        }
    }
};