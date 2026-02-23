// src/services/socket.js
import { io } from 'socket.io-client';

// On récupère l'URL de l'API et on retire le suffixe "/api" pour avoir la racine du serveur
const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

const socket = io(SOCKET_URL, {
    // Très important pour cPanel Namecheap
    path: '/api/socket.io', 
    transports: ['polling', 'websocket'],
    secure: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
});

// Log pour t'aider à débugger en console
socket.on('connect', () => {
    console.log('✅ Connecté au serveur Socket.io');
});

socket.on('connect_error', (err) => {
    console.error('❌ Erreur de connexion Socket:', err.message);
});

export default socket;