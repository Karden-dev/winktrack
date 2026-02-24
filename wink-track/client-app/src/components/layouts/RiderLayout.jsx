import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Navigation, List, Wallet, User, Menu, X, Bell } from 'lucide-react';
import api from '../../services/api';

export default function RiderLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    
    // États
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [riderData, setRiderData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Gestion du Thème (Persistant)
    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem('wink_theme') === 'dark';
    });

    // 1. PERSISTANCE & AUTH : Vérification au démarrage
    useEffect(() => {
        const checkAuthAndMission = async () => {
            const token = localStorage.getItem('wink_token');
            const phone = localStorage.getItem('wink_phone');

            if (!token || !phone) {
                navigate('/rider/login');
                return;
            }

            try {
                // On récupère le dashboard (qui contient maintenant activeMissionId)
                const res = await api.rider.getDashboard(phone);
                if (res.data.success) {
                    const data = res.data.data;
                    setRiderData(data);

                    // LOGIQUE DE PERSISTANCE
                    // Si une mission est active et qu'on n'est pas déjà sur la page missions
                    if (data.activeMissionId && !location.pathname.includes('/rider/missions')) {
                        console.log("🚀 Restauration de la mission en cours :", data.activeMissionId);
                        navigate('/rider/missions');
                    }
                }
            } catch (error) {
                console.error("Session expirée ou erreur serveur", error);
                // navigate('/rider/login'); // Optionnel selon ta gestion d'erreur
            } finally {
                setLoading(false);
            }
        };

        checkAuthAndMission();
    }, [location.pathname, navigate]);

    useEffect(() => {
        localStorage.setItem('wink_theme', darkMode ? 'dark' : 'light');
        if (darkMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, [darkMode]);

    // Fermer le menu automatiquement quand on change de page
    useEffect(() => {
        setIsMenuOpen(false);
    }, [location.pathname]);

    const themeClass = darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900";
    
    // On utilise l'info de mission active pour le badge
    const hasActiveMission = riderData?.activeMissionId != null;

    if (loading) return null; // Ou un écran de splash Wink

    return (
        <div className={`h-screen w-full overflow-hidden font-sans transition-colors duration-300 ${themeClass}`}>
            
            {/* Header Mobile pour la visibilité du statut */}
            <header className={`fixed top-0 left-0 right-0 h-14 z-30 px-4 flex items-center justify-between backdrop-blur-md border-b ${darkMode ? 'bg-gray-900/80 border-gray-800' : 'bg-white/80 border-gray-100'}`}>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-wink-yellow flex items-center justify-center text-black font-black text-[10px]">W</div>
                    <span className="font-black text-sm tracking-tighter">WINK<span className="text-wink-yellow">RIDER</span></span>
                </div>
                <div className="flex items-center gap-3">
                    {hasActiveMission && (
                        <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                    )}
                    <Bell size={18} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                </div>
            </header>

            {/* 1. ZONE DE CONTENU */}
            <div className="h-full w-full overflow-y-auto pt-14 relative z-0">
                <Outlet context={{ darkMode, setDarkMode, riderData }} />
            </div>

            {/* 2. LE MENU FLOTTANT */}
            <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-4">

                {isMenuOpen && (
                    <div className="flex flex-col gap-3 animate-in slide-in-from-bottom-10 fade-in duration-200 mb-2">
                        <NavFab 
                            icon={User} label="Profil" 
                            onClick={() => navigate('/rider/profile')} 
                            active={location.pathname === '/rider/profile'} 
                            darkMode={darkMode}
                        />
                        <NavFab 
                            icon={Wallet} label="Wallet" 
                            onClick={() => navigate('/rider/wallet')} 
                            active={location.pathname === '/rider/wallet'} 
                            darkMode={darkMode}
                        />
                        <NavFab 
                            icon={List} label="Missions" 
                            onClick={() => navigate('/rider/missions')} 
                            active={location.pathname === '/rider/missions'} 
                            badge={hasActiveMission ? 1 : 0}
                            darkMode={darkMode}
                        />
                        <NavFab 
                            icon={Navigation} label="Radar" 
                            onClick={() => navigate('/rider/radar')} 
                            active={location.pathname === '/rider/radar'} 
                            darkMode={darkMode}
                        />
                    </div>
                )}

                {/* Bouton Toggle */}
                <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 active:scale-90 ${
                        isMenuOpen 
                            ? 'bg-red-500 rotate-90 text-white' 
                            : (darkMode ? 'bg-gray-800 text-white border border-gray-700' : 'bg-black text-white')
                    }`}
                >
                    {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    
                    {!isMenuOpen && hasActiveMission && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 border-2 border-white dark:border-gray-900 rounded-full text-[10px] font-bold flex items-center justify-center text-white">
                            1
                        </span>
                    )}
                </button>
            </div>

            {/* Overlay */}
            {isMenuOpen && (
                <div 
                    onClick={() => setIsMenuOpen(false)}
                    className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-30 animate-in fade-in"
                ></div>
            )}

        </div>
    );
}

const NavFab = ({ icon: Icon, label, onClick, active, badge, darkMode }) => (
    <div className="flex items-center justify-end gap-3 group">
        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md shadow-sm transition-opacity ${
            darkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-600'
        }`}>
            {label}
        </span>

        <button 
            onClick={onClick}
            className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all relative ${
                active 
                    ? 'bg-wink-yellow text-black ring-4 ring-wink-yellow/20' 
                    : (darkMode ? 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700' : 'bg-white text-gray-600 hover:text-black')
            }`}
        >
            <Icon size={20} strokeWidth={active ? 3 : 2} />
            {badge > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {badge}
                </span>
            )}
        </button>
    </div>
);