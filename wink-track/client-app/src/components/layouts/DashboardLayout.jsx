import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Menu, X, Wallet, MapPin, History, 
    Gift, HelpCircle, LogOut, Edit2, LayoutDashboard, Home 
} from 'lucide-react';

export default function DashboardLayout({ children, user, onLogout }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();

    // Chemins mis à jour pour correspondre aux Routes de Dashboard.jsx
    const menuItems = [
        { icon: LayoutDashboard, label: "Vue d'ensemble", path: '/dashboard' },
        { icon: Wallet, label: "Mon Wallet", value: `${user?.balance || 0} F`, path: '/dashboard/wallet' },
        { icon: History, label: "Toutes mes courses", path: '/dashboard/history' },
        { icon: Gift, label: "Codes Promos", path: '/dashboard/promos' }, // ✅ Lien vers la page Promo
        { icon: HelpCircle, label: "Aide & Support", path: '/dashboard/help' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* --- Header Mobile --- */}
            <div className="bg-white/80 backdrop-blur-md px-6 py-5 flex justify-between items-center sticky top-0 z-30 border-b border-slate-100/50">
                <button 
                    onClick={() => setIsMenuOpen(true)} 
                    className="p-2 -ml-2 text-wink-black active:scale-90 transition-transform"
                >
                    <Menu size={28} strokeWidth={3} />
                </button>
                
                <div 
                    className="flex items-center gap-2 cursor-pointer" 
                    onClick={() => navigate('/dashboard')}
                >
                    <div className="w-2.5 h-2.5 bg-wink-yellow rounded-full animate-pulse shadow-[0_0_10px_rgba(251,191,36,0.5)]"></div>
                    <span className="font-black text-xl tracking-tighter">WINK</span>
                </div>

                <button 
                    onClick={() => navigate('/map')}
                    className="p-2 -mr-2 text-wink-black active:scale-90 transition-transform"
                >
                    <Home size={24} />
                </button>
            </div>

            {/* --- Overlay (Menu ouvert) --- */}
            {isMenuOpen && (
                <div 
                    className="fixed inset-0 bg-wink-black/60 z-40 backdrop-blur-md animate-in fade-in duration-300" 
                    onClick={() => setIsMenuOpen(false)} 
                />
            )}
            
            {/* --- Sidebar / Drawer --- */}
            <aside className={`fixed top-0 left-0 bottom-0 w-[300px] bg-white z-50 transform transition-transform duration-500 ease-out shadow-2xl ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                
                {/* Profil Header dans la Sidebar */}
                <div className="bg-wink-black text-white p-10 pt-16 rounded-br-[60px] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-wink-yellow/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    
                    <div className="w-20 h-20 bg-wink-yellow rounded-[24px] flex items-center justify-center text-3xl font-black text-black mb-6 shadow-lg shadow-wink-yellow/20">
                        {user?.firstName ? user.firstName[0] : 'C'}
                    </div>
                    
                    <h2 className="text-2xl font-black tracking-tighter leading-none">
                        {user?.firstName || 'Client'} {user?.lastName || ''}
                    </h2>
                    <p className="text-slate-500 text-sm font-bold mt-2">{user?.phone || ''}</p>
                    
                    <button 
                        onClick={() => { setIsMenuOpen(false); navigate('/dashboard/profile'); }} 
                        className="mt-6 flex items-center gap-2 text-[10px] font-black text-wink-yellow uppercase tracking-widest hover:text-white transition-colors"
                    >
                        <Edit2 size={12} /> Modifier Profil
                    </button>
                </div>

                {/* Navigation Items */}
                <nav className="p-8 space-y-2">
                    {menuItems.map((item, idx) => (
                        <button 
                            key={idx} 
                            onClick={() => { navigate(item.path); setIsMenuOpen(false); }}
                            className="w-full flex items-center gap-5 p-4 text-slate-600 hover:bg-slate-50 rounded-[20px] group transition-all"
                        >
                            <item.icon 
                                size={20} 
                                className="text-slate-300 group-hover:text-wink-black transition-colors" 
                            />
                            <span className="font-bold text-sm flex-1 text-left">{item.label}</span>
                            {item.value && (
                                <span className="font-black text-xs text-wink-black bg-wink-yellow/10 px-3 py-1 rounded-full">
                                    {item.value}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>

                {/* Logout Button */}
                <div className="absolute bottom-10 left-8 right-8">
                    <button 
                        onClick={onLogout} 
                        className="w-full flex items-center gap-4 p-4 text-red-500 font-black text-xs uppercase tracking-[2px] hover:bg-red-50 rounded-2xl transition-all"
                    >
                        <LogOut size={18} /> Déconnexion
                    </button>
                </div>
            </aside>

            {/* --- Zone de contenu principal --- */}
            <main className="p-8 pb-32 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                {children}
            </main>
        </div>
    );
}