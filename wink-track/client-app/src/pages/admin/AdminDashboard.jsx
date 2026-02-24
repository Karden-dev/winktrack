import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { 
    Package, Zap, Navigation, Search, 
    Filter, Phone, X, Loader2
} from 'lucide-react';
import api from '../../services/api';
import socket from '../../services/socket'; // ✅ Assure-toi que ton instance socket est exportée ici

// --- CONFIGURATION CARTE ---
const mapContainerStyle = { width: '100%', height: '100%' };
const center = { lat: 3.8480, lng: 11.5021 }; // Yaoundé par défaut
const mapOptions = {
    disableDefaultUI: true,
    styles: [
        { "featureType": "all", "elementType": "labels.text.fill", "stylers": [{"saturation": 36}, {"color": "#000000"}, {"lightness": 40}] },
        { "featureType": "all", "elementType": "labels.icon", "stylers": [{"visibility": "off"}] },
        { "featureType": "administrative", "elementType": "geometry.fill", "stylers": [{"color": "#000000"}, {"lightness": 20}] },
        { "featureType": "landscape", "elementType": "geometry", "stylers": [{"color": "#f5f5f5"}] },
        { "featureType": "water", "elementType": "geometry", "stylers": [{"color": "#e9e9e9"}] }
    ]
};

export default function AdminDashboard() {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    });

    const [selectedEntity, setSelectedEntity] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    // --- ÉTATS RÉELS ---
    const [riders, setRiders] = useState([]);
    const [activeOrders, setActiveOrders] = useState([]);
    const [stats, setStats] = useState({ active: 0, busy: 0, pending: 0 });

    // --- 1. RÉCUPÉRATION DES DONNÉES (POLLING DE SÉCURITÉ) ---
    const refreshDashboard = useCallback(async () => {
        try {
            const ridersRes = await api.rider.getAllPositions(); 
            const ordersRes = await api.orders.getActive();
            
            const ridersList = Array.isArray(ridersRes.data?.data) ? ridersRes.data.data : [];
            const ordersList = Array.isArray(ordersRes.data?.data) ? ordersRes.data.data : [];
            
            setRiders(ridersList);
            setActiveOrders(ordersList);
            
            setStats({
                active: ridersList.length,
                busy: ridersList.filter(r => r.status === 'BUSY').length,
                pending: ordersList.filter(o => o.status === 'SEARCHING' || o.status === 'WAITING_DROPOFF').length
            });
        } catch (err) {
            console.error("Erreur Sync Dashboard:", err);
        }
    }, []);

    // --- 2. GESTION DU TEMPS RÉEL (SOCKETS) ---
    useEffect(() => {
        // Rejoindre la salle de monitoring admin
        socket.emit('join_admin');

        // Écouter les mouvements fluides des riders
        socket.on('admin_rider_update', (update) => {
            setRiders(prevRiders => {
                const exists = prevRiders.find(r => r.id === update.id);
                if (exists) {
                    return prevRiders.map(r => r.id === update.id ? { ...r, ...update } : r);
                }
                return [...prevRiders, update];
            });
        });

        // Rafraîchir les commandes quand une nouvelle arrive ou change de statut
        socket.on('admin_order_refresh', () => {
            refreshDashboard();
        });

        return () => {
            socket.off('admin_rider_update');
            socket.off('admin_order_refresh');
        };
    }, [refreshDashboard]);

    // Horloge et Polling de secours
    useEffect(() => {
        const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);
        const syncInterval = setInterval(refreshDashboard, 30000); // 30s suffisent avec les sockets

        refreshDashboard();
        return () => { clearInterval(clockInterval); clearInterval(syncInterval); };
    }, [refreshDashboard]);

    if (!isLoaded) return (
        <div className="h-screen flex items-center justify-center bg-slate-50">
            <Loader2 className="animate-spin text-wink-yellow" size={40}/>
        </div>
    );

    return (
        <div className="relative h-full w-full bg-slate-100 overflow-hidden font-sans notranslate" translate="no">
            
            {/* LAYER 0 : LA CARTE RÉELLE */}
            <div className="absolute inset-0 z-0">
                <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={center}
                    zoom={13}
                    options={mapOptions}
                    onClick={() => setSelectedEntity(null)}
                >
                    {/* Marqueurs Livreurs (Motos) */}
                    {riders.map(rider => (
                        <Marker
                            key={`rider-${rider.id}`}
                            position={{ lat: parseFloat(rider.current_lat), lng: parseFloat(rider.current_lng) }}
                            icon={{
                                // Utilisation de couleurs distinctes selon le statut
                                url: rider.status === 'BUSY' 
                                    ? 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png' 
                                    : 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
                                scaledSize: new window.google.maps.Size(32, 32)
                            }}
                            onClick={() => setSelectedEntity({ type: 'rider', data: rider })}
                        />
                    ))}

                    {/* Marqueurs Commandes (Colis) */}
                    {activeOrders.map(order => (
                        <Marker
                            key={`order-${order.id}`}
                            position={{ lat: parseFloat(order.pickup_lat), lng: parseFloat(order.pickup_lng) }}
                            icon={{
                                url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                                scaledSize: new window.google.maps.Size(28, 28)
                            }}
                            onClick={() => setSelectedEntity({ type: 'order', data: order })}
                        />
                    ))}
                </GoogleMap>
            </div>

            {/* LAYER 1 : HUD (UI) */}
            
            {/* A. KPI PANEL */}
            <div className="absolute top-6 left-6 z-20 flex gap-4">
                <KpiBadge label="Riders Online" value={stats.active} sub="Actifs" color="text-green-600" />
                <KpiBadge label="En Mission" value={stats.busy} color="text-orange-500" />
                <KpiBadge label="Commandes" value={stats.pending} color="text-blue-500" animate={stats.pending > 0} />
            </div>

            {/* B. SEARCH BAR */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 w-[450px]">
                <div className="bg-white/90 backdrop-blur-xl shadow-2xl rounded-2xl flex items-center px-5 py-3 border border-white/50">
                    <Search size={20} className="text-slate-400" />
                    <input 
                        className="bg-transparent border-none outline-none text-sm font-bold text-slate-700 w-full ml-4 placeholder:text-slate-400"
                        placeholder="Rechercher ID Commande, Nom Livreur..." 
                    />
                    <button className="ml-2 p-2 hover:bg-slate-100 rounded-xl text-slate-500"><Filter size={18}/></button>
                </div>
            </div>

            {/* C. LIVE CLOCK */}
            <div className="absolute top-6 right-6 z-20">
                <div className="bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-4 border border-white/10">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black uppercase tracking-widest text-wink-yellow">Wink Monitoring</span>
                        <span className="text-lg font-mono font-bold leading-none">
                            <span>{currentTime.toLocaleTimeString()}</span>
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-wink-yellow flex items-center justify-center text-black shadow-lg">
                        <Zap size={20} fill="currentColor" />
                    </div>
                </div>
            </div>

            {/* D. DISPATCH CONTEXT MODAL */}
            {selectedEntity && (
                <div className="absolute bottom-10 right-10 z-30 w-80 animate-in slide-in-from-right duration-300">
                    <div className="bg-white rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-slate-100 overflow-hidden">
                        <div className="bg-slate-900 text-white p-6">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg ${selectedEntity.type === 'rider' ? 'bg-wink-yellow text-black' : 'bg-blue-500 text-white'}`}>
                                        {selectedEntity.type === 'rider' ? <span>{selectedEntity.data.first_name?.charAt(0)}</span> : <Package size={24}/>}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-lg leading-none mb-1">
                                            <span>{selectedEntity.type === 'rider' ? `${selectedEntity.data.first_name} ${selectedEntity.data.last_name}` : `Commande #${selectedEntity.data.id}`}</span>
                                        </h3>
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-50">
                                            <span>{selectedEntity.data.status}</span>
                                        </span>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedEntity(null)} className="p-1 hover:bg-white/10 rounded-full transition-colors"><X size={20}/></button>
                            </div>
                        </div>

                        <div className="p-6 space-y-5">
                            {selectedEntity.type === 'rider' ? (
                                <>
                                    <div className="grid grid-cols-2 gap-3">
                                        <InfoBlock label="Batterie" value={`${selectedEntity.data.battery_level || 100}%`} icon={Zap} color="text-green-500" />
                                        <InfoBlock label="Vitesse" value="45 km/h" icon={Navigation} />
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Activité</p>
                                        <div className="text-sm font-bold text-slate-700 flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${selectedEntity.data.status === 'BUSY' ? 'bg-orange-500' : 'bg-green-500'}`}></div>
                                            <span>{selectedEntity.data.status === 'BUSY' ? 'Livraison en cours...' : 'Disponible'}</span>
                                        </div>
                                    </div>
                                    <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-transform shadow-lg">
                                        <Phone size={16}/> <span>Contacter le Rider</span>
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="space-y-4">
                                        <div className="flex justify-between border-b border-slate-100 pb-2">
                                            <span className="text-[10px] text-slate-400 font-black uppercase">Client (Dest.)</span>
                                            <span className="text-sm font-bold"><span>{selectedEntity.data.recipient_name || 'Anonyme'}</span></span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-100 pb-2">
                                            <span className="text-[10px] text-slate-400 font-black uppercase">Prix Course</span>
                                            <span className="text-sm font-black text-green-600"><span>{selectedEntity.data.total_price}</span> F</span>
                                        </div>
                                    </div>
                                    <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-200 active:scale-95 transition-transform">
                                        Assigner Manuellement
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- SOUS-COMPOSANTS SÉCURISÉS ---
const KpiBadge = ({ label, value, sub, color, animate }) => (
    <div className={`bg-white/90 backdrop-blur-xl px-5 py-3 rounded-2xl shadow-xl border border-white/50 flex flex-col min-w-[120px] ${animate ? 'animate-pulse ring-2 ring-red-500/20 border-red-200' : ''}`}>
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</span>
        <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-black ${color}`}>
                <span>{value}</span>
            </span>
            {sub && <span className="text-[10px] text-slate-400 font-bold uppercase"><span>{sub}</span></span>}
        </div>
    </div>
);

const InfoBlock = ({ label, value, icon: Icon, color = "text-slate-700" }) => (
    <div className="bg-slate-50 p-3 rounded-2xl flex items-center gap-3 border border-slate-100">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-slate-400">
            <Icon size={18}/>
        </div>
        <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{label}</p>
            <p className={`font-black text-sm ${color}`}>
                <span>{value}</span>
            </p>
        </div>
    </div>
);