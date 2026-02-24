import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, LayoutDashboard, MapPin, Package } from 'lucide-react';
import WinkButton from '../components/WinkButton';

export default function SuccessPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-wink-black flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
            
            {/* --- Éléments de fond (Design) --- */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-wink-green rounded-full blur-[100px] opacity-20 animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-wink-yellow rounded-full blur-[100px] opacity-10"></div>

            {/* --- Animation Succès --- */}
            <div className="mb-8 relative z-10">
                <div className="absolute inset-0 bg-green-500/30 rounded-full blur-xl animate-ping"></div>
                <div className="relative bg-white rounded-full p-2">
                    <CheckCircle size={80} className="text-wink-green fill-white" />
                </div>
            </div>

            <h1 className="text-3xl font-black text-white mb-4 tracking-tight z-10">
                Paiement Reçu !
            </h1>
            <p className="text-gray-400 mb-10 max-w-xs mx-auto leading-relaxed z-10">
                Votre commande a été transmise instantanément aux livreurs à proximité.
            </p>

            {/* --- Carte "Prochaines étapes" --- */}
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl w-full max-w-sm mb-10 border border-white/10 text-left z-10">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                    <Package size={18} className="text-wink-yellow" /> Prochaines étapes
                </h3>
                <ul className="space-y-4">
                    <li className="flex gap-4 items-start">
                        <div className="w-6 h-6 rounded-full bg-wink-yellow text-wink-black flex items-center justify-center font-bold text-xs mt-0.5">1</div>
                        <p className="text-sm text-gray-300">
                            Un livreur accepte votre course (généralement sous 2 min).
                        </p>
                    </li>
                    <li className="flex gap-4 items-start">
                        <div className="w-6 h-6 rounded-full bg-gray-700 text-white flex items-center justify-center font-bold text-xs mt-0.5">2</div>
                        <p className="text-sm text-gray-300">
                            Vous suivez son trajet en temps réel sur votre tableau de bord.
                        </p>
                    </li>
                </ul>
            </div>

            {/* --- Actions --- */}
            <div className="w-full max-w-sm space-y-4 z-10">
                {/* ACTION PRINCIPALE : DASHBOARD */}
                <WinkButton 
                    variant="primary" 
                    onClick={() => navigate('/dashboard')}
                >
                    <LayoutDashboard size={20} className="mr-2" /> Suivre ma commande
                </WinkButton>

                {/* ACTION SECONDAIRE : NOUVELLE COURSE */}
                <button 
                    onClick={() => navigate('/map')}
                    className="w-full py-4 rounded-xl text-gray-400 font-bold text-sm hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                >
                    <MapPin size={18} /> Faire une autre course
                </button>
            </div>
        </div>
    );
}