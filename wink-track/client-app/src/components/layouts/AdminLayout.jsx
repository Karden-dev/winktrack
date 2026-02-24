import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
    LayoutDashboard, Users, Map, Radio, Settings, 
    LogOut,  CreditCard, ChevronLeft, ChevronRight,
    MapPin, Tag, LifeBuoy, ShoppingBag
} from 'lucide-react';

export default function AdminLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    
    // État pour masquer/afficher la sidebar (Mode "God View")
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const adminUser = {
        name: "Superviseur",
        role: "Admin",
        avatar: "https://ui-avatars.com/api/?name=Wink+Express&background=10b981&color=fff"
    };

    const handleLogout = () => {
        if(window.confirm("Se déconnecter de Wink Express ?")) {
            navigate('/');
        }
    };

    return (
        <div className="flex h-screen w-full bg-gray-100 overflow-hidden font-sans">
            
            {/* 1. SIDEBAR (Masquable) */}
            <aside 
                className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-slate-300 flex flex-col shadow-2xl border-r border-slate-800 transition-all duration-300 z-50`}
            >
                
                {/* A. HEADER (Nom + Toggle) */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
                    {/* Logo / Nom */}
                    {isSidebarOpen ? (
                        <div className="flex items-center gap-2 animate-in fade-in">
                            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                                <span className="font-black text-black">W</span>
                            </div>
                            <span className="font-bold text-white tracking-tight text-lg">WINK EXPRESS</span>
                        </div>
                    ) : (
                        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mx-auto">
                            <span className="font-black text-black">W</span>
                        </div>
                    )}

                    {/* Bouton Masquer/Afficher */}
                    <button 
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className={`p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors ${!isSidebarOpen && 'hidden'}`}
                    >
                        <ChevronLeft size={18} />
                    </button>
                </div>

                {/* Si fermé, on met le bouton de réouverture centré ici */}
                {!isSidebarOpen && (
                    <button 
                        onClick={() => setIsSidebarOpen(true)}
                        className="mx-auto mt-2 p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"
                    >
                        <ChevronRight size={18} />
                    </button>
                )}

                {/* B. NAVIGATION (Menu Complet) */}
                <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1 custom-scrollbar">
                    
                    {/* Section Opérations */}
                    <SectionLabel isOpen={isSidebarOpen} label="Opérations" />
                    <AdminLink to="/admin/dashboard" icon={Map} label="Live Map" isOpen={isSidebarOpen} />
                    <AdminLink to="/admin/orders" icon={Radio} label="Dispatch" isOpen={isSidebarOpen} badge="Live" badgeColor="bg-red-500 animate-pulse" />
                    <AdminLink to="/admin/riders" icon={Users} label="Livreurs & Flotte" isOpen={isSidebarOpen} badge="3" />
                    <AdminLink to="/admin/clients" icon={ShoppingBag} label="Clients" isOpen={isSidebarOpen} />

                    {/* Section Finance & Data */}
                    <div className="mt-6"></div>
                    <SectionLabel isOpen={isSidebarOpen} label="Gestion" />
                    <AdminLink to="/admin/finance" icon={CreditCard} label="Finance & Wallet" isOpen={isSidebarOpen} />
                    <AdminLink to="/admin/zones" icon={MapPin} label="Zones & Geofence" isOpen={isSidebarOpen} />
                    <AdminLink to="/admin/pricing" icon={Tag} label="Tarifs & Promos" isOpen={isSidebarOpen} />

                    {/* Section Système */}
                    <div className="mt-6"></div>
                    <SectionLabel isOpen={isSidebarOpen} label="Système" />
                    <AdminLink to="/admin/support" icon={LifeBuoy} label="Support Tickets" isOpen={isSidebarOpen} />
                    <AdminLink to="/admin/settings" icon={Settings} label="Paramètres" isOpen={isSidebarOpen} />
                </nav>

                {/* C. PROFIL UTILISATEUR (Bas de page) */}
                <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                    <div className={`flex items-center gap-3 rounded-xl transition-colors cursor-pointer group ${!isSidebarOpen ? 'justify-center' : ''}`}>
                        
                        {/* Avatar */}
                        <div className="relative shrink-0">
                            <img src={adminUser.avatar} alt="Admin" className="w-9 h-9 rounded-full border-2 border-slate-700 group-hover:border-green-500 transition-colors" />
                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-slate-900 rounded-full"></div>
                        </div>

                        {/* Info Texte (Masqué si fermé) */}
                        {isSidebarOpen && (
                            <div className="flex-1 min-w-0 animate-in fade-in">
                                <p className="text-sm font-bold text-white truncate">{adminUser.name}</p>
                                <p className="text-xs text-slate-500 truncate">{adminUser.role}</p>
                            </div>
                        )}

                        {/* Bouton Logout */}
                        {isSidebarOpen && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleLogout(); }}
                                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Déconnexion"
                            >
                                <LogOut size={18} />
                            </button>
                        )}
                    </div>
                </div>
            </aside>

            {/* 2. ZONE PRINCIPALE (CARTE / CONTENU) */}
            <main className="flex-1 relative h-full w-full bg-gray-100 flex flex-col overflow-hidden">
                <Outlet />
            </main>

        </div>
    );
}

// Composant Label de Section
const SectionLabel = ({ isOpen, label }) => {
    if (!isOpen) return <div className="h-4 border-b border-slate-800 mx-2 mb-2"></div>;
    return (
        <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 animate-in fade-in">
            {label}
        </p>
    );
};

// Composant Lien de Navigation
const AdminLink = ({ to, icon: Icon, label, isOpen, badge, badgeColor }) => (
    <NavLink 
        to={to} 
        className={({ isActive }) => `
            flex items-center px-3 py-3 rounded-lg transition-all group mb-1
            ${isActive 
                ? 'bg-green-600 text-white shadow-lg shadow-green-900/20' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }
            ${!isOpen ? 'justify-center' : ''}
        `}
        title={!isOpen ? label : ''}
    >
        <Icon size={20} className="shrink-0" />
        
        {isOpen && (
            <div className="flex-1 flex justify-between items-center ml-3 animate-in fade-in overflow-hidden">
                <span className="text-sm font-medium whitespace-nowrap">{label}</span>
                {badge && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${badgeColor || 'bg-slate-700 text-white'}`}>
                        {badge}
                    </span>
                )}
            </div>
        )}
        
        {/* Petit point rouge si fermé et notif */}
        {!isOpen && badge && (
            <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-slate-900"></div>
        )}
    </NavLink>
);