import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { 
    Power, MapPin, Navigation, Zap, Loader2, ArrowRight, AlertTriangle, 
    Crosshair, List, X, Utensils, FileText, Wine, Anchor, Package 
} from 'lucide-react';
import WinkButton from '../../components/WinkButton';
import api from '../../services/api'; 
import { io } from 'socket.io-client';

export default function RadarPage() {
    const navigate = useNavigate();
    const { darkMode } = useOutletContext();
    
    // --- ÉTATS ---
    const [isOnline, setIsOnline] = useState(false);
    const [location, setLocation] = useState(null);
    const [gpsAccuracy, setGpsAccuracy] = useState(null);
    const [gpsError, setGpsError] = useState(null);

    const [stats, setStats] = useState({ active: 0, max: 5 }); 
    const [offeredOrder, setOfferedOrder] = useState(null); 
    const [marketplaceOrders, setMarketplaceOrders] = useState([]); 
    const [showMarketplaceModal, setShowMarketplaceModal] = useState(false);

    const watchId = useRef(null);
    const socketRef = useRef(null);

    // --- 1. INITIALISATION DES STATS ---
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.rider.getStats();
                // Utilisation des données réelles du backend
                setStats({ 
                    active: res.data.activeMissions || 0, // À adapter selon la réponse exacte
                    max: res.data.maxCapacity || 5 
                });
                // Si déjà en ligne (persistance), on met à jour l'état
                if (res.data.settings?.isOnline) setIsOnline(true);
            } catch (err) { console.error("Erreur stats:", err); }
        };
        fetchStats();
    }, []);

    // --- 2. GESTION GPS ET DISPONIBILITÉ RÉELLE ---
    useEffect(() => {
        if (isOnline) {
            // Connexion Socket pour recevoir les commandes en temps réel
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            socketRef.current = io(API_URL);
            
            // Rejoindre la salle "Radar"
            socketRef.current.emit('join_radar');

            // Écouter les nouvelles commandes proches
            socketRef.current.on('new_order_available', (order) => {
                console.log("🔥 Nouvelle commande reçue via Socket:", order);
                setOfferedOrder(order);
                // Jouer un son ici si nécessaire
            });

            // Tracking GPS
            if (!navigator.geolocation) { setGpsError("GPS non supporté"); return; }
            
            watchId.current = navigator.geolocation.watchPosition(
                async (pos) => {
                    const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    setLocation(coords);
                    setGpsAccuracy(pos.coords.accuracy);
                    setGpsError(null);
                    
                    // Mise à jour de la position dans la DB via le service
                    try {
                        await api.rider.updateLocation(coords.lat, coords.lng);
                        
                        // Récupérer aussi les courses en mode "Marketplace" (Radar manuel)
                        const res = await api.rider.getAvailableOrders(coords.lat, coords.lng);
                        if (res.data.success) {
                            setMarketplaceOrders(res.data.orders || []);
                        }
                    } catch (e) { console.error("Update error:", e); }
                },
                (err) => {
                    console.warn("Erreur GPS:", err);
                    setGpsError("Signal GPS faible");
                },
                { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
            );
        } else {
            // Nettoyage quand on passe hors ligne
            if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
            if (socketRef.current) socketRef.current.disconnect();
            setOfferedOrder(null);
            setMarketplaceOrders([]);
        }
        
        return () => {
            if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, [isOnline]);

    // --- 3. ACTIONS ---
    const toggleOnline = async () => {
        try {
            // Informer le backend du changement de statut
            const res = await api.rider.toggleStatus(null, !isOnline); // null car l'ID est dans le token
            if (res.data.success) {
                setIsOnline(!isOnline);
            }
        } catch (err) { 
            console.error(err);
            // Fallback optimiste si l'API échoue
            setIsOnline(!isOnline);
        }
    };

    const handleAccept = async (orderId) => {
        if (stats.active >= stats.max) return alert("Terminez vos missions en cours d'abord !");
        
        try {
            // Validation de l'acceptation côté serveur
            const res = await api.rider.acceptOrder(orderId);
            if (res.data.success) {
                navigate('/rider/missions');
            }
        } catch (err) {
            console.error(err);
            alert("Cette course n'est plus disponible ou a été prise.");
            setOfferedOrder(null);
        }
    };

    // --- UI HELPERS ---
    const getPackageIcon = (type) => {
        switch(type) {
            case 'FOOD': return <Utensils size={18} className="text-orange-500"/>;
            case 'DOCS': return <FileText size={18} className="text-blue-500"/>;
            case 'FRAGILE': return <Wine size={18} className="text-purple-500"/>;
            case 'HEAVY': return <Anchor size={18} className="text-red-500"/>;
            default: return <Package size={18} className="text-gray-500"/>;
        }
    };

    return (
        <div className="h-full flex flex-col relative overflow-hidden bg-transparent">
            
            {/* 1. HEADER (CAPACITÉ) */}
            {isOnline && (
                <div className="absolute top-4 left-4 right-4 z-30 flex justify-between items-start animate-in fade-in">
                    <div className={`px-4 py-2 rounded-xl backdrop-blur-md border shadow-lg flex items-center gap-2 ${
                        stats.active >= stats.max ? 'bg-red-500 text-white border-red-400' : (darkMode ? 'bg-gray-900/90 border-gray-700' : 'bg-white/90 border-gray-200')
                    }`}>
                        <span className="text-[10px] font-black uppercase opacity-60 tracking-tighter">Charge</span>
                        <span className="font-black">{stats.active}/{stats.max}</span>
                    </div>

                    <div className="bg-black/50 backdrop-blur px-3 py-1 rounded-full flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full animate-pulse ${gpsError ? 'bg-red-500' : 'bg-green-500'}`}></div>
                        <span className="text-[10px] font-bold text-white uppercase">{gpsError || `GPS ±${Math.round(gpsAccuracy || 0)}m`}</span>
                    </div>
                </div>
            )}

            {/* 2. LE RADAR CENTRAL */}
            <div className="flex-1 flex flex-col items-center justify-center relative pb-20">
                {isOnline ? (
                    <div className="relative flex items-center justify-center cursor-pointer" onClick={toggleOnline}>
                        <div className="absolute w-[80vw] h-[80vw] border border-green-500/10 rounded-full animate-ping [animation-duration:3s]"></div>
                        <div className="absolute w-[50vw] h-[50vw] border border-green-500/20 rounded-full animate-ping [animation-duration:2s]"></div>
                        
                        <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-green-500 to-green-600 flex items-center justify-center shadow-[0_0_60px_rgba(34,197,94,0.5)] z-10">
                            <Navigation size={48} className="text-white fill-current" />
                        </div>
                        <p className="absolute -bottom-16 text-xs font-black text-green-500 uppercase tracking-widest animate-pulse">Recherche active...</p>
                    </div>
                ) : (
                    <div className="text-center animate-in zoom-in duration-300">
                        <button onClick={toggleOnline} className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-800 border-8 border-gray-100 dark:border-gray-700 flex items-center justify-center shadow-inner group transition-transform active:scale-95">
                            <Power size={48} className="text-gray-400 group-hover:text-green-500 transition-colors" strokeWidth={3} />
                        </button>
                        <h2 className="text-xl font-black text-gray-400 dark:text-gray-600 mt-6 tracking-widest uppercase">Hors Ligne</h2>
                    </div>
                )}
            </div>

            {/* 3. MARKETPLACE (LISTE) */}
            {isOnline && marketplaceOrders.length > 0 && (
                <div className="absolute bottom-6 left-0 right-0 z-30 flex justify-center pb-safe">
                    <button 
                        onClick={() => setShowMarketplaceModal(true)}
                        className="bg-wink-black text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-3 font-black text-sm uppercase tracking-wider animate-in slide-in-from-bottom hover:scale-105 transition-transform"
                    >
                        <List size={18} className="text-wink-yellow" />
                        <span>Radar ({marketplaceOrders.length})</span>
                    </button>
                </div>
            )}

            {/* --- MODALE MARKETPLACE --- */}
            {showMarketplaceModal && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center p-4">
                    <div className={`w-full max-w-md rounded-[32px] p-6 animate-in slide-in-from-bottom ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} max-h-[70vh] flex flex-col`}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black uppercase tracking-tighter">Marketplace</h3>
                            <button onClick={() => setShowMarketplaceModal(false)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full"><X size={20}/></button>
                        </div>
                        <div className="overflow-y-auto space-y-3 pr-2">
                            {marketplaceOrders.map(order => (
                                <div key={order.id} className={`p-4 rounded-2xl border flex justify-between items-center ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                                    <div className="flex-1 min-w-0 pr-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            {getPackageIcon(order.packageType)}
                                            <span className="text-[10px] font-bold text-gray-400 uppercase truncate">{order.packageDesc || 'Colis Standard'}</span>
                                        </div>
                                        <p className="font-black text-xl text-green-500">{order.price} <span className="text-xs">F</span></p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">{order.tripDistance} • {order.distanceToPickup}</p>
                                    </div>
                                    <button onClick={() => { setOfferedOrder(order); setShowMarketplaceModal(false); }} className="bg-wink-black text-white p-3 rounded-xl hover:bg-green-600 transition-colors"><ArrowRight size={20}/></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* 4. POP-UP D'OFFRE PRIORITAIRE (RÉELLE) */}
            {offeredOrder && (
                <div className="fixed inset-0 z-[60] flex items-end justify-center bg-wink-black/95 backdrop-blur-xl p-4 animate-in fade-in">
                    <div className={`w-full max-w-md rounded-[40px] p-8 shadow-2xl animate-in slide-in-from-bottom duration-500 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
                        <div className="mb-8 border-b border-gray-100 dark:border-gray-700 pb-6">
                            <p className="text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Gain Net Estimé</p>
                            <div className="flex justify-between items-end">
                                <h2 className="text-6xl font-black text-green-500 tracking-tighter">{offeredOrder.price} <span className="text-xl">F</span></h2>
                                <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-2xl font-black text-lg">{offeredOrder.tripDistance}</div>
                            </div>
                        </div>

                        <div className="relative pl-8 space-y-8 mb-10">
                            <div className="absolute left-3 top-2 bottom-6 w-0.5 bg-gray-100 dark:bg-gray-700"></div>
                            <div>
                                <div className="absolute -left-0.5 w-7 h-7 rounded-full border-4 border-white dark:border-gray-800 bg-wink-yellow flex items-center justify-center"><MapPin size={12} className="text-black"/></div>
                                <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Point A • {offeredOrder.distanceToPickup}</p>
                                <p className="font-bold text-lg leading-tight truncate">{offeredOrder.pickup || offeredOrder.pickup_address}</p>
                            </div>
                            <div>
                                <div className="absolute -left-0.5 w-7 h-7 rounded-full border-4 border-white dark:border-gray-800 bg-wink-black flex items-center justify-center"><Navigation size={12} className="text-white"/></div>
                                <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Point B</p>
                                <p className="font-bold text-lg leading-tight truncate">{offeredOrder.dropoff || offeredOrder.dropoff_address}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => setOfferedOrder(null)} className="py-5 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-400 hover:text-red-500 transition-colors">Ignorer</button>
                            <WinkButton variant="primary" onClick={() => handleAccept(offeredOrder.id)} disabled={stats.active >= stats.max}>
                                {stats.active >= stats.max ? 'COMPLET' : 'ACCEPTER'}
                            </WinkButton>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}