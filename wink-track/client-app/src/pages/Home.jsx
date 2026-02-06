import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Box, ShieldCheck, MapPin } from 'lucide-react';
import WinkButton from '../components/WinkButton';
import WinkInput from '../components/WinkInput';
import { useOrder } from '../context/OrderContext';
import api from '../services/api'; // Import API indispensable

export default function Home() {
    const navigate = useNavigate();
    const { updateOrder } = useOrder();
    const [phone, setPhone] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Si l'utilisateur est déjà connecté (numéro en mémoire), on le redirige direct
    useEffect(() => {
        const storedPhone = localStorage.getItem('wink_phone');
        if (storedPhone) {
            // Optionnel : On pourrait vérifier la validité du token ici
            navigate('/dashboard');
        }
    }, [navigate]);

    const handleStart = async () => {
        if (phone.length < 9) return alert("Numéro invalide");
        
        setIsLoading(true);
        
        // 1. On sauvegarde le numéro dans la session du navigateur
        localStorage.setItem('wink_phone', phone);
        updateOrder('senderPhone', phone);

        try {
            // 2. On vérifie si ce numéro existe déjà en base
            await api.getProfile(phone);
            
            // SUCCÈS : Le profil existe -> Direction Dashboard
            navigate('/dashboard');

        } catch (error) {
            // ERREUR (404) : Le profil n'existe pas -> Direction Carte (Nouvelle commande)
            // C'est ici que le "Shadow Account" sera créé plus tard
            navigate('/map');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-wink-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
            
            {/* Décoration de fond */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-wink-yellow rounded-full blur-[100px] opacity-20 animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-wink-green rounded-full blur-[100px] opacity-20"></div>

            {/* Logo / Header */}
            <div className="text-center mb-12 relative z-10">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl mb-6 border border-white/10 shadow-xl">
                    <Box size={40} className="text-wink-yellow" strokeWidth={2} />
                </div>
                <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
                    WINK <span className="text-wink-yellow">TRACK</span>
                </h1>
                <p className="text-gray-400 text-lg">La livraison simplifiée.</p>
            </div>

            {/* Carte Formulaire */}
            <div className="w-full max-w-sm bg-white/10 backdrop-blur-lg p-8 rounded-3xl border border-white/10 shadow-2xl relative z-10">
                <div className="space-y-6">
                    <WinkInput 
                        label="Votre numéro WhatsApp"
                        placeholder="699 00 00 00"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        type="tel"
                        className="bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-wink-yellow"
                    />

                    <WinkButton 
                        variant="primary" 
                        onClick={handleStart} 
                        isLoading={isLoading}
                    >
                        Commencer <ArrowRight size={20} />
                    </WinkButton>
                </div>
            </div>

            {/* Footer Trust */}
            <div className="mt-12 flex gap-6 text-gray-500 text-xs font-medium">
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