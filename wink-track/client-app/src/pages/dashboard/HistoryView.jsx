import React, { useState } from 'react';
import { Search, MapPin, Calendar, ArrowRight, User, Phone, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function HistoryView({ rides }) {
    const navigate = useNavigate();
    const [filter, setFilter] = useState('ALL');

    // --- LOGIQUE DE FILTRAGE ---
    const filteredRides = rides.filter(r => {
        if (filter === 'ALL') return true;
        if (filter === 'ACTIVE') return ['SEARCHING', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'PAYMENT_PENDING'].includes(r.status);
        if (filter === 'COMPLETED') return r.status === 'DELIVERED';
        if (filter === 'CANCELLED') return r.status === 'CANCELLED';
        return true;
    });

    // --- FONCTIONS UTILITAIRES ---
    
    // Traduction des statuts
    const getStatusLabel = (status) => {
        const labels = {
            'SEARCHING': 'Recherche Livreur...',
            'PAYMENT_PENDING': 'En attente de paiement',
            'ACCEPTED': 'Livreur en route',
            'PICKED_UP': 'Colis récupéré',
            'IN_TRANSIT': 'En livraison',
            'DELIVERED': 'Livré avec succès',
            'CANCELLED': 'Annulée'
        };
        return labels[status] || status;
    };

    // Couleurs des statuts
    const getStatusStyle = (status) => {
        if (['SEARCHING', 'PAYMENT_PENDING'].includes(status)) return 'bg-wink-yellow/20 text-wink-black animate-pulse';
        if (['ACCEPTED', 'PICKED_UP', 'IN_TRANSIT'].includes(status)) return 'bg-blue-100 text-blue-700';
        if (status === 'DELIVERED') return 'bg-green-100 text-green-700';
        if (status === 'CANCELLED') return 'bg-red-50 text-red-400';
        return 'bg-slate-100 text-slate-500';
    };

    // Actions (Suivre vs Refaire)
    const handleAction = (ride) => {
        const isActive = ['SEARCHING', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'PAYMENT_PENDING'].includes(ride.status);
        
        if (isActive) {
            // Si active -> On va sur le Tracking
            // (Note: Idéalement vers une page /tracking/:id, ici on renvoie vers map ou dashboard)
            navigate('/dashboard'); // Ou une page spécifique de tracking
            alert("Redirection vers le suivi temps réel..."); 
        } else {
            // Si terminée -> On refait la commande
            navigate('/map', { 
                state: { 
                    prefill: {
                        pickupAddress: ride.pickup_address,
                        dropoffAddress: ride.dropoff_address,
                        description: ride.package_desc
                    } 
                } 
            });
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">Historique des courses</h2>
                <p className="text-sm text-slate-500 font-medium">Retrouvez toutes vos livraisons passées et en cours.</p>
            </div>

            {/* Filtres Rapides */}
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {[
                    { key: 'ALL', label: 'Toutes' },
                    { key: 'ACTIVE', label: 'En cours' },
                    { key: 'COMPLETED', label: 'Terminées' },
                    { key: 'CANCELLED', label: 'Annulées' }
                ].map((f) => (
                    <button 
                        key={f.key}
                        onClick={() => setFilter(f.key)}
                        className={`px-5 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filter === f.key ? 'bg-wink-black text-white shadow-lg shadow-wink-black/20' : 'bg-white text-slate-400 border border-slate-100 hover:border-slate-300'}`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            <div className="space-y-5">
                {filteredRides.length > 0 ? filteredRides.map((ride) => (
                    <div key={ride.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group">
                        
                        {/* Header Carte : Date & Statut */}
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full">
                                <Calendar size={12} />
                                {new Date(ride.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' })}
                            </div>
                            <span className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-wide ${getStatusStyle(ride.status)}`}>
                                {getStatusLabel(ride.status)}
                            </span>
                        </div>
                        
                        {/* Adresses */}
                        <div className="space-y-4 mb-6 relative pl-2">
                            {/* Ligne pointillée décorative */}
                            <div className="absolute left-[5px] top-2 bottom-2 w-0.5 bg-slate-100"></div>

                            <div className="flex items-start gap-4 relative z-10">
                                <div className="w-3 h-3 bg-slate-200 rounded-full mt-1 border-2 border-white shadow-sm"></div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">De</p>
                                    <p className="text-sm font-bold text-slate-800 line-clamp-1">{ride.pickup_address}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 relative z-10">
                                <div className="w-3 h-3 bg-wink-yellow rounded-full mt-1 border-2 border-white shadow-sm shadow-wink-yellow/50"></div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Vers</p>
                                    <p className="text-sm font-bold text-slate-900 line-clamp-1">{ride.dropoff_address}</p>
                                </div>
                            </div>
                        </div>

                        {/* Zone Livreur (Si assigné) */}
                        {ride.rider_id && (
                            <div className="mb-6 bg-slate-50 p-4 rounded-2xl flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-300 shadow-sm">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase">Livreur</p>
                                        <p className="text-sm font-bold text-slate-900">{ride.rider_name || "Livreur Wink"}</p>
                                    </div>
                                </div>
                                {ride.rider_phone && (
                                    <a href={`tel:${ride.rider_phone}`} className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 hover:bg-green-200 transition-colors">
                                        <Phone size={18} />
                                    </a>
                                )}
                            </div>
                        )}

                        {/* Footer : Prix & Action */}
                        <div className="flex justify-between items-center pt-5 border-t border-slate-50">
                            <div>
                                <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Total</div>
                                <div className="text-xl font-black text-wink-black">{ride.total_price} <span className="text-xs font-bold text-slate-400">F</span></div>
                            </div>
                            
                            <button 
                                onClick={() => handleAction(ride)}
                                className="flex items-center gap-2 px-5 py-3 bg-wink-black text-white rounded-xl text-xs font-bold uppercase tracking-wide hover:bg-slate-800 transition-colors active:scale-95"
                            >
                                {['SEARCHING', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'PAYMENT_PENDING'].includes(ride.status) ? (
                                    <> <Navigation size={14} className="text-wink-yellow" /> Suivre </>
                                ) : (
                                    <> <ArrowRight size={14} /> Refaire </>
                                )}
                            </button>
                        </div>
                    </div>
                )) : (
                    <div className="py-20 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                            <Search size={24} />
                        </div>
                        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Aucune course trouvée</p>
                    </div>
                )}
            </div>
        </div>
    );
}