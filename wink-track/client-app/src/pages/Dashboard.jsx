import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Menu, X, Zap, Wallet, MapPin, Clock, 
    Shield, Gift, Info, HelpCircle, LogOut,
    User, ArrowUpRight, Phone, CreditCard, Edit2, Star
} from 'lucide-react';
import WinkButton from '../components/WinkButton';
import WinkInput from '../components/WinkInput';
import api from '../services/api';

export default function Dashboard() {
    const navigate = useNavigate();
    
    // Récupération du numéro stocké (simulé pour l'instant via localStorage)
    // Assure-toi de stocker ce numéro lors du Login dans Home.jsx : localStorage.setItem('wink_phone', phone);
    const myPhone = localStorage.getItem('wink_phone');

    // --- ÉTATS ---
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [selectedRide, setSelectedRide] = useState(null); // Course sélectionnée (Modal)
    const [isProfileOpen, setIsProfileOpen] = useState(false); // Profil (Modal)
    
    const [user, setUser] = useState({
        firstName: "Client",
        lastName: "",
        phone: myPhone || "",
        paymentNumber: "", 
        balance: 0,
    });

    const [recentRides, setRecentRides] = useState([]);

    // --- CHARGEMENT DES DONNÉES ---
    useEffect(() => {
        if (!myPhone) {
            // Si pas connecté, retour accueil
            navigate('/'); 
            return;
        }

        const loadData = async () => {
            try {
                // 1. Charger Profil
                const profileData = await api.getProfile(myPhone);
                setUser(prev => ({ ...prev, ...profileData }));

                // 2. Charger Historique
                const historyData = await api.getHistory(myPhone);
                if (historyData.success) {
                    setRecentRides(historyData.history);
                }
            } catch (error) {
                console.error("Erreur chargement dashboard:", error);
            }
        };

        loadData();
    }, [myPhone, navigate]);

    // --- ACTIONS ---
    
    // Refaire une course
    const handleReorder = (ride) => {
        // On navigue vers la carte avec les données pré-remplies
        // Il faudra adapter MapPage.jsx pour lire "location.state.prefill"
        navigate('/map', { 
            state: { 
                prefill: {
                    description: ride.dest, // On utilise la destination comme desc pour l'instant
                    // Idéalement il faudrait les coordonnées GPS exactes stockées dans l'historique
                } 
            } 
        });
    };

    // --- COMPOSANT MODAL DÉTAILS COURSE ---
    const RideDetailModal = () => {
        if (!selectedRide) return null;
        const ride = selectedRide;

        return (
            <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedRide(null)}></div>
                
                <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-6 relative z-10 animate-fade-in-up max-h-[90vh] overflow-y-auto">
                    <button onClick={() => setSelectedRide(null)} className="absolute top-4 right-4 text-gray-400 hover:text-black bg-gray-100 rounded-full p-1">
                        <X size={20} />
                    </button>

                    <h2 className="text-xl font-black mb-1">Détails de la course</h2>
                    <p className="text-xs text-gray-400 mb-6">ID #{ride.id} • {ride.date}</p>

                    {/* Carte Visuelle (Simulée) */}
                    <div className="h-32 bg-gray-100 rounded-xl mb-6 flex items-center justify-center border border-gray-200 relative overflow-hidden">
                        <div className="absolute inset-0 opacity-20 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg')] bg-cover"></div>
                        <div className="flex items-center gap-2 relative z-10 opacity-50">
                            <MapPin size={16} /> Visualisation Trajet
                        </div>
                    </div>

                    {/* Trajet */}
                    <div className="space-y-4 mb-6">
                        <div className="flex gap-3">
                            <div className="flex flex-col items-center pt-1">
                                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                                <div className="w-0.5 h-full bg-gray-200 my-1"></div>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-gray-400">Départ</p>
                                <p className="text-sm font-bold">{ride.pickup}</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="flex flex-col items-center">
                                <div className="w-2 h-2 bg-wink-black rounded-full"></div>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-gray-400">Destination / Colis</p>
                                <p className="text-sm font-bold">{ride.dest}</p>
                            </div>
                        </div>
                    </div>

                    {/* Prix & Actions */}
                    <div className="flex justify-between items-center border-t border-gray-100 pt-4 mb-6">
                        <span className="text-sm text-gray-500">Montant total</span>
                        <span className="text-2xl font-black text-wink-black">{ride.price} F</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button className="py-3 rounded-xl font-bold text-sm border border-gray-200 text-gray-500 hover:bg-gray-50">
                            Signaler
                        </button>
                        <WinkButton variant="action" onClick={() => handleReorder(ride)}>
                            Refaire <ArrowUpRight size={18} />
                        </WinkButton>
                    </div>
                </div>
            </div>
        );
    };

    // --- COMPOSANT MODAL PROFIL ---
    const ProfileModal = () => {
        if (!isProfileOpen) return null;
        
        const [formData, setFormData] = useState({ ...user });
        const [loading, setLoading] = useState(false);

        const handleSave = async () => {
            setLoading(true);
            try {
                await api.updateProfile(user.phone, {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    paymentNumber: formData.paymentNumber
                });
                // Mise à jour locale
                setUser(formData);
                setIsProfileOpen(false);
            } catch (err) {
                alert("Erreur lors de la mise à jour");
            } finally {
                setLoading(false);
            }
        };

        return (
            <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsProfileOpen(false)}></div>
                
                <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-6 relative z-10 animate-fade-in-up">
                    <button onClick={() => setIsProfileOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black">
                        <X size={24} />
                    </button>

                    <h2 className="text-xl font-black mb-6 flex items-center gap-2">
                        <User className="text-wink-yellow" /> Mon Profil
                    </h2>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <WinkInput 
                                label="Prénom" 
                                value={formData.firstName}
                                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                            />
                            <WinkInput 
                                label="Nom" 
                                value={formData.lastName}
                                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                            />
                        </div>

                        <WinkInput 
                            label="Numéro WhatsApp" 
                            value={formData.phone}
                            icon={Phone}
                            disabled={true} 
                        />

                        <div className="pt-4 border-t border-gray-100">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Paiement</p>
                            <WinkInput 
                                label="Numéro Mobile Money par défaut" 
                                value={formData.paymentNumber}
                                onChange={(e) => setFormData({...formData, paymentNumber: e.target.value})}
                                icon={CreditCard}
                                placeholder="699 00 00 00"
                            />
                            <p className="text-[10px] text-gray-400 mt-1">Ce numéro sera utilisé pour payer vos courses plus rapidement.</p>
                        </div>

                        <div className="pt-4">
                            <WinkButton variant="action" onClick={handleSave} isLoading={loading}>
                                Enregistrer
                            </WinkButton>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 relative overflow-x-hidden">
            
            {/* 1. HEADER */}
            <div className="bg-white px-6 py-5 flex justify-between items-center sticky top-0 z-30 shadow-sm/50 backdrop-blur-md bg-white/90">
                <button 
                    onClick={() => setIsMenuOpen(true)}
                    className="p-2 -ml-2 text-wink-black hover:bg-gray-100 rounded-full transition-colors"
                >
                    <Menu size={28} strokeWidth={2.5} />
                </button>

                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-wink-yellow rounded-full animate-pulse"></div>
                    <span className="font-black text-lg tracking-tight">WINK</span>
                </div>

                <div className="w-10"></div>
            </div>

            {/* 2. CONTENU PRINCIPAL */}
            <div className="p-6 space-y-8 pb-32">

                {/* Bienvenue */}
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Bonjour, {user.firstName} 👋</h1>
                    <p className="text-gray-500 text-sm">Où envoyons-nous un colis ?</p>
                </div>

                {/* Bouton Commander */}
                <button 
                    onClick={() => navigate('/map')}
                    className="w-full bg-wink-yellow text-wink-black h-24 rounded-2xl font-black text-xl shadow-lg shadow-yellow-500/20 active:scale-[0.98] transition-all flex items-center justify-between px-6 group relative overflow-hidden"
                >
                    <div className="absolute top-0 -left-full w-full h-full bg-white/20 skew-x-12 group-hover:animate-shine"></div>
                    <div className="flex items-center gap-5 relative z-10">
                        <div className="w-12 h-12 bg-black/10 rounded-full flex items-center justify-center">
                            <Zap size={28} className="fill-wink-black" />
                        </div>
                        <div className="text-left leading-tight">
                            <span className="block tracking-tight">Nouvelle Course</span>
                            <span className="text-[10px] font-medium opacity-60 uppercase tracking-wider">Wink Express</span>
                        </div>
                    </div>
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center group-hover:translate-x-1 transition-transform">
                        <ArrowUpRight size={24} />
                    </div>
                </button>

                {/* Historique Récent */}
                <div>
                    <div className="flex justify-between items-end mb-4">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Récent</h3>
                        <button className="text-xs font-bold text-wink-black underline">Tout voir</button>
                    </div>

                    <div className="space-y-3">
                        {recentRides.length === 0 ? (
                            <p className="text-sm text-gray-400 italic text-center py-4">Aucune course récente.</p>
                        ) : (
                            recentRides.map((ride) => (
                                <div 
                                    key={ride.id} 
                                    onClick={() => setSelectedRide(ride)}
                                    className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between active:scale-[0.99] transition-transform cursor-pointer hover:border-wink-yellow/50"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${ride.status === 'ANNULÉ' ? 'bg-red-50 text-red-400' : 'bg-gray-100 text-gray-600'}`}>
                                            <MapPin size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-900 truncate max-w-[150px]">{ride.dest}</p>
                                            <p className="text-xs text-gray-400">{ride.date}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black">{ride.price} F</p>
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${ride.status === 'ANNULÉ' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>
                                            {ride.status}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Espace Promo */}
                <div className="h-20 border-2 border-dashed border-gray-100 rounded-xl flex items-center justify-center text-gray-300 text-xs font-medium">
                    Espace Publicitaire
                </div>
            </div>

            {/* 3. MENU LATÉRAL (Drawer) */}
            {isMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity"
                    onClick={() => setIsMenuOpen(false)}
                ></div>
            )}

            <div className={`fixed top-0 left-0 bottom-0 w-[85%] max-w-xs bg-white z-50 transform transition-transform duration-300 ease-out shadow-2xl ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                
                {/* Header Menu */}
                <div className="bg-wink-black text-white p-6 pb-6">
                    <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 bg-white/10 rounded-full border border-wink-yellow flex items-center justify-center text-xl font-bold">
                            {user.firstName ? user.firstName[0] : 'U'}
                        </div>
                        <button onClick={() => setIsMenuOpen(false)} className="text-gray-400 hover:text-white">
                            <X size={24} />
                        </button>
                    </div>
                    <h2 className="text-xl font-bold">{user.firstName} {user.lastName}</h2>
                    <p className="text-xs text-gray-400">{user.phone}</p>
                    
                    <button 
                        onClick={() => { setIsMenuOpen(false); setIsProfileOpen(true); }}
                        className="mt-4 flex items-center gap-2 text-xs font-bold text-wink-yellow hover:text-white transition-colors"
                    >
                        <Edit2 size={12} /> Modifier mon profil
                    </button>
                </div>

                {/* Solde */}
                <div className="mx-4 -mt-4 mb-4 bg-white rounded-xl shadow-lg border border-gray-100 p-4 relative z-10">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Mon Solde</span>
                        <Wallet size={16} className="text-wink-yellow" />
                    </div>
                    <div className="text-2xl font-black text-wink-black">{user.balance.toLocaleString()} F</div>
                </div>

                {/* Liens Menu */}
                <div className="px-2 space-y-1">
                    <button className="w-full flex items-center gap-4 p-4 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors text-left">
                        <MapPin size={20} className="text-gray-400" />
                        <span className="font-medium text-sm flex-1">Mes Adresses</span>
                    </button>
                    <button className="w-full flex items-center gap-4 p-4 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors text-left">
                        <Clock size={20} className="text-gray-400" />
                        <span className="font-medium text-sm flex-1">Historique Complet</span>
                    </button>
                    <button className="w-full flex items-center gap-4 p-4 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors text-left">
                        <HelpCircle size={20} className="text-gray-400" />
                        <span className="font-medium text-sm flex-1">Assistance</span>
                    </button>
                    <button className="w-full flex items-center gap-4 p-4 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors text-left">
                        <Gift size={20} className="text-gray-400" />
                        <span className="font-medium text-sm flex-1">Promos</span>
                    </button>
                    <button className="w-full flex items-center gap-4 p-4 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors text-left">
                        <Info size={20} className="text-gray-400" />
                        <span className="font-medium text-sm flex-1">À propos</span>
                    </button>
                </div>

                {/* Footer */}
                <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-100 bg-gray-50">
                    <button 
                        onClick={() => {
                            localStorage.removeItem('wink_phone'); // Déconnexion simple
                            navigate('/');
                        }}
                        className="flex items-center gap-3 text-red-500 text-sm font-bold w-full p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <LogOut size={18} /> Déconnexion
                    </button>
                </div>
            </div>

            {/* MODALES */}
            <RideDetailModal />
            <ProfileModal />

        </div>
    );
}