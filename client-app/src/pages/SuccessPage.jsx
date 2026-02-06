import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Home, Package } from 'lucide-react';
import WinkButton from '../components/WinkButton';

export default function SuccessPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
            
            {/* Animation Succès */}
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-green-200">
                    <Check size={40} strokeWidth={4} />
                </div>
            </div>

            <h1 className="text-3xl font-black text-gray-900 mb-2">Paiement Reçu !</h1>
            <p className="text-gray-500 mb-8 max-w-xs mx-auto">
                Votre commande est confirmée. Un livreur Wink Express a été notifié et arrive vers le point de retrait.
            </p>

            <div className="bg-gray-50 p-6 rounded-2xl w-full max-w-sm mb-8 border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center justify-center gap-2">
                    <Package size={20} className="text-wink-yellow" /> Prochaines étapes
                </h3>
                <ul className="text-sm text-left space-y-4 text-gray-600">
                    <li className="flex gap-3">
                        <span className="font-bold text-gray-300">1</span>
                        Le livreur vous appelle sous peu.
                    </li>
                    <li className="flex gap-3">
                        <span className="font-bold text-gray-300">2</span>
                        Vous recevrez un SMS de suivi.
                    </li>
                    <li className="flex gap-3">
                        <span className="font-bold text-gray-300">3</span>
                        Livraison effectuée en toute sécurité.
                    </li>
                </ul>
            </div>

            <WinkButton variant="action" onClick={() => navigate('/')}>
                <Home size={20} /> Retour à l'accueil
            </WinkButton>

        </div>
    );
}