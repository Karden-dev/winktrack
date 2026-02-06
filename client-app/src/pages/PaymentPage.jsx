import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle, MapPin, ArrowRight, ShieldCheck, Lock, CreditCard, 
  Smartphone, AlertCircle, X 
} from 'lucide-react';
import WinkButton from '../components/WinkButton';
import WinkInput from '../components/WinkInput';
import { useOrder } from '../context/OrderContext';
import api from '../services/api';

export default function PaymentPage() {
    const navigate = useNavigate();
    const { order } = useOrder();
    
    // États pour le Modal
    const [showModal, setShowModal] = useState(false);
    const [payPhone, setPayPhone] = useState(order.senderPhone || '');
    const [isPaying, setIsPaying] = useState(false);

    // Calculs pour le ticket de caisse
    const baseFare = 500;
    const distanceCost = (order.price || 0) - baseFare;

    const handleInitiatePayment = async () => {
        if (payPhone.length < 9) return alert("Numéro invalide");
        
        setIsPaying(true);
        try {
            // Appel API de paiement (à implémenter côté backend payment.routes)
            // Pour l'instant on simule le succès
            // await api.initiatePayment(payPhone, order.price, order.orderId);
            
            setTimeout(() => {
                setIsPaying(false);
                setShowModal(false);
                navigate('/success'); // Vers la page de succès
            }, 2000);
        } catch (error) {
            console.error(error);
            setIsPaying(false);
            alert("Erreur lors de l'initiation du paiement.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col relative pb-24">
            
            {/* --- HEADER --- */}
            <div className="bg-wink-black text-white p-6 pb-16 rounded-b-[40px] shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
                <h1 className="text-2xl font-black mb-1">Facture</h1>
                <p className="text-gray-400 text-sm">Course ID: #{order.orderId || '----'}</p>
            </div>

            {/* --- TICKET DE CAISSE (Card Flottante) --- */}
            <div className="px-6 -mt-10 relative z-10">
                <div className="bg-white rounded-2xl shadow-float p-6 border border-gray-100">
                    {/* Trajet */}
                    <div className="flex flex-col gap-4 mb-6 pb-6 border-b border-dashed border-gray-200">
                        <div className="flex gap-3">
                            <div className="flex flex-col items-center mt-1">
                                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                                <div className="w-0.5 h-full bg-gray-200 my-1"></div>
                                <div className="w-2 h-2 bg-wink-black rounded-full"></div>
                            </div>
                            <div className="flex-1 space-y-4 text-sm">
                                <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase">Départ</p>
                                    <p className="font-medium text-gray-800">Ma position actuelle</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase">Arrivée ({order.distance?.toFixed(1)} km)</p>
                                    <p className="font-medium text-gray-800">Chez {order.recipientName || order.recipientPhone}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Détails Prix */}
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between text-gray-500">
                            <span>Prise en charge</span>
                            <span>{baseFare} FCFA</span>
                        </div>
                        <div className="flex justify-between text-gray-500">
                            <span>Distance ({order.distance?.toFixed(1)} km)</span>
                            <span>{distanceCost > 0 ? distanceCost : 0} FCFA</span>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t border-gray-100 mt-3">
                            <span className="font-bold text-gray-900">TOTAL À PAYER</span>
                            <span className="text-2xl font-black text-wink-black">{order.price} <span className="text-sm font-normal text-gray-400">FCFA</span></span>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- BADGES DE CONFIANCE (Trust Badges) --- */}
            <div className="px-8 py-6 grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-xs text-gray-500 font-medium bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                    <ShieldCheck size={16} className="text-green-500" />
                    <span>Livreur Vérifié</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 font-medium bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                    <Lock size={16} className="text-blue-500" />
                    <span>Paiement Sécurisé</span>
                </div>
            </div>

            {/* --- FOOTER FIXE --- */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-100 pb-8 z-20">
                <WinkButton variant="action" onClick={() => setShowModal(true)}>
                    Régler ma course <ArrowRight size={20} />
                </WinkButton>
            </div>

            {/* --- MODAL DE PAIEMENT (POP-UP) --- */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                    {/* Backdrop Flou */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
                    
                    {/* Contenu Modal */}
                    <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-6 relative z-10 animate-fade-in-up">
                        <button 
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-800"
                        >
                            <X size={24} />
                        </button>

                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-16 h-16 bg-wink-yellow/20 text-wink-black rounded-full flex items-center justify-center mb-4">
                                <Smartphone size={32} />
                            </div>
                            <h2 className="text-xl font-bold">Confirmation Mobile Money</h2>
                            <p className="text-sm text-gray-500 px-4 mt-2">
                                Une demande de débit de <strong>{order.price} FCFA</strong> sera envoyée à ce numéro.
                            </p>
                        </div>

                        {/* Logos Opérateurs */}
                        <div className="flex justify-center gap-4 mb-6 opacity-80">
                            {/* Placeholder pour les logos MTN/Orange */}
                            <div className="h-8 px-2 bg-yellow-400 rounded text-[10px] font-bold flex items-center text-black">MTN MoMo</div>
                            <div className="h-8 px-2 bg-orange-500 rounded text-[10px] font-bold flex items-center text-white">Orange Money</div>
                        </div>

                        {/* Input Téléphone */}
                        <div className="mb-6">
                            <WinkInput 
                                label="Numéro à débiter"
                                value={payPhone}
                                onChange={(e) => setPayPhone(e.target.value)}
                                icon={CreditCard}
                                placeholder="699 00 00 00"
                                type="tel"
                            />
                        </div>

                        {/* Instructions */}
                        <div className="bg-blue-50 p-3 rounded-lg flex gap-3 text-left mb-6">
                            <AlertCircle className="text-blue-600 shrink-0" size={20} />
                            <p className="text-xs text-blue-800">
                                Gardez votre téléphone à portée de main. Tapez votre code secret (PIN) dès que la fenêtre s'affiche.
                            </p>
                        </div>

                        <WinkButton 
                            variant="primary" 
                            onClick={handleInitiatePayment}
                            isLoading={isPaying}
                        >
                            Confirmer & Payer
                        </WinkButton>
                    </div>
                </div>
            )}
        </div>
    );
}