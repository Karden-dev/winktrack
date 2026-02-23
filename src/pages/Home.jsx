import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Box, ShieldCheck, MapPin, Phone } from 'lucide-react';
import WinkButton from '../components/WinkButton';
import WinkInput from '../components/WinkInput';
import { useOrder } from '../context/OrderContext';
import api from '../services/api';

export default function Home() {
    const navigate = useNavigate();
    const { updateOrder } = useOrder(); 
    const [phone, setPhone] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Vérification de session au chargement
    useEffect(() => {
        const token = localStorage.getItem('wink_token');
        if (token) {
            // Si déjà connecté, on redirige vers le dashboard par défaut
            navigate('/dashboard'); 
        }
    }, [navigate]);

    const handleStart = async () => {
        // Nettoyage basique du numéro (enlève les espaces)
        const cleanPhone = phone.replace(/\s+/g, '');

        if (cleanPhone.length < 9) {
            alert("Veuillez entrer un numéro valide (9 chiffres min)");
            return;
        }
        
        setIsLoading(true);
        
        try {
            // 1. Appel au backend
            const response = await api.auth.loginClient(cleanPhone);
            
            if (response.data.success) {
                const { token, user, isNewUser } = response.data;

                // 2. STOCKAGE DES DONNÉES
                localStorage.setItem('wink_token', token); 
                localStorage.setItem('wink_phone', user.phone); // Important pour les autres appels
                localStorage.setItem('user', JSON.stringify(user)); 
                
                // 3. MISE À JOUR DU CONTEXTE
                updateOrder({ senderPhone: cleanPhone });

                console.log(`Connexion réussie. Nouveau ? ${isNewUser}`);

                // 4. LOGIQUE DE REDIRECTION INTELLIGENTE
                if (isNewUser) {
                    // C'est un nouveau -> Il veut commander -> MAP
                    navigate('/map');
                } else {
                    // C'est un habitué -> Il veut voir ses stats -> DASHBOARD
                    navigate('/dashboard');
                }
            }
        } catch (error) {
            console.error("Erreur Login:", error);
            const errorMsg = error.response?.data?.error || "Erreur de connexion au serveur";
            alert(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-wink-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
            
            {/* --- Éléments de design --- */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-wink-yellow rounded-full blur-[100px] opacity-20 animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-wink-green rounded-full blur-[100px] opacity-20"></div>

            {/* --- Logo et Titre --- */}
            <div className="text-center mb-12 relative z-10">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl mb-6 border border-white/10 shadow-xl">
                    <Box size={40} className="text-wink-yellow" strokeWidth={2} />
                </div>
                <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
                    WINK <span className="text-wink-yellow">EXPRESS</span>
                </h1>
                <p className="text-gray-400 text-lg">La livraison simplifiée.</p>
            </div>

            {/* --- Formulaire de connexion --- */}
            <div className="w-full max-w-sm bg-white/10 backdrop-blur-lg p-8 rounded-3xl border border-white/10 shadow-2xl relative z-10">
                <div className="space-y-6">
                    {/* Note: Assure-toi que WinkInput gère bien les props passées ici */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
                            Votre numéro WhatsApp
                        </label>
                        <div className="relative group">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-wink-yellow transition-colors" size={20} />
                            <input 
                                type="tel"
                                placeholder="699 00 00 00"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full h-14 pl-12 pr-4 bg-black/20 text-white rounded-2xl border border-white/10 focus:border-wink-yellow focus:ring-1 focus:ring-wink-yellow outline-none transition-all placeholder-gray-600 font-medium"
                            />
                        </div>
                    </div>

                    <WinkButton 
                        variant="primary" 
                        onClick={handleStart} 
                        isLoading={isLoading}
                        className="w-full py-4 text-lg"
                    >
                        Commencer <ArrowRight size={20} className="ml-2" />
                    </WinkButton>
                </div>
            </div>

            {/* --- Badges de confiance --- */}
            <div className="mt-12 flex gap-6 text-gray-500 text-xs font-medium relative z-10">
                <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-wink-green" /> Sécurisé
                </div>
                <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-wink-yellow" /> Suivi GPS
                </div>
            </div>
        </div>
    );
}