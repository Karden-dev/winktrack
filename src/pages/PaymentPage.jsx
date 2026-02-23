import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    CheckCircle, MapPin, ArrowRight, ShieldCheck, Lock, CreditCard, 
    Smartphone, AlertCircle, X, Loader2, Navigation 
} from 'lucide-react';
import WinkButton from '../components/WinkButton';
import WinkInput from '../components/WinkInput';
import { useOrder } from '../context/OrderContext';
import api from '../services/api';

export default function PaymentPage() {
    const navigate = useNavigate();
    const { order } = useOrder();
    
    // États pour le Modal et le Paiement
    const [showModal, setShowModal] = useState(false);
    const [payPhone, setPayPhone] = useState(order.senderPhone || '');
    const [isPaying, setIsPaying] = useState(false);
    const [paymentError, setPaymentError] = useState(null);

    // Calculs basés sur le PricingService
    const baseFare = 500; 
    const totalPrice = order.totalPrice || 0;
    const distanceCost = Math.max(0, totalPrice - baseFare);

    // --- GÉNÉRATION DE LA CARTE STATIQUE GOOGLE ---
    const getStaticMapUrl = () => {
        if (!order.pickupLocation) return null;
        
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        const lat = order.pickupLocation.lat;
        const lng = order.pickupLocation.lng;
        
        // On centre la carte sur le départ, zoom 15, taille 600x300
        // On ajoute un marqueur noir au point de départ
        return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=600x300&maptype=roadmap&markers=color:black%7Clabel:A%7C${lat},${lng}&key=${apiKey}`;
    };

    const handleInitiatePayment = async () => {
        if (payPhone.length < 9) return alert("Numéro invalide. Veuillez entrer un numéro à 9 chiffres.");
        
        setIsPaying(true);
        setPaymentError(null);

        try {
            const response = await api.orders.confirmPayment(order.orderId, payPhone);

            if (response.data.success) {
                setIsPaying(false);
                setShowModal(false);
                navigate('/success'); 
            } else {
                setPaymentError(response.data.error || "Le paiement a échoué.");
                setIsPaying(false);
            }
        } catch (error) {
            console.error("Erreur Paiement:", error);
            setPaymentError("Erreur de connexion. Vérifiez votre solde ou votre connexion.");
            setIsPaying(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col relative pb-32 font-sans">
            
            {/* --- HEADER AVEC CARTE STATIQUE --- */}
            <div className="bg-white pb-6 shadow-sm relative overflow-hidden">
                {/* Carte en arrière-plan ou Placeholder */}
                <div className="w-full h-48 bg-gray-200 relative">
                    {getStaticMapUrl() ? (
                        <img 
                            src={getStaticMapUrl()} 
                            alt="Carte itinéraire" 
                            className="w-full h-full object-cover opacity-90"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-xs">
                            Carte indisponible
                        </div>
                    )}
                    {/* Overlay dégradé pour lisibilité */}
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
                </div>

                <div className="px-6 -mt-8 relative z-10">
                     <h1 className="text-2xl font-black text-gray-900 mb-1">Résumé course</h1>
                     <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                        <span className="bg-gray-100 px-2 py-1 rounded-md">ID: #{order.orderId?.toString().slice(-6) || '------'}</span>
                        <span>•</span>
                        <span>{order.distance?.toFixed(1)} km au total</span>
                     </div>
                </div>
            </div>

            {/* --- DÉTAILS DU TRAJET --- */}
            <div className="px-6 mt-6">
                <div className="bg-white rounded-[24px] shadow-sm p-6 border border-gray-100">
                    
                    {/* Ligne Départ -> Arrivée */}
                    <div className="relative pl-4 space-y-8 border-l-2 border-dashed border-gray-200 ml-2">
                        {/* Départ */}
                        <div className="relative">
                            <div className="absolute -left-[23px] top-1 w-4 h-4 bg-black rounded-full border-4 border-white shadow-sm"></div>
                            <div>
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1">Départ</p>
                                <p className="text-sm font-bold text-gray-800 leading-tight">
                                    {order.pickupLocation?.address || "Ma position"}
                                </p>
                            </div>
                        </div>

                        {/* Arrivée */}
                        <div className="relative">
                            <div className="absolute -left-[23px] top-1 w-4 h-4 bg-wink-yellow rounded-full border-4 border-white shadow-sm"></div>
                            <div>
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1">Arrivée</p>
                                <p className="text-sm font-bold text-gray-800 leading-tight">
                                    {order.recipientName || order.recipientPhone} (Confirmé)
                                </p>
                            </div>
                        </div>
                    </div>

                </div>

                {/* --- DÉTAILS FINANCIERS --- */}
                <div className="mt-6 bg-white rounded-[24px] shadow-sm p-6 border border-gray-100">
                    <div className="space-y-3">
                        <div className="flex justify-between text-xs font-medium text-gray-500">
                            <span>Prise en charge</span>
                            <span>{baseFare} FCFA</span>
                        </div>
                        <div className="flex justify-between text-xs font-medium text-gray-500">
                            <span>Trajet ({order.distance?.toFixed(1)} km)</span>
                            <span>{Math.round(distanceCost)} FCFA</span>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-4">
                            <span className="font-black text-gray-900 text-sm">TOTAL À PAYER</span>
                            <span className="text-3xl font-black text-wink-black">
                                {totalPrice} <span className="text-xs text-gray-400 font-normal">FCFA</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- FOOTER FIXE --- */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/90 backdrop-blur-lg border-t border-gray-100 z-20">
                <WinkButton variant="primary" onClick={() => setShowModal(true)}>
                    Payer maintenant <ArrowRight size={20} className="ml-2" />
                </WinkButton>
            </div>

            {/* --- MODAL DE PAIEMENT --- */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="absolute inset-0 bg-wink-black/80 backdrop-blur-md animate-in fade-in" onClick={() => setShowModal(false)}></div>
                    
                    <div className="bg-white w-full max-w-md rounded-t-[40px] sm:rounded-[32px] p-8 relative z-10 animate-in slide-in-from-bottom duration-500">
                        <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-gray-300 hover:text-gray-900"><X size={24} /></button>

                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-16 h-16 bg-wink-yellow/20 text-wink-black rounded-full flex items-center justify-center mb-4">
                                <Smartphone size={32} strokeWidth={2.5} />
                            </div>
                            <h2 className="text-2xl font-black">Paiement Sécurisé</h2>
                            <p className="text-xs text-gray-500 mt-2 px-4">
                                Entrez votre numéro Mobile Money (MTN ou Orange).
                            </p>
                        </div>

                        {paymentError && (
                            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 text-xs font-bold border border-red-100">
                                <AlertCircle size={18} /> {paymentError}
                            </div>
                        )}

                        <div className="mb-6">
                            <WinkInput 
                                label="Numéro de téléphone"
                                value={payPhone}
                                onChange={(e) => setPayPhone(e.target.value)}
                                icon={CreditCard}
                                placeholder="6xx xx xx xx"
                                type="tel"
                            />
                        </div>

                        <WinkButton 
                            variant="primary" 
                            onClick={handleInitiatePayment}
                            isLoading={isPaying}
                        >
                            {isPaying ? "Communication avec l'opérateur..." : `Confirmer ${totalPrice} FCFA`}
                        </WinkButton>

                        {/* --- TRUST BADGES (Badge de confiance) --- */}
                        <div className="mt-8 pt-6 border-t border-gray-100">
                            <div className="flex justify-center items-center gap-6 opacity-60 grayscale hover:grayscale-0 transition-all duration-300">
                                {/* Badges Opérateurs (Texte ou Image) */}
                                <span className="font-bold text-xs text-orange-500">Orange Money</span>
                                <div className="h-4 w-[1px] bg-gray-300"></div>
                                <span className="font-bold text-xs text-yellow-500">MTN MoMo</span>
                            </div>
                            
                            <div className="flex justify-center gap-4 mt-4 text-[10px] text-gray-400 font-medium">
                                <div className="flex items-center gap-1">
                                    <Lock size={12} className="text-green-600" />
                                    <span>Paiement chiffré SSL</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <ShieldCheck size={12} className="text-blue-600" />
                                    <span>Garantie Wink</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}