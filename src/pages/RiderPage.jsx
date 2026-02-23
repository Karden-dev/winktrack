import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Zap, MapPin, Navigation, Power, Loader2, Phone, MessageCircle, 
    X, Wallet, User, List, CheckCircle, Moon, Sun, AlertTriangle, ChevronRight 
} from 'lucide-react';
import WinkButton from '../components/WinkButton';
import api from '../services/api';

// --- CONFIGURATION ---
const MAX_MISSIONS = 5;

export default function RiderPage() {
    const navigate = useNavigate();
    const myPhone = localStorage.getItem('wink_phone');

    // --- ÉTATS GLOBAUX ---
    const [activeTab, setActiveTab] = useState('RADAR'); // RADAR, MISSIONS, WALLET, PROFILE
    const [darkMode, setDarkMode] = useState(true); // Par défaut en mode sombre (économie batterie)
    
    // --- ÉTATS DATA ---
    const [isOnline, setIsOnline] = useState(false);
    const [location, setLocation] = useState(null);
    const [orders, setOrders] = useState([]); // Radar
    const [myMissions, setMyMissions] = useState([]); // Mes courses acceptées
    const [wallet, setWallet] = useState(null);
    
    // --- ÉTATS UI ---
    const [otpInputs, setOtpInputs] = useState({}); // Pour stocker les OTP par commande
    const radarInterval = useRef(null);

    // 1. Initialisation
    useEffect(() => {
        if (!myPhone) {
            const p = prompt("Votre numéro de livreur ?");
            if (p) localStorage.setItem('wink_phone', p);
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => alert("GPS requis"),
            { enableHighAccuracy: true }
        );
        loadWallet();
    }, []);

    // 2. Radar Loop
    useEffect(() => {
        if (isOnline && location && myMissions.length < MAX_MISSIONS) {
            fetchOrders();
            radarInterval.current = setInterval(fetchOrders, 5000);
        } else {
            clearInterval(radarInterval.current);
        }
        return () => clearInterval(radarInterval.current);
    }, [isOnline, location, myMissions.length]);

    // --- LOGIQUE MÉTIER ---

    const fetchOrders = async () => {
        try {
            const data = await api.getAvailableOrders(location.lat, location.lng);
            if (data.success) {
                // On filtre pour ne pas montrer les commandes qu'on a DÉJÀ acceptées
                const newOrders = data.orders.filter(o => !myMissions.find(m => m.id === o.id));
                setOrders(newOrders);
            }
        } catch (error) { console.error(error); }
    };

    const loadWallet = async () => {
        const data = await api.getWallet(myPhone);
        setWallet(data);
    };

    const handleAccept = (order) => {
        if (myMissions.length >= MAX_MISSIONS) return alert("Terminez vos courses actuelles !");
        
        // Ajout à mes missions
        const newMission = { ...order, status: 'PICKUP' }; // PICKUP -> DROPOFF -> DONE
        setMyMissions([...myMissions, newMission]);
        
        // Retrait du radar
        setOrders(orders.filter(o => o.id !== order.id));
        
        // On bascule sur l'onglet missions
        setActiveTab('MISSIONS');
    };

    const handleFinish = async (missionId) => {
        const otp = otpInputs[missionId];
        if (!otp || otp.length < 4) return alert("Code OTP invalide (4 chiffres)");

        // Appel API (Simulé)
        const res = await api.completeOrder(missionId, otp);
        if (res.success) {
            alert(`Course terminée ! +${res.earnings} FCFA`);
            setMyMissions(myMissions.filter(m => m.id !== missionId));
            loadWallet(); // Mise à jour solde
        } else {
            alert("Code OTP incorrect");
        }
    };

    const openGPS = (lat, lng) => {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    };

    const contactUser = (phone, msg) => {
        if(!msg) window.location.href = `tel:${phone}`;
        else window.open(`https://wa.me/237${phone.replace(/\s/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    // --- RENDU ---

    const themeClass = darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900";
    const cardClass = darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200 shadow-sm";
    const textMuted = darkMode ? "text-gray-400" : "text-gray-500";

    return (
        <div className={`min-h-screen flex flex-col font-sans ${themeClass} transition-colors duration-300 pb-20`}>
            
            {/* HEADER */}
            <div className={`p-4 flex justify-between items-center sticky top-0 z-30 backdrop-blur-md border-b ${darkMode ? 'border-gray-800 bg-gray-900/90' : 'border-gray-200 bg-white/90'}`}>
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                    <span className="font-bold">{isOnline ? 'EN SERVICE' : 'HORS SERVICE'}</span>
                </div>
                <button onClick={() => setIsOnline(!isOnline)} className="p-2 rounded-full bg-gray-200/10 hover:bg-gray-200/20">
                    <Power size={20} className={isOnline ? "text-green-500" : "text-red-500"} />
                </button>
            </div>

            {/* --- CONTENU DES ONGLETS --- */}
            
            <div className="flex-1 overflow-y-auto p-4">
                
                {/* 1. ONGLET RADAR */}
                {activeTab === 'RADAR' && (
                    <div className="flex flex-col h-full">
                        {!isOnline ? (
                            <div className="flex-1 flex flex-col items-center justify-center opacity-50">
                                <Power size={64} className="mb-4" />
                                <h2 className="text-xl font-bold">Vous êtes hors ligne</h2>
                            </div>
                        ) : (
                            <>
                                {orders.length === 0 ? (
                                    <div className="flex-1 flex flex-col items-center justify-center relative">
                                        <div className="absolute w-48 h-48 border border-green-500/20 rounded-full animate-ping"></div>
                                        <Loader2 size={40} className="text-green-500 animate-spin mb-4" />
                                        <p className={textMuted}>Recherche de courses...</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center px-2">
                                            <span className="text-xs font-bold uppercase text-green-500">
                                                {orders.length} Courses Disponibles
                                            </span>
                                            <span className="text-xs font-bold uppercase text-orange-500">
                                                Capacité: {myMissions.length}/{MAX_MISSIONS}
                                            </span>
                                        </div>
                                        {orders.map(order => (
                                            <div key={order.id} className={`rounded-2xl p-5 border ${cardClass} animate-in slide-in-from-bottom`}>
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h3 className="text-3xl font-black">{order.price} <span className="text-sm font-normal">F</span></h3>
                                                        <p className={`text-xs ${textMuted}`}>{order.tripDistance} total</p>
                                                    </div>
                                                    <div className="bg-blue-500/10 text-blue-500 px-3 py-1 rounded-lg text-xs font-bold">
                                                        {order.distanceToPickup}
                                                    </div>
                                                </div>
                                                <div className="mb-4 text-sm">
                                                    <div className="flex gap-2 items-center mb-1">
                                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                        <span className="truncate">{order.pickup}</span>
                                                    </div>
                                                </div>
                                                <WinkButton variant="action" onClick={() => handleAccept(order)}>
                                                    ACCEPTER LA COURSE
                                                </WinkButton>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* 2. ONGLET MISSIONS (ACTIVES) */}
                {activeTab === 'MISSIONS' && (
                    <div className="space-y-6">
                        {myMissions.length === 0 ? (
                            <div className="text-center py-20">
                                <List size={48} className={`mx-auto mb-4 ${textMuted}`} />
                                <p className={textMuted}>Aucune course en cours.</p>
                                <button onClick={() => setActiveTab('RADAR')} className="text-green-500 font-bold mt-4">Aller au Radar</button>
                            </div>
                        ) : (
                            myMissions.map((mission, index) => (
                                <div key={mission.id} className={`rounded-2xl p-5 border relative overflow-hidden ${cardClass}`}>
                                    {/* Numéro de mission */}
                                    <div className="absolute top-0 right-0 bg-gray-700 text-white px-3 py-1 rounded-bl-xl text-xs font-bold">
                                        #{index + 1}
                                    </div>

                                    {/* Info Route */}
                                    <div className="mb-6">
                                        <p className="text-xs uppercase font-bold text-gray-500 mb-2">Itinéraire</p>
                                        <div className="flex gap-3 mb-4">
                                            <div className="flex flex-col items-center pt-1">
                                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                                <div className="w-0.5 h-full bg-gray-300 my-1"></div>
                                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                            </div>
                                            <div className="flex-1 space-y-4">
                                                <div>
                                                    <p className="font-bold text-sm">Ramassage</p>
                                                    <p className={`text-xs ${textMuted} truncate`}>{mission.pickup}</p>
                                                    <div className="flex gap-2 mt-2">
                                                        <button onClick={() => openGPS(mission.pickup_lat, mission.pickup_lng)} className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-xs font-bold flex items-center gap-1">
                                                            <Navigation size={14}/> GPS
                                                        </button>
                                                        <button onClick={() => contactUser(mission.sender_phone)} className="bg-blue-100 text-blue-600 p-2 rounded"><Phone size={16}/></button>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm">Livraison</p>
                                                    <p className={`text-xs ${textMuted}`}>Chez {mission.recipient_name || 'Client'}</p>
                                                    <div className="flex gap-2 mt-2">
                                                        <button onClick={() => contactUser(mission.recipient_phone)} className="bg-green-100 text-green-600 p-2 rounded"><Phone size={16}/></button>
                                                        <button onClick={() => contactUser(mission.recipient_phone, "J'arrive avec votre colis !")} className="bg-green-100 text-green-600 p-2 rounded"><MessageCircle size={16}/></button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section OTP (Validation) */}
                                    <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-xl">
                                        <p className="text-xs font-bold uppercase mb-2 text-center text-gray-500">Code de validation (OTP)</p>
                                        <div className="flex gap-2">
                                            <input 
                                                type="tel" 
                                                maxLength="4"
                                                placeholder="0000"
                                                className="flex-1 bg-white dark:bg-gray-800 text-center text-xl font-bold tracking-widest py-2 rounded-lg outline-none border border-gray-300 dark:border-gray-600 focus:border-green-500"
                                                onChange={(e) => setOtpInputs({...otpInputs, [mission.id]: e.target.value})}
                                            />
                                            <button 
                                                onClick={() => handleFinish(mission.id)}
                                                className="bg-green-600 text-white px-4 rounded-lg font-bold"
                                            >
                                                OK
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-center mt-2 text-gray-400">Demandez ce code au destinataire</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* 3. ONGLET WALLET */}
                {activeTab === 'WALLET' && wallet && (
                    <div className="space-y-6">
                        {/* Carte Solde */}
                        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-3xl p-6 text-white shadow-lg">
                            <p className="text-sm opacity-80 mb-1">Solde disponible</p>
                            <h2 className="text-4xl font-black mb-4">{wallet.balance} <span className="text-lg">FCFA</span></h2>
                            <button className="bg-white/20 w-full py-2 rounded-xl text-sm font-bold backdrop-blur-sm">
                                Retirer mes gains
                            </button>
                        </div>

                        {/* Parrainage */}
                        <div className={`rounded-2xl p-5 border ${cardClass}`}>
                            <div className="flex items-center gap-2 mb-4">
                                <Zap className="text-yellow-500" fill="currentColor"/>
                                <h3 className="font-bold">Parrainage</h3>
                            </div>
                            <p className={`text-sm ${textMuted} mb-4`}>
                                Gagnez 20% sur les 5 premières courses de vos filleuls.
                            </p>
                            <div className="bg-gray-100 dark:bg-gray-900 p-3 rounded-lg flex justify-between items-center mb-4">
                                <span className="font-mono font-bold tracking-widest">{wallet.referralCode}</span>
                                <button onClick={() => contactUser("", `Utilise mon code ${wallet.referralCode} sur Wink !`)} className="text-blue-500 text-xs font-bold">PARTAGER</button>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Filleuls actifs</span>
                                <span className="font-bold">{wallet.referralCount}</span>
                            </div>
                        </div>

                        {/* Historique rapide */}
                        <div className="space-y-3">
                            <h3 className="font-bold text-sm uppercase text-gray-500">Activités récentes</h3>
                            {wallet.history.map(item => (
                                <div key={item.id} className={`flex justify-between items-center p-4 rounded-xl ${cardClass}`}>
                                    <div>
                                        <p className="font-bold text-sm">{item.label}</p>
                                        <p className="text-xs text-gray-400">{item.date}</p>
                                    </div>
                                    <span className="text-green-500 font-bold">+{item.amount} F</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 4. ONGLET PROFIL */}
                {activeTab === 'PROFILE' && (
                    <div className="space-y-4">
                        <div className={`p-4 rounded-2xl flex items-center gap-4 ${cardClass}`}>
                            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center text-2xl">😎</div>
                            <div>
                                <h3 className="font-bold text-lg">Livreur Wink</h3>
                                <p className="text-green-500 text-sm">Compte Vérifié</p>
                            </div>
                        </div>

                        <button onClick={() => setDarkMode(!darkMode)} className={`w-full p-4 rounded-xl flex justify-between items-center ${cardClass}`}>
                            <div className="flex items-center gap-3">
                                {darkMode ? <Moon size={20}/> : <Sun size={20}/>}
                                <span>Mode {darkMode ? 'Sombre' : 'Clair'}</span>
                            </div>
                            <div className={`w-10 h-6 rounded-full relative transition-colors ${darkMode ? 'bg-green-500' : 'bg-gray-300'}`}>
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${darkMode ? 'left-5' : 'left-1'}`}></div>
                            </div>
                        </button>

                        <button className={`w-full p-4 rounded-xl flex justify-between items-center ${cardClass}`}>
                            <div className="flex items-center gap-3 text-red-500">
                                <AlertTriangle size={20}/>
                                <span>Faire une réclamation</span>
                            </div>
                            <ChevronRight size={16} className="text-gray-400"/>
                        </button>

                        <div className="mt-8 text-center">
                             <p className="text-xs text-gray-500">Wink Rider App v1.0.2</p>
                        </div>
                    </div>
                )}
            </div>

            {/* BOTTOM NAVIGATION (Onglets) */}
            <div className={`fixed bottom-0 left-0 right-0 p-2 flex justify-around items-center border-t z-40 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                <NavButton icon={Navigation} label="Radar" active={activeTab === 'RADAR'} onClick={() => setActiveTab('RADAR')} />
                <NavButton icon={List} label="Missions" active={activeTab === 'MISSIONS'} onClick={() => setActiveTab('MISSIONS')} badge={myMissions.length} />
                <NavButton icon={Wallet} label="Wallet" active={activeTab === 'WALLET'} onClick={() => setActiveTab('WALLET')} />
                <NavButton icon={User} label="Profil" active={activeTab === 'PROFILE'} onClick={() => setActiveTab('PROFILE')} />
            </div>
        </div>
    );
}

// Composant Bouton Navigation
const NavButton = ({ icon: Icon, label, active, onClick, badge }) => (
    <button 
        onClick={onClick} 
        className={`flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all relative ${active ? 'text-green-500 bg-green-500/10' : 'text-gray-400 hover:text-gray-200'}`}
    >
        <Icon size={24} strokeWidth={active ? 2.5 : 2} />
        <span className="text-[10px] font-medium mt-1">{label}</span>
        {badge > 0 && (
            <div className="absolute top-1 right-2 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full font-bold">
                {badge}
            </div>
        )}
    </button>
);