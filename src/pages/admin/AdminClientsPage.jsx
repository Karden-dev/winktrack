import React, { useState, useEffect } from 'react';
import { 
    Search, Phone, MessageCircle, Ban, Unlock, 
    Eye, XCircle, FileText, Wallet, ArrowUpRight, 
    ArrowDownLeft, History, CreditCard, Loader2, UserCheck
} from 'lucide-react';
import api from '../../services/api'; //

export default function AdminClientsPage() {
    // --- ÉTATS RÉELS ---
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClient, setSelectedClient] = useState(null);
    const [activeTab, setActiveTab] = useState('INFO'); 

    // --- 1. CHARGEMENT DES CLIENTS ---
    const fetchClients = async () => {
        setLoading(true);
        try {
            // Récupère la liste des clients depuis la table 'clients'
            const res = await api.auth.getAllClients(); 
            setClients(res.data || []);
        } catch (err) {
            console.error("Erreur base clients:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    // --- 2. LOGIQUE MÉTIER RÉELLE ---
    
    const handleBlockClient = async () => {
        const isBlocked = selectedClient.status === 'BLOCKED' || selectedClient.status === 'SUSPENDED';
        const action = isBlocked ? 'ACTIVE' : 'SUSPENDED';
        
        if(window.confirm(`Voulez-vous vraiment ${isBlocked ? 'RÉACTIVER' : 'SUSPENDRE'} ce client ?`)) {
            try {
                // Mise à jour du statut dans la DB
                await api.auth.updateUserStatus(selectedClient.id, { status: action, type: 'CLIENT' });
                alert("Statut mis à jour.");
                fetchClients();
                setSelectedClient(null);
            } catch (err) {
                alert("Erreur lors de l'opération.");
            }
        }
    };

    const handleWalletAction = async (action) => {
        const isWithdraw = action === 'WITHDRAW';
        const amountStr = prompt(`Montant à ${isWithdraw ? 'débiter (Retrait/Remboursement)' : 'créditer (Recharge/Bonus)'} :`);
        
        if (amountStr && !isNaN(amountStr)) {
            try {
                // Enregistre une transaction réelle et met à jour le solde
                await api.auth.adjustClientWallet(selectedClient.id, {
                    amount: parseInt(amountStr),
                    type: isWithdraw ? 'DEBIT' : 'CREDIT'
                });
                alert("Portefeuille mis à jour.");
                fetchClients();
                setSelectedClient(null);
            } catch (err) {
                alert("Erreur transactionnelle.");
            }
        }
    };

    const filteredClients = clients.filter(c => 
        c.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.phone?.includes(searchTerm)
    );

    if (loading && clients.length === 0) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-wink-yellow" size={40}/></div>;

    return (
        <div className="flex flex-col h-full bg-white font-sans">
            
            {/* 1. HEADER DYNAMIQUE */}
            <div className="px-8 py-6 border-b border-slate-100 sticky top-0 bg-white z-10 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Base de Données Clients</h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                        {clients.length} Utilisateurs • <span className="text-green-500">{clients.filter(c => c.status === 'ACTIVE').length} Actifs</span>
                    </p>
                </div>
                <div className="relative w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                    <input 
                        type="text" placeholder="Nom, Téléphone, Email..." 
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-wink-black outline-none shadow-inner"
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* 2. GRID DES CLIENTS */}
            <div className="flex-1 overflow-auto px-8">
                <table className="w-full text-left border-separate border-spacing-y-3">
                    <thead>
                        <tr className="text-[10px] uppercase font-black text-slate-400 tracking-widest">
                            <th className="pb-2 pl-4">Client</th>
                            <th className="pb-2">Contact / ID</th>
                            <th className="pb-2">Statut</th>
                            <th className="pb-2 text-center">Wallet</th>
                            <th className="pb-2 text-right">Inscrit le</th>
                            <th className="pb-2 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {filteredClients.map(client => (
                            <tr key={client.id} className="bg-white border border-slate-50 shadow-sm rounded-2xl hover:shadow-md transition-all group">
                                <td className="py-5 pl-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-white ${client.wallet_balance > 10000 ? 'bg-wink-black' : 'bg-slate-200 text-slate-500'}`}>
                                            {client.first_name?.charAt(0) || <UserCheck size={18}/>}
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-900">{client.first_name} {client.last_name || ''}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Client #{client.id}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="font-bold text-slate-600">
                                    <div className="flex flex-col">
                                        <span>{client.phone}</span>
                                        <span className="text-[10px] text-slate-300 font-medium">{client.email || 'Pas d\'email'}</span>
                                    </div>
                                </td>
                                <td>
                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                                        client.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                        {client.status === 'ACTIVE' ? 'Actif' : 'Bloqué'}
                                    </span>
                                </td>
                                <td className="text-center font-black">
                                    <span className={client.wallet_balance > 0 ? 'text-green-600' : 'text-slate-400'}>
                                        {client.wallet_balance?.toLocaleString()} F
                                    </span>
                                </td>
                                <td className="text-right font-bold text-slate-400 text-xs uppercase">
                                    {new Date(client.created_at).toLocaleDateString()}
                                </td>
                                <td className="text-center">
                                    <button onClick={() => setSelectedClient(client)} className="p-3 bg-slate-100 hover:bg-wink-black hover:text-white rounded-xl transition-all">
                                        <Eye size={18}/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* 3. MODALE CRM & FINANCE CLIENT */}
            {selectedClient && (
                <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
                    <div className="w-[480px] h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
                        
                        {/* Header Client */}
                        <div className="p-8 bg-slate-900 text-white relative">
                            <button onClick={() => setSelectedClient(null)} className="absolute top-6 right-6 text-white/30 hover:text-white transition-colors"><XCircle size={24}/></button>
                            <div className="flex gap-6 items-center">
                                <div className="w-20 h-20 bg-wink-yellow text-slate-900 rounded-[28px] flex items-center justify-center text-3xl font-black shadow-xl">
                                    {selectedClient.first_name?.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black leading-tight">{selectedClient.first_name} {selectedClient.last_name || ''}</h2>
                                    <p className="text-wink-yellow font-bold text-sm tracking-widest">{selectedClient.phone}</p>
                                    <div className="mt-3 flex gap-2">
                                        <span className="bg-white/10 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border border-white/10">ID: {selectedClient.id}</span>
                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${selectedClient.status === 'ACTIVE' ? 'bg-green-500 text-black' : 'bg-red-500 text-white'}`}>{selectedClient.status}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex border-b border-slate-100 px-4">
                            {['INFO', 'HISTORY', 'NOTES'].map(tab => (
                                <button 
                                    key={tab} onClick={() => setActiveTab(tab)}
                                    className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === tab ? 'border-wink-black text-wink-black' : 'border-transparent text-slate-300'}`}
                                >
                                    {tab === 'INFO' ? 'Portefeuille' : tab === 'HISTORY' ? 'Commandes' : 'Notes'}
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 bg-slate-50 space-y-8">
                            
                            {/* TAB 1: GESTION DU WALLET RÉEL */}
                            {activeTab === 'INFO' && (
                                <div className="space-y-6">
                                    <div className="bg-white rounded-[32px] p-8 text-center border border-slate-100 shadow-sm relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 blur-3xl rounded-full"></div>
                                        <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Solde Wallet Client</p>
                                        <p className={`text-5xl font-black ${selectedClient.wallet_balance > 0 ? 'text-green-600' : 'text-slate-300'}`}>
                                            {selectedClient.wallet_balance?.toLocaleString()} <span className="text-xl">F</span>
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <button 
                                            onClick={() => handleWalletAction('DEPOSIT')}
                                            className="py-4 bg-wink-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl"
                                        >
                                            <ArrowDownLeft size={16} className="text-green-400"/> Recharger
                                        </button>
                                        <button 
                                            onClick={() => handleWalletAction('WITHDRAW')}
                                            className="py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
                                        >
                                            <ArrowUpRight size={16} className="text-red-400"/> Rembourser
                                        </button>
                                    </div>

                                    <div className="space-y-3 pt-6">
                                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Actions Rapides</h4>
                                        <a href={`tel:${selectedClient.phone}`} className="w-full py-4 bg-white border border-slate-200 rounded-2xl font-bold text-xs flex items-center justify-center gap-3 text-slate-700 shadow-sm hover:bg-slate-50">
                                            <Phone size={16} className="text-wink-black"/> Appel Direct GSM
                                        </a>
                                        <button 
                                            onClick={handleBlockClient}
                                            className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 border transition-all ${
                                                selectedClient.status === 'ACTIVE' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-green-50 border-green-100 text-green-600'
                                            }`}
                                        >
                                            {selectedClient.status === 'ACTIVE' ? <><Ban size={16}/> Suspendre le compte</> : <><Unlock size={16}/> Activer le compte</>}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: HISTORIQUE RÉEL */}
                            {activeTab === 'HISTORY' && (
                                <div className="space-y-4">
                                    {/* On suppose ici une liste de commandes liées */}
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dernières Activités</p>
                                    <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center">
                                        <History size={32} className="text-slate-200 mx-auto mb-3" />
                                        <p className="text-xs text-slate-400 font-bold uppercase">Aucune commande récente</p>
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: NOTES INTERNES */}
                            {activeTab === 'NOTES' && (
                                <div className="space-y-4">
                                    <textarea 
                                        className="w-full bg-white border border-slate-200 rounded-[24px] p-5 text-sm font-medium focus:ring-2 focus:ring-wink-black outline-none min-h-[150px] shadow-inner"
                                        placeholder="Note confidentielle sur ce client..."
                                    ></textarea>
                                    <button className="w-full py-4 bg-wink-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">Enregistrer Note</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}