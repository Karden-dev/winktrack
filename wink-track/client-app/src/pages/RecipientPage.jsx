import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Share2, Loader2, AlertCircle } from 'lucide-react';
import WinkButton from '../components/WinkButton';
import WinkInput from '../components/WinkInput';
import { useOrder } from '../context/OrderContext';
import api from '../services/api'; // Import du service

export default function RecipientPage() {
    const navigate = useNavigate();
    const { order, updateOrder } = useOrder();

    const [rPhone, setRPhone] = useState('');
    const [rName, setRName] = useState('');
    const [status, setStatus] = useState('FORM'); // 'FORM', 'LOADING', 'WAITING'
    const [error, setError] = useState(null);
    
    // Référence pour stocker l'ID de la commande sans re-render
    const orderIdRef = useRef(null);

    // --- LOGIQUE DE POLLING (Le Radar) ---
    useEffect(() => {
        let interval;
        
        if (status === 'WAITING' && orderIdRef.current) {
            console.log("📡 Recherche de validation...");
            
            interval = setInterval(async () => {
                try {
                    const data = await api.checkStatus(orderIdRef.current);
                    
                    // Si le statut a changé (READY_TO_PAY), le destinataire a validé !
                    if (data.status === 'READY_TO_PAY') {
                        clearInterval(interval);
                        
                        // On met à jour le contexte avec le prix calculé par le serveur
                        updateOrder('price', data.price);
                        updateOrder('distance', data.distance);
                        updateOrder('orderId', orderIdRef.current);
                        
                        // Direction Paiement !
                        navigate('/pay');
                    }
                } catch (err) {
                    console.error("Erreur polling", err);
                }
            }, 3000); // Vérifie toutes les 3 secondes
        }
        
        return () => clearInterval(interval);
    }, [status, navigate, updateOrder]);

    // --- ENVOI DE LA COMMANDE ---
    const handleSendLink = async () => {
        if (rPhone.length < 9) return alert("Numéro invalide.");
        
        setStatus('LOADING');
        setError(null);

        try {
            // Préparation des données
            const payload = {
                senderPhone: order.senderPhone,
                pickupLoc: order.pickupLocation,
                packageDesc: order.packageDescription,
                recipientPhone: rPhone,
                recipientName: rName
            };

            // Appel API Réel
            const response = await api.createOrder(payload);

            if (response.success) {
                // Succès : On passe en mode attente
                orderIdRef.current = response.orderId;
                updateOrder('recipientPhone', rPhone);
                setStatus('WAITING');
                
                // (Optionnel pour démo) Afficher le lien dans la console
                console.log("🔗 Lien de debug:", `http://localhost:3000/confirm.html?t=${response.debugToken}`);
            }

        } catch (err) {
            console.error(err);
            setError("Erreur de connexion au serveur.");
            setStatus('FORM');
        }
    };

    // --- RENDU : FORMULAIRE ---
    if (status === 'FORM' || status === 'LOADING') {
        return (
            <div className="min-h-screen p-6 flex flex-col pt-10 relative">
                <button onClick={() => navigate('/map')} className="text-sm text-gray-400 mb-6 hover:text-wink-black">← Retour</button>
                
                <h1 className="text-2xl font-black mb-2">Pour qui ?</h1>
                <p className="text-gray-500 mb-8">Nous enverrons un lien à ce numéro pour qu'il confirme sa position.</p>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-4 flex items-center gap-2 text-sm font-bold">
                        <AlertCircle size={20}/> {error}
                    </div>
                )}

                <div className="space-y-6">
                    <WinkInput 
                        label="Numéro WhatsApp"
                        icon={Phone}
                        placeholder="699 00 00 00"
                        value={rPhone}
                        onChange={(e) => setRPhone(e.target.value)}
                        type="tel"
                    />
                    
                    <WinkInput 
                        label="Nom (Optionnel)"
                        icon={User}
                        placeholder="ex: M. Kamga"
                        value={rName}
                        onChange={(e) => setRName(e.target.value)}
                    />

                    <div className="h-4"></div>

                    <WinkButton 
                        variant="action" 
                        onClick={handleSendLink} 
                        isLoading={status === 'LOADING'}
                    >
                        Envoyer le lien <Share2 size={18} />
                    </WinkButton>
                </div>
            </div>
        );
    }

    // --- RENDU : EN ATTENTE ---
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-wink-black text-white">
            <div className="relative">
                <div className="absolute inset-0 bg-wink-yellow blur-xl opacity-20 animate-pulse"></div>
                <Loader2 size={64} className="text-wink-yellow animate-spin relative z-10" />
            </div>

            <h2 className="text-xl font-bold mt-8 mb-2">En attente du destinataire...</h2>
            <p className="text-gray-400 text-sm max-w-xs mx-auto mb-8">
                Un lien a été envoyé au <strong>{rPhone}</strong>.
            </p>
            
            <div className="bg-white/10 p-5 rounded-xl border border-white/10 w-full max-w-sm">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-ping"></div>
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Status en direct</span>
                </div>
                <p className="text-sm">
                    Dès qu'il clique sur "Valider ma position", cet écran se mettra à jour automatiquement avec le prix.
                </p>
            </div>

            <button 
                onClick={() => setStatus('FORM')} 
                className="mt-12 text-xs text-gray-500 underline hover:text-white transition-colors"
            >
                Annuler
            </button>
        </div>
    );
}