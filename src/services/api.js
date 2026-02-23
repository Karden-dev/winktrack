import axios from 'axios';

// baseURL sera récupéré depuis les variables d'environnement de Vite
const API_URL = import.meta.env.VITE_API_URL || 'https://liv.winkexpress.online/api';

const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
});

// ✅ INTERCEPTEUR : Ajoute automatiquement le token JWT à chaque requête
api.interceptors.request.use((config) => {
    // On utilise 'wink_token' comme nom unique pour tous les utilisateurs (Livreur/Client/Admin)
    const token = localStorage.getItem('wink_token'); 
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default {
    // ============================================================
    // 1. AUTHENTIFICATION
    // ============================================================
    auth: {
        loginClient: (phone) => api.post('/auth/loginClient', { phone }),
        loginRider: (phone, password) => api.post('/auth/loginRider', { phone, password }),
        registerRider: (data) => api.post('/auth/registerRider', data),
        loginAdmin: (username, password) => api.post('/auth/loginAdmin', { username, password }),
    },

    // ============================================================
    // 2. GESTION CLIENTS
    // ============================================================
    clients: {
        getProfile: (phone) => api.get(`/clients/profile/${phone}`),
        updateProfile: (phone, data) => api.put(`/clients/profile/${phone}`, data),
        getHistory: (phone) => api.get(`/clients/history/${phone}`),
    },

    // ============================================================
    // 3. GESTION COMMANDES (FLUX PRINCIPAL)
    // ============================================================
    orders: {
        // L'expéditeur initie la commande
        initiate: (data) => api.post('/orders/initiate', data),
        
        // Le destinataire résout le lien magique
        resolveToken: (token) => api.get(`/orders/token/${token}`),
        
        // Le destinataire confirme sa position
        confirmDestination: (data) => api.post('/orders/confirm-destination', data),
        
        // L'expéditeur paie et lance la recherche
        finalize: (data) => api.post('/orders/finalize', data),
        
        // Suivre une commande en temps réel
        track: (orderId) => api.get(`/orders/track/${orderId}`),
    },

    // ============================================================
    // 4. GESTION LIVREURS (RIDER)
    // ============================================================
    riders: {
        getDashboard: (phone) => api.get('/riders/dashboard', { params: { phone } }),
        updateLocation: (data) => api.post('/riders/location', data),
        toggleStatus: (data) => api.post('/riders/toggle-status', data),
        
        getAvailableOrders: (lat, lng) => api.get('/riders/available', { params: { lat, lng } }),
        acceptOrder: (orderId, riderId) => api.post(`/riders/accept/${orderId}`, { riderId }),
        updateOrderStatus: (orderId, data) => api.put(`/riders/order-status/${orderId}`, data),
        
        getWallet: (riderId) => api.get(`/riders/wallet/${riderId}`),
        
        uploadDoc: (formData) => api.post('/riders/documents', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }),
    },

    // ============================================================
    // 5. SERVICES GOOGLE MAPS
    // ============================================================
    google: {
        autocomplete: (input) => api.get('/google/autocomplete', { params: { input } }),
        getDetails: (placeId) => api.get('/google/details', { params: { placeId } }),
        reverseGeocode: (lat, lng) => api.get('/google/reverse', { params: { lat, lng } }),
    },

    // ============================================================
    // 6. ADMINISTRATION
    // ============================================================
    admin: {
        getStats: () => api.get('/admin/stats'),
        getAllOrders: () => api.get('/admin/orders'),
        getActiveOrders: () => api.get('/admin/orders/active'),
        getAllRiders: () => api.get('/admin/riders'),
        getAllClients: () => api.get('/admin/clients'),
        updateSettings: (data) => api.put('/admin/settings', data),
    }
};