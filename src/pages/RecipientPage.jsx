import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Loader2, AlertCircle, MessageCircle, ShieldCheck, Copy, Check } from 'lucide-react';
import WinkButton from '../components/WinkButton';
import WinkInput from '../components/WinkInput';
import { useOrder } from '../context/OrderContext';
import api from '../services/api'; 
import { io } from 'socket.io-client';

export default function RecipientPage() {
    const navigate = useNavigate();
    const { order, updateOrder } = useOrder();

    const [rPhone, setRPhone] = useState(order.recipientPhone || '');
    const [rName, setRName] = useState(order.recipientName || '');
    const [status, setStatus] = useState('FORM'); 
    const [error, setError] = useState(null);
    const [magicLink, setMagicLink] = useState('');
    const [copied, setCopied] = useState(false);
    
    const orderIdRef = useRef(null);

    useEffect(() => {
        if (!order.pickupLocation) {
            navigate('/map');
        }
    }, [order.pickupLocation, navigate]);

    useEffect(() => {
        let socket;
        if (status === 'WAITING' && orderIdRef.current) {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            socket = io(API_URL);
            socket.emit('join_order', orderIdRef.current);

            socket.on('order_updated', (data) => {
                if (data.status === 'PAYMENT_PENDING' || data.status === 'READY_TO_PAY') {
                    updateOrder({
                        totalPrice: data.total_price,
                        distance: data.distance_km,
                        orderId: data.id
                    });
                    navigate('/pay'); 
                }
            });
        }
        return () => { if (socket) socket.disconnect(); };
    }, [status, navigate, updateOrder]);

    const handleAction = async (method) => {
        const senderPhone = localStorage.getItem('wink_phone') || order.senderPhone;
        
        if (!senderPhone) {
            alert("Session expirée. Veuillez vous reconnecter.");
            navigate('/'); 
            return;
        }

        // Nettoyage intelligent du numéro (on ne garde que les chiffres)
        let cleanPhone = rPhone.replace(/\D/g, ''); 
        
        // Si le numéro commence par 0, on l'enlève
        if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);
        
        // On s'assure que le préfixe 237 est là une seule fois
        if (cleanPhone.startsWith('237')) {
            // C'est bon, on ne fait rien
        } else if (cleanPhone.length === 9) {
            cleanPhone = '237' + cleanPhone;
        }

        if (cleanPhone.length < 9) return alert("Numéro de téléphone invalide.");
        
        setStatus('LOADING');
        setError(null);

        try {
            const payload = {
                senderPhone: senderPhone,
                pickup: order.pickupLocation, 
                packageDesc: order.packageDescription || "Colis standard",
                recipient: {
                    name: rName,
                    phone: cleanPhone
                }
            };

            const response = await api.orders.initiate(payload);

            if (response.data.success) {
                const { orderId, magicLink: link } = response.data;
                orderIdRef.current = orderId;
                
                updateOrder({
                    recipientName: rName,
                    recipientPhone: cleanPhone,
                    orderId: orderId
                });

                setMagicLink(link);
                
                if (method === 'WHATSAPP_SELF') {
                    const message = `Salut ${rName || 'là'}, je souhaite t'envoyer un colis via Wink Express. Peux-tu confirmer ton lieu de livraison ici : ${link}`;
                    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
                    
                    // On change le statut AVANT de rediriger pour que si l'utilisateur revient, il soit sur l'écran d'attente
                    setStatus('WAITING');
                    
                    // Utiliser window.location.href est beaucoup plus fiable que window.open sur mobile
                    window.location.href = waUrl;
                } else {
                    setStatus('WAITING');
                }
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || "Erreur serveur. Veuillez réessayer.");
            setStatus('FORM');
        }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(magicLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (status === 'FORM' || status === 'LOADING') {
        return (
            <div className="min-h-screen p-6 flex flex-col pt-10 bg-white relative">
                <button onClick={() => navigate('/map')} className="text-sm font-bold text-gray-400 mb-6 flex items-center gap-1">← Retour</button>
                
                <h1 className="text-2xl font-black text-gray-900 mb-2">Destinataire</h1>
                <p className="text-sm text-gray-500 mb-8">Entrez ses coordonnées pour qu'il valide sa position exacte.</p>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 flex items-center gap-2 text-xs font-bold border border-red-100">
                        <AlertCircle size={18}/> {error}
                    </div>
                )}

                <div className="space-y-5">
                    <WinkInput 
                        label="Numéro du destinataire"
                        icon={Phone} 
                        placeholder="6xx xx xx xx"
                        value={rPhone}
                        onChange={(e) => setRPhone(e.target.value)}
                        type="tel"
                    />
                    
                    <WinkInput 
                        label="Nom du destinataire"
                        icon={User}
                        placeholder="ex: M. Kamga"
                        value={rName}
                        onChange={(e) => setRName(e.target.value)}
                    />

                    <div className="pt-6 space-y-3">
                        <WinkButton 
                            variant="secondary" 
                            className="bg-green-500 text-white border-none hover:bg-green-600"
                            onClick={() => handleAction('WHATSAPP_SELF')} 
                            isLoading={status === 'LOADING'}
                        >
                            <MessageCircle size={20} className="mr-2" /> Envoyer via mon WhatsApp
                        </WinkButton>

                        <WinkButton 
                            variant="primary" 
                            onClick={() => handleAction('WINK_PRO')} 
                            isLoading={status === 'LOADING'}
                        >
                            <ShieldCheck size={20} className="mr-2" /> Laisser Wink envoyer (SMS)
                        </WinkButton>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-wink-black text-white">
            <div className="relative mb-10">
                <div className="absolute inset-0 bg-wink-yellow blur-3xl opacity-20 animate-pulse"></div>
                <Loader2 size={80} className="text-wink-yellow animate-spin relative z-10" strokeWidth={3} />
            </div>

            <h2 className="text-2xl font-black mb-3">Lien généré !</h2>
            <p className="text-gray-400 text-sm max-w-xs mx-auto mb-8 leading-relaxed">
                Nous attendons que <strong>{rName || rPhone}</strong> valide sa position sur la carte.
            </p>

            {/* ✅ Bloc d'action secondaire si WhatsApp ne s'est pas ouvert ou pour renvoyer */}
            <div className="w-full max-w-sm space-y-4 mb-8">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 truncate mr-4">{magicLink}</span>
                    <button onClick={copyLink} className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                        {copied ? <Check size={16} className="text-green-500"/> : <Copy size={16}/>}
                    </button>
                </div>
                
                <button 
                    onClick={() => {
                        const message = `Salut ${rName || 'là'}, je souhaite t'envoyer un colis via Wink Express. Peux-tu confirmer ton lieu de livraison ici : ${magicLink}`;
                        window.location.href = `https://wa.me/${rPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
                    }}
                    className="flex items-center justify-center gap-2 w-full py-3 text-xs font-bold text-green-500 border border-green-500/30 rounded-xl hover:bg-green-500/10 transition-all"
                >
                    <MessageCircle size={16}/> Ouvrir WhatsApp à nouveau
                </button>
            </div>
            
            <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 w-full max-w-sm">
                <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-wink-yellow">Suivi en direct</span>
                </div>
                <p className="text-xs text-gray-300 leading-loose">
                    Dès que le destinataire valide, cet écran calculera automatiquement le prix et vous redirigera vers le paiement.
                </p>
            </div>

            <button 
                onClick={() => setStatus('FORM')} 
                className="mt-12 text-xs font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-widest"
            >
                Annuler / Modifier
            </button>
        </div>
    );
}