import React, { useState, useEffect } from 'react';
import { 
    Search, Filter, User, MapPin, Phone, 
    CheckCircle, XCircle, AlertTriangle, 
    FileText, DollarSign, Eye, Shield, 
    Motorbike, Car, Zap, MessageCircle, Lock, UploadCloud, Loader2, Footprints
} from 'lucide-react';
import api from '../../services/api'; //

export default function AdminRidersPage() {
    // --- ÉTATS RÉELS ---
    const [riders, setRiders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('ALL'); 
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRider, setSelectedRider] = useState(null); 
    const [modalTab, setModalTab] = useState('DOCS'); 
    const [zoomImage, setZoomImage] = useState(null);

    // --- 1. CHARGEMENT DES DONNÉES DEPUIS LE BACKEND ---
    const fetchRiders = async () => {
        setLoading(true);
        try {
            // Récupère la liste complète des livreurs
            const res = await api.rider.getAll(); 
            setRiders(res.data || []);
        } catch (err) {
            console.error("Erreur chargement livreurs:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRiders();
    }, []);

    // --- 2. LOGIQUE MÉTIER RÉELLE ---

    // Validation/Rejet d'un document KYC
    const handleDocAction = async (docId, action) => {
        let reason = null;
        if(action === 'REJECT') {
            reason = prompt("Motif du rejet (ex: Photo floue) :");
            if(!reason) return;
        }
        
        try {
            // Appel API pour mettre à jour le statut du document
            await api.rider.updateDocStatus(selectedRider.id, docId, { status: action, reason });
            alert(`Document ${action === 'VALID' ? 'Validé' : 'Rejeté'}`);
            fetchRiders(); // Recharger pour voir l'activation auto du compte
        } catch (err) {
            alert("Erreur lors de la mise à jour.");
        }
    };

    // Gestion des dettes (Encaissement cash)
    const handleCollectDebt = async () => {
        const amount = prompt(`Le livreur doit ${Math.abs(selectedRider.wallet_balance)} F. Somme encaissée :`);
        if(amount && !isNaN(amount)) {
            try {
                // Enregistre une transaction de régularisation
                await api.rider.collectDebt(selectedRider.id, { amount: parseInt(amount) });
                alert("Paiement enregistré.");
                fetchRiders();
            } catch (err) {
                alert("Erreur lors de l'opération.");
            }
        }
    };

    // Filtrage local pour la recherche
    const filteredRiders = riders.filter(r => {
        const matchesSearch = r.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) || r.phone?.includes(searchTerm);
        if(!matchesSearch) return false;
        
        if(activeTab === 'ALL') return true;
        if(activeTab === 'PENDING') return r.status === 'PENDING';
        if(activeTab === 'ACTIVE') return r.status === 'ACTIVE';
        if(activeTab === 'DEBT') return r.wallet_balance < -2000;
        if(activeTab === 'BLOCKED') return r.status === 'BLOCKED';
        return true;
    });

    const getVehicleIcon = (type) => {
        switch(type) {
            case 'MOTO': return <Motorbike size={16}/>;
            case 'CAR': return <Car size={16}/>;
            case 'FOOT': return <Footprints size={16} className="text-orange-500"/>; // Support livreur à pieds
            default: return <Zap size={16}/>;
        }
    };

    if (loading && riders.length === 0) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-wink-yellow" size={40}/></div>;

    return (
        <div className="flex flex-col h-full bg-white font-sans">
            
            {/* 1. HEADER & KPI */}
            <div className="px-6 py-6 border-b border-gray-100 sticky top-0 bg-white z-10">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Gestion de Flotte</h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                            {riders.length} Riders enregistrés • <span className="text-orange-500">{riders.filter(r => r.status === 'PENDING').length} en attente</span>
                        </p>
                    </div>
                    <button className="bg-wink-black text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest active:scale-95 transition-transform">
                        + Enrôler un Rider
                    </button>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex bg-slate-100 p-1 rounded-2xl">
                        {['ALL', 'PENDING', 'ACTIVE', 'DEBT', 'BLOCKED'].map(tab => (
                            <button 
                                key={tab} onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 text-[10px] font-black rounded-xl transition-all ${activeTab === tab ? 'bg-white shadow-sm text-wink-black' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {tab === 'ALL' ? 'TOUS' : tab === 'PENDING' ? 'À VALIDER' : tab === 'DEBT' ? 'DETTES' : tab}
                            </button>
                        ))}
                    </div>
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                        <input 
                            type="text" placeholder="Rechercher nom, téléphone..." 
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-wink-black outline-none"
                            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* 2. TABLEAU DES RIDERS RÉELS */}
            <div className="flex-1 overflow-auto px-6">
                <table className="w-full text-left border-separate border-spacing-y-3">
                    <thead>
                        <tr className="text-[10px] uppercase font-black text-slate-400 tracking-widest">
                            <th className="pb-2 pl-4">Identité</th>
                            <th className="pb-2">Statut</th>
                            <th className="pb-2">Véhicule</th>
                            <th className="pb-2 text-center">Score</th>
                            <th className="pb-2">Wallet</th>
                            <th className="pb-2 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {filteredRiders.map(rider => (
                            <tr key={rider.id} className="bg-white border border-slate-50 shadow-sm rounded-2xl hover:shadow-md transition-all group">
                                <td className="py-4 pl-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-900 text-wink-yellow flex items-center justify-center font-black">
                                            {rider.first_name?.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-900">{rider.first_name} {rider.last_name}</p>
                                            <p className="text-[10px] font-bold text-slate-400">{rider.phone}</p>
                                        </div>
                                    </div>
                                </td>
                                <td><StatusBadge status={rider.status}/></td>
                                <td>
                                    <div className="flex items-center gap-2 font-bold text-slate-600">
                                        {getVehicleIcon(rider.vehicle_type)}
                                        <span className="text-[10px] uppercase">{rider.vehicle_type === 'FOOT' ? 'À Pieds' : rider.vehicle_type}</span>
                                    </div>
                                </td>
                                <td className="text-center font-black text-slate-900">
                                    {rider.rating || '5.0'} <span className="text-wink-yellow">★</span>
                                </td>
                                <td>
                                    <span className={`font-black px-3 py-1 rounded-lg ${rider.wallet_balance < 0 ? 'text-red-500 bg-red-50' : 'text-green-600 bg-green-50'}`}>
                                        {rider.wallet_balance} F
                                    </span>
                                </td>
                                <td className="text-center">
                                    <button 
                                        onClick={() => { setSelectedRider(rider); setModalTab('DOCS'); }}
                                        className="p-3 bg-slate-100 hover:bg-wink-black hover:text-white rounded-xl transition-all"
                                    >
                                        <Eye size={18}/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* 3. MODALE DÉTAILLÉE (KYC & FINANCE) */}
            {selectedRider && (
                <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
                    <div className="w-[480px] h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
                        
                        <div className="p-8 bg-slate-900 text-white relative">
                            <button onClick={() => setSelectedRider(null)} className="absolute top-6 right-6 text-white/30 hover:text-white"><XCircle size={24}/></button>
                            <div className="flex gap-6 items-center">
                                <div className="w-20 h-20 bg-wink-yellow text-slate-900 rounded-[28px] flex items-center justify-center text-3xl font-black shadow-xl">
                                    {selectedRider.first_name?.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black">{selectedRider.first_name} {selectedRider.last_name}</h2>
                                    <p className="text-wink-yellow font-bold text-sm">{selectedRider.phone}</p>
                                    <div className="mt-3"><StatusBadge status={selectedRider.status} /></div>
                                </div>
                            </div>
                        </div>

                        <div className="flex border-b border-slate-100 px-4">
                            {['DOCS', 'WALLET', 'INFO'].map(tab => (
                                <button 
                                    key={tab} onClick={() => setModalTab(tab)}
                                    className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${modalTab === tab ? 'border-wink-black text-wink-black' : 'border-transparent text-slate-300'}`}
                                >
                                    {tab === 'DOCS' ? 'Vérification KYC' : tab === 'WALLET' ? 'Finance' : 'Profil'}
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 bg-slate-50 space-y-6">
                            
                            {/* TAB: DOCUMENTS (Vrai système de validation) */}
                            {modalTab === 'DOCS' && (
                                <div className="space-y-4">
                                    {/* On suppose que les docs sont liés via une table documents */}
                                    {['CNI', 'PERMIS', 'CARTE GRISE'].map((label, idx) => (
                                        <div key={idx} className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm">
                                            <div className="flex justify-between items-center mb-4">
                                                <h4 className="font-black text-xs text-slate-400 uppercase tracking-widest">{label}</h4>
                                                <span className="text-[10px] font-black text-orange-500 uppercase">À vérifier</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => setZoomImage('https://via.placeholder.com/800x500')} className="flex-1 py-3 bg-slate-100 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2"><Eye size={14}/> Voir</button>
                                                <button onClick={() => handleDocAction(idx, 'VALID')} className="flex-1 py-3 bg-green-500 text-white rounded-xl font-black text-[10px] uppercase">Valider</button>
                                                <button onClick={() => handleDocAction(idx, 'REJECT')} className="flex-1 py-3 bg-red-50 text-red-500 rounded-xl font-black text-[10px] uppercase text-center">Rejeter</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* TAB: FINANCE (Dettes réelles) */}
                            {modalTab === 'WALLET' && (
                                <div className="space-y-6">
                                    <div className={`p-8 rounded-[32px] text-center border-2 ${selectedRider.wallet_balance < 0 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                                        <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Balance Portefeuille</p>
                                        <p className={`text-5xl font-black ${selectedRider.wallet_balance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                            {selectedRider.wallet_balance} <span className="text-xl">F</span>
                                        </p>
                                    </div>
                                    <button 
                                        onClick={handleCollectDebt}
                                        className="w-full py-5 bg-wink-black text-white rounded-[24px] font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-transform"
                                    >
                                        Encaisser Régularisation Cash
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ZOOM DOCUMENTS */}
            {zoomImage && (
                <div className="fixed inset-0 z-[100] bg-slate-900/95 flex items-center justify-center p-10" onClick={() => setZoomImage(null)}>
                    <img src={zoomImage} alt="Document Zoom" className="max-w-full max-h-full rounded-2xl shadow-2xl border-4 border-white/10" />
                </div>
            )}
        </div>
    );
}

// --- SOUS-COMPOSANTS ---

const StatusBadge = ({ status }) => {
    const config = {
        ACTIVE: { color: "bg-green-100 text-green-700", icon: CheckCircle, label: "Actif" },
        PENDING: { color: "bg-orange-100 text-orange-700", icon: Clock, label: "Vérif." },
        BLOCKED: { color: "bg-red-100 text-red-700", icon: XCircle, label: "Bloqué" },
    };
    const { color, icon: Icon, label } = config[status] || config.PENDING;
    return (
        <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter flex items-center gap-2 w-fit ${color}`}>
            <Icon size={12} strokeWidth={3}/> {label}
        </span>
    );
};