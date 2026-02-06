import axios from 'axios';

// Configuration de base d'Axios
const api = axios.create({
    baseURL: '/api/client', // Le proxy Vite redirige vers localhost:3000/api/client
    headers: {
        'Content-Type': 'application/json',
    },
});

export default {
    // --- COMMANDES ---
    
    // 1. Créer une commande
    createOrder: async (orderData) => {
        const response = await api.post('/order/create', orderData);
        return response.data;
    },

    // 2. Vérifier le statut (Polling)
    checkStatus: async (orderId) => {
        const response = await api.get(`/order/${orderId}/status`);
        return response.data;
    },

    // --- PAIEMENT (Futur) ---
    initiatePayment: async (phone, amount, orderId) => {
        // Note: L'URL est différente (/api/payment), on utilise axios direct ici
        const response = await axios.post('/api/payment/initiate', {
            phone,
            amount,
            externalId: orderId
        });
        return response.data;
    },

    // --- DASHBOARD & PROFIL (Nouveau) ---

    // 3. Récupérer le Profil (Nom, Solde, Paiement par défaut)
    getProfile: async (phone) => {
        const response = await api.get(`/profile/${phone}`);
        return response.data;
    },

    // 4. Mettre à jour le Profil
    updateProfile: async (phone, data) => {
        // data = { firstName, lastName, paymentNumber }
        const response = await api.put(`/profile/${phone}`, data);
        return response.data;
    },

    // 5. Récupérer l'Historique
    getHistory: async (phone) => {
        const response = await api.get(`/history/${phone}`);
        return response.data; // { success: true, history: [...] }
    }
};