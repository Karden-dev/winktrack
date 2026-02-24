import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
    Search, MapPin, Phone, MessageCircle, Navigation, 
    X, CheckCircle, Ruler, Package, ChevronRight, ArrowRight, Loader2
} from 'lucide-react';
import api from '../../services/api'; 

export default function MissionsPage() {
    const { darkMode } = useOutletContext();
    const [activeTab, setActiveTab] = useState('ACTIVE');
    const [searchQuery, setSearchQuery] = useState('');
    
    // États de données réelles
    const [missions, setMissions] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // UI States
    const [selectedMission, setSelectedMission] = useState(null); 
    const [showOtpScreen, setShowOtpScreen] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // --- 1. CHARGEMENT DES MISSIONS DEPUIS LE BACKEND ---
    const fetchMissions = async () => {
        setLoading(true);
        try {
            // Note: Assurez-vous d'ajouter getMissions dans api.js s'il n'y est pas
            // ou utilisez getStats s'il renvoie tout.
            // Ici, on suppose une route dédiée pour la clarté.
            // Si api.rider.getMissions n'existe pas encore, on peut simuler ou utiliser getDashboard
            const res = await api.rider.getStats(); // On utilise le dashboard qui contient souvent les infos
            
            // Pour l'instant, on filtre sur activeMissionId si getMissions n'est pas prêt
            // Idéalement : const ordersRes = await api.rider.getMissions();
            
            // Simulé pour le MVP si l'API liste complète n'est pas prête :
            if (res.data.activeMissionId) {
                // On récupère les détails de la mission active
                const missionRes = await api.orders.getStatus(res.data.activeMissionId);
                setMissions([missionRes.data]); 
            } else {
                setMissions([]);
            }
        } catch (err) {
            console.error("Erreur missions:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMissions();
    }, [activeTab]);

    // --- 2. LOGIQUE DE COMMUNICATION & GPS ---
    const handleWhatsApp = () => {
        if (!selectedMission) return;
        
        // Détection intelligente du destinataire
        const isPickupStep = selectedMission.status === 'ACCEPTED' || selectedMission.status === 'SEARCHING';
        
        // On utilise les numéros stockés dans la commande
        const targetPhone = isPickupStep ? selectedMission.client_phone : selectedMission.recipient_phone;
        
        if (!targetPhone) return alert("Numéro de téléphone non disponible");

        let msg = isPickupStep 
            ? `Bonjour, je suis votre livreur Wink. Je suis en route pour le ramassage de votre colis.`
            : `Bonjour, je suis en route avec votre colis Wink. J'arrive bientôt !`;
        
        // Formatage du numéro (enlève les espaces, ajoute 237 si manquant)
        let formattedPhone = targetPhone.replace(/\s+/g, '');
        if (!formattedPhone.startsWith('237')) formattedPhone = '237' + formattedPhone;

        window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    const handleGPS = () => {
        if (!selectedMission) return;
        const isPickup = selectedMission.status === 'ACCEPTED';
        
        // Coordonnées cibles
        const lat = isPickup ? selectedMission.pickup_lat : selectedMission.dropoff_lat;
        const lng = isPickup ? selectedMission.pickup_lng : selectedMission.dropoff_lng;
        
        if (!lat || !lng) return alert("Coordonnées GPS invalides");

        // Ouvre Google Maps en mode navigation moto
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=two_wheeler`, '_blank');
    };

    const handlePhoneCall = () => {
        if (!selectedMission) return;
        const isPickup = selectedMission.status === 'ACCEPTED';
        const phone = isPickup ? selectedMission.client_phone : selectedMission.recipient_phone;
        window.location.href = `tel:${phone}`;
    };

    // --- 3. VALIDATION OTP RÉELLE (Backend) ---
    const validateOtp = async () => {
        if (otpCode.length !== 4) return alert("Le code doit faire 4 chiffres");
        setIsValidating(true);
        
        try {
            const isPickup = selectedMission.status === 'ACCEPTED' || selectedMission.status === 'SEARCHING';
            let res;
            
            if (isPickup) {
                // Appel au contrôleur de ramassage (Pickup)
                res = await api.orders.validatePickup(selectedMission.id, otpCode);
            } else {
                // Appel au contrôleur de livraison finale (Delivery)
                res = await api.orders.validateDelivery(selectedMission.id, otpCode);
            }

            if (res.data.success) {
                setShowSuccess(true);
                // Son de succès (optionnel)
                // new Audio('/sounds/success.mp3').play();

                setTimeout(() => {
                    setSelectedMission(null);
                    setShowSuccess(false);
                    setShowOtpScreen(false);
                    setOtpCode('');
                    fetchMissions(); // Rafraîchir la liste pour voir le changement d'état
                }, 2500);
            } else {
                alert("Code OTP incorrect. Demandez au client de vérifier.");
            }
        } catch (err) {
            console.error(err);
            alert("Erreur lors de la validation. Vérifiez votre connexion.");
        } finally {
            setIsValidating(false);
        }
    };

    // --- RENDER HELPERS ---
    const filteredMissions = missions.filter(m => {
        const isHistory = m.status === 'DELIVERED' || m.status === 'CANCELLED';
        return activeTab === 'ACTIVE' ? !isHistory : isHistory;
    });

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-wink-yellow" size={40}/></div>;

    return (
        <div className="p-4 space-y-4 min-h-screen pb-24 font-sans bg-transparent">
            <h1 className="text-2xl font-black mb-4">Mes Missions</h1>

            {/* TABS RÉELLES */}
            <div className="flex p-1 rounded-2xl bg-gray-100 dark:bg-gray-800 mb-6">
                <button onClick={() => setActiveTab('ACTIVE')} className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${activeTab === 'ACTIVE' ? 'bg-white dark:bg-gray-700 shadow-sm text-wink-black' : 'text-gray-400'}`}>EN COURS</button>
                <button onClick={() => setActiveTab('HISTORY')} className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${activeTab === 'HISTORY' ? 'bg-white dark:bg-gray-700 shadow-sm text-wink-black' : 'text-gray-400'}`}>HISTORIQUE</button>
            </div>

            {/* LISTE DES MISSIONS RÉELLES */}
            <div className="space-y-4">
                {filteredMissions.length === 0 ? (
                    <div className="text-center py-20 opacity-50">
                        <Package size={48} className="mx-auto mb-4 text-gray-300" />
                        <p className="text-sm font-bold uppercase tracking-widest">Aucune mission</p>
                        {activeTab === 'ACTIVE' && <p className="text-xs mt-2">Activez le Radar pour recevoir des courses.</p>}
                    </div>
                ) : filteredMissions.map((mission) => (
                    <div 
                        key={mission.id} 
                        onClick={() => { setSelectedMission(mission); setShowOtpScreen(false); setOtpCode(''); }}
                        className={`p-5 rounded-[28px] border transition-all active:scale-95 cursor-pointer ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <span className="font-black text-xs bg-gray-100 dark:bg-gray-900 px-3 py-1 rounded-full text-gray-500">#{mission.id}</span>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${mission.status === 'ACCEPTED' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                                {mission.status === 'ACCEPTED' ? 'À Récupérer' : 'À Livrer'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 mb-4 text-xs font-bold text-gray-400 uppercase">
                            <Package size={14} className="text-wink-yellow" />
                            <span className="truncate">{mission.package_desc || 'Colis Standard'}</span>
                        </div>
                        <div className="flex justify-between items-end border-t border-gray-50 dark:border-gray-700 pt-4">
                            <div>
                                <p className="text-[10px] uppercase font-black text-gray-400">Gain Net</p>
                                <p className="font-black text-2xl text-green-500">{mission.rider_earnings || mission.price * 0.8} <span className="text-xs">F</span></p>
                            </div>
                            <div className="bg-wink-black text-white p-2 rounded-xl"><ChevronRight size={20}/></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* MODAL DE MISSION (Détails + Actions) */}
            {selectedMission && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className={`w-full max-w-md rounded-[40px] p-8 relative animate-in slide-in-from-bottom duration-300 ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
                        <button onClick={() => setSelectedMission(null)} className="absolute top-6 right-6 p-2 bg-gray-100 dark:bg-gray-800 rounded-full"><X size={20}/></button>

                        {showSuccess ? (
                            <div className="text-center py-10">
                                <CheckCircle size={80} className="text-green-500 mx-auto mb-4 animate-bounce" />
                                <h2 className="text-2xl font-black mb-2">Terminé !</h2>
                                <p className="text-green-500 font-black text-xl">+{selectedMission.rider_earnings} FCFA</p>
                                <p className="text-xs text-gray-400 mt-2">Ajouté à votre portefeuille.</p>
                            </div>
                        ) : !showOtpScreen ? (
                            <>
                                <div className="text-center mb-8">
                                    <h2 className="text-5xl font-black text-green-500 mb-1">{selectedMission.rider_earnings} F</h2>
                                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Gain Mission #{selectedMission.id}</p>
                                </div>

                                <div className="space-y-6 mb-10">
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0"><MapPin size={16} className="text-blue-500"/></div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase">Ramassage</p>
                                            <p className="font-bold text-sm">{selectedMission.pickup_address}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0"><Navigation size={16} className="text-green-500"/></div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase">Livraison</p>
                                            <p className="font-bold text-sm">{selectedMission.dropoff_address}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    <button onClick={handleGPS} className="py-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 font-black text-xs uppercase flex flex-col items-center justify-center gap-1"><Navigation size={20}/> GPS</button>
                                    <button onClick={handlePhoneCall} className="py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-black text-xs uppercase flex flex-col items-center justify-center gap-1"><Phone size={20}/> Appel</button>
                                    <button onClick={handleWhatsApp} className="py-4 rounded-2xl bg-green-50 dark:bg-green-900/20 text-green-600 font-black text-xs uppercase flex flex-col items-center justify-center gap-1"><MessageCircle size={20}/> Chat</button>
                                </div>

                                <button onClick={() => setShowOtpScreen(true)} className="w-full py-5 bg-wink-black text-white rounded-[24px] font-black text-lg flex items-center justify-center gap-3 active:scale-95 transition-transform">
                                    {selectedMission.status === 'ACCEPTED' ? 'VALIDER RAMASSAGE' : 'VALIDER LIVRAISON'} <ArrowRight size={22}/>
                                </button>
                            </>
                        ) : (
                            <div className="text-center">
                                <h3 className="text-xl font-black mb-2 uppercase">Code de Sécurité</h3>
                                <p className="text-xs text-gray-400 mb-8 font-bold leading-relaxed">
                                    Demandez le code à 4 chiffres à <br/>
                                    <span className="text-wink-yellow font-black text-sm uppercase">
                                        {selectedMission.status === 'ACCEPTED' ? "l'expéditeur" : "au destinataire"}
                                    </span>
                                </p>
                                <input 
                                    type="tel" maxLength="4" value={otpCode} onChange={(e) => setOtpCode(e.target.value)}
                                    placeholder="0000" className="w-full text-center text-6xl font-black tracking-[20px] mb-10 bg-transparent border-b-4 border-wink-yellow outline-none dark:text-white"
                                    autoFocus
                                />
                                <button 
                                    onClick={validateOtp} disabled={otpCode.length !== 4 || isValidating}
                                    className="w-full py-5 bg-green-500 text-wink-black rounded-[24px] font-black text-xl disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
                                >
                                    {isValidating ? <Loader2 className="animate-spin mx-auto"/> : 'CONFIRMER'}
                                </button>
                                <button onClick={() => setShowOtpScreen(false)} className="mt-6 text-xs font-black text-gray-400 uppercase">Annuler</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}