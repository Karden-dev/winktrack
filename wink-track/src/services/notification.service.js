// src/services/notification.service.js

class NotificationService {
    
    constructor() {
        console.log("📡 Service de Notification initialisé.");
    }

    /**
     * Envoie le lien magique au destinataire
     * @param {string} phone - Numéro du destinataire
     * @param {string} link - Le lien unique (http://...)
     * @param {string} senderName - Prénom de l'expéditeur
     */
    async sendMagicLink(phone, link, senderName) {
        // Nettoyage du numéro (ex: enlever les espaces)
        const cleanPhone = phone.replace(/\s+/g, '');
        
        const message = `📦 Colis WINK: ${senderName} veut vous envoyer un paquet. Confirmez votre position ici pour la livraison : ${link}`;

        // --- SIMULATION DANS LA CONSOLE (DEV) ---
        console.log("---------------------------------------------------");
        console.log(`📨 [SMS SIMULÉ] À: ${cleanPhone}`);
        console.log(`📝 Message: "${message}"`);
        console.log("---------------------------------------------------");

        // TODO: Ici, intégrer l'appel réel à Twilio / MboaSMS / InfoBip
        // await axios.post('API_SMS_PROVIDER', { to: cleanPhone, text: message });

        return true;
    }

    /**
     * Envoie un code OTP (Ramassage ou Livraison)
     * @param {string} phone 
     * @param {string} otp 
     * @param {string} type - 'PICKUP' ou 'DELIVERY'
     */
    async sendOTP(phone, otp, type) {
        const cleanPhone = phone.replace(/\s+/g, '');
        const action = type === 'PICKUP' ? 'donner au livreur au ramassage' : 'donner au livreur à la réception';
        const message = `🔑 Code WINK: ${otp}. À ${action}.`;

        console.log(`🔐 [OTP ${type}] À: ${cleanPhone} | Code: ${otp}`);
        
        return true;
    }
}

module.exports = new NotificationService();