import React, { useState, useEffect, useCallback } from 'react';
import { 
    Search, MapPin, Eye, AlertTriangle, 
    Clock, Calendar, DollarSign, X, Motorbike, Loader2
} from 'lucide-react';
import api from '../../services/api';

export default function AdminOrdersPage() {
    // --- ÉTATS RÉELS ---
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({ 
        start: new Date().toISOString().split('T')[0], 
        end: new Date().toISOString().split('T')[0] 
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null); 
    const [assignMode, setAssignMode] = useState(false);
    const [availableRiders, setAvailableRiders] = useState([]);

    // --- 1. CHARGEMENT DES COMMANDES ---
    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            // Utilise la route d'administration /all
            const res = await api.orders.getAll({ 
                start: dateRange.start, 
                end: dateRange.end 
            });
            // Sécurité : Vérifier que res.data.data est bien un tableau
            const ordersData = Array.isArray(res.data?.data) ? res.data.data : [];
            setOrders(ordersData);
        } catch (err) {
            console.error("Erreur chargement commandes:", err);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    }, [dateRange]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // --- 2. LOGIQUE D'ASSIGNATION ---
    const startAssignMode = async () => {
        setAssignMode(true);
        try {
            const res = await api.rider.getAllPositions(); 
            // On filtre les livreurs qui sont ONLINE (is_online=1) et non BUSY
            const ridersData = Array.isArray(res.data?.data) ? res.data.data : [];
            setAvailableRiders(ridersData.filter(r => r.status !== 'BUSY'));
        } catch (err) {
            console.error("Erreur riders:", err);
        }
    };

    const handleAssign = async (rider) => {
        if(window.confirm(`Assigner la course #${selectedOrder.id} à ${rider.first_name} ?`)) {
            try {
                // Route pour forcer l'assignation
                await api.orders.manualAssign(selectedOrder.id, rider.id);
                setAssignMode(false);
                setSelectedOrder(null);
                fetchOrders(); 
                alert("Livreur assigné avec succès.");
            } catch (err) {
                alert("Erreur lors de l'assignation.");
            }
        }
    };

    const getStatusLabel = (status) => {
        const map = {
            'WAITING_DROPOFF': { label: 'Attente Destinataire', color: 'bg-orange-100 text-orange-700' },
            'PAYMENT_PENDING': { label: 'Attente Paiement', color: 'bg-yellow-100 text-yellow-700' },
            'SEARCHING': { label: 'En Recherche', color: 'bg-red-100 text-red-700' },
            'ACCEPTED': { label: 'Assignée', color: 'bg-blue-100 text-blue-700' },
            'PICKED_UP': { label: 'En Transit', color: 'bg-indigo-100 text-indigo-700' },
            'DELIVERED': { label: 'Terminée', color: 'bg-green-100 text-green-700' },
        };
        return map[status] || { label: status, color: 'bg-gray-100' };
    };

    // Filtrage local par recherche
    const filteredOrders = orders.filter(o => 
        o.id.toString().includes(searchTerm) || 
        o.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.pickup_address?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading && orders.length === 0) return (
        <div className="h-screen flex items-center justify-center bg-white">
            <Loader2 className="animate-spin text-wink-yellow" size={40}/>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-slate-50 font-sans notranslate" translate="no">
            
            {/* 1. HEADER & FILTRES */}
            <div className="px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-10 flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h1 className="text-xl font-black text-slate-900 mb-1 uppercase tracking-tight">Supervision des Flux</h1>
                    <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                        <Calendar size={14} className="text-slate-400"/>
                        <input type="date" value={dateRange.start} onChange={(e) => setDateRange({...dateRange, start: e.target.value})} className="bg-transparent text-xs font-bold outline-none"/>
                        <span className="text-slate-300">→</span>
                        <input type="date" value={dateRange.end} onChange={(e) => setDateRange({...dateRange, end: e.target.value})} className="bg-transparent text-xs font-bold outline-none"/>
                    </div>
                </div>

                <div className="relative w-full md:w-72">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                    <input 
                        type="text" placeholder="Rechercher #ID, Client, Adresse..." 
                        className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-slate-900 outline-none text-sm font-medium"
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* 2. TABLEAU DES COMMANDES */}
            <div className="flex-1 overflow-auto px-6">
                {filteredOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                        <AlertTriangle size={48} className="mb-4 opacity-20"/>
                        <p className="font-bold">Aucune commande trouvée sur cette période</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-separate border-spacing-y-3">
                        <thead>
                            <tr className="text-[10px] uppercase font-black text-slate-400 tracking-widest">
                                <th className="pb-2 pl-4">ID</th>
                                <th className="pb-2">Statut</th>
                                <th className="pb-2">Ramassage / Client</th>
                                <th className="pb-2">Destination</th>
                                <th className="pb-2">Livreur</th>
                                <th className="pb-2">Paiement</th>
                                <th className="pb-2 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {filteredOrders.map(order => (
                                <tr key={order.id} className="bg-white border border-slate-100 shadow-sm rounded-2xl hover:shadow-md transition-all group">
                                    <td className="py-5 pl-4 font-black text-slate-900"><span>#{order.id}</span></td>
                                    <td>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${getStatusLabel(order.status).color}`}>
                                            <span>{getStatusLabel(order.status).label}</span>
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex flex-col">
                                            <span className="max-w-[180px] truncate font-bold text-slate-800">{order.recipient_name}</span>
                                            <span className="max-w-[180px] truncate text-[11px] text-slate-400">{order.pickup_address}</span>
                                        </div>
                                    </td>
                                    <td className="max-w-[180px] truncate font-medium text-slate-500">
                                        <span>{order.dropoff_address || 'Attente destination...'}</span>
                                    </td>
                                    <td className="font-bold">
                                        {order.rider_name ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] uppercase font-black">
                                                    {order.rider_name.charAt(0)}
                                                </div>
                                                <span className="text-xs">{order.rider_name}</span>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-red-400 font-black uppercase border border-red-100 px-2 py-0.5 rounded">Recherche...</span>
                                        )}
                                    </td>
                                    <td>
                                        <span className={`font-black ${order.total_price > 0 ? 'text-slate-900' : 'text-slate-300'}`}>
                                            <span>{order.total_price || 0}</span> F
                                        </span>
                                    </td>
                                    <td className="text-center">
                                        <button onClick={() => setSelectedOrder(order)} className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-wink-yellow hover:text-black transition-all">
                                            <Eye size={18}/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* 3. SLIDE-OVER DÉTAILS */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/60 backdrop-blur-sm">
                    <div className="w-full max-w-[450px] h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
                        
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 leading-none mb-1">Détails #{selectedOrder.id}</h2>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                    <Clock size={12}/> {new Date(selectedOrder.created_at).toLocaleString()}
                                </p>
                            </div>
                            <button onClick={() => { setSelectedOrder(null); setAssignMode(false); }} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20}/></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            
                            {/* MINI CARTE / ASSIGNATION */}
                            <div className="rounded-[32px] border border-slate-100 overflow-hidden shadow-sm bg-slate-50">
                                <div className="p-4 flex justify-between items-center border-b border-slate-100">
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                        <MapPin size={14}/> {assignMode ? "Sélectionner un Livreur" : "Itinéraire"}
                                    </span>
                                    {selectedOrder.status === 'SEARCHING' && !assignMode && (
                                        <button onClick={startAssignMode} className="text-[9px] bg-slate-900 text-white px-3 py-1.5 rounded-full font-black uppercase">Assigner Manuel</button>
                                    )}
                                </div>
                                <div className="h-44 bg-slate-200 relative overflow-hidden">
                                    {assignMode ? (
                                        <div className="p-4 space-y-2">
                                            {availableRiders.length === 0 ? (
                                                <p className="text-center text-xs text-slate-500 mt-10 italic">Aucun livreur disponible autour</p>
                                            ) : (
                                                availableRiders.map(r => (
                                                    <button 
                                                        key={r.id} onClick={() => handleAssign(r)}
                                                        className="w-full flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 hover:border-wink-yellow transition-all"
                                                    >
                                                        <div className="flex items-center gap-3 text-left">
                                                            <div className="w-8 h-8 bg-wink-yellow rounded-lg flex items-center justify-center"><Motorbike size={16}/></div>
                                                            <div>
                                                                <p className="text-xs font-black">{r.first_name}</p>
                                                                <p className="text-[10px] text-slate-400">{r.status}</p>
                                                            </div>
                                                        </div>
                                                        <span className="text-[10px] font-black text-blue-600 uppercase">Choisir</span>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full opacity-30">
                                            <MapPin size={32} />
                                            <p className="text-[10px] font-bold uppercase mt-2">Vue satellite indisponible</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* RÉPARTITION FINANCIÈRE */}
                            <div className="bg-slate-900 rounded-[32px] p-6 text-white">
                                <h4 className="text-[10px] font-black uppercase text-slate-500 mb-6 tracking-widest flex items-center gap-2"><DollarSign size={14}/> Finance</h4>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-bold text-slate-400">Net Livreur (90%)</span>
                                        <span className="text-lg font-black text-green-400"><span>{selectedOrder.rider_earnings || 0}</span> F</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-bold text-slate-400">Commission (10%)</span>
                                        <span className="text-lg font-black text-wink-yellow"><span>{selectedOrder.wink_commission || 0}</span> F</span>
                                    </div>
                                    <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                                        <span className="text-sm font-black uppercase">Total Client</span>
                                        <span className="text-3xl font-black"><span>{selectedOrder.total_price || 0}</span> F</span>
                                    </div>
                                </div>
                            </div>

                            {/* OTP SECURITY */}
                            {selectedOrder.status !== 'DELIVERED' && (
                                <div className="bg-red-50 border border-red-100 rounded-[24px] p-5">
                                    <p className="text-[10px] font-black text-red-400 uppercase mb-4 tracking-widest text-center">Protocoles de validation</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="text-center">
                                            <p className="text-[9px] font-black text-red-300 mb-1 uppercase">Ramassage</p>
                                            <p className="text-xl font-black text-red-600 font-mono tracking-tighter">
                                                <span>{selectedOrder.otp_pickup}</span>
                                            </p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[9px] font-black text-red-300 mb-1 uppercase">Livraison</p>
                                            <p className="text-xl font-black text-red-600 font-mono tracking-tighter">
                                                <span>{selectedOrder.otp_delivery}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}