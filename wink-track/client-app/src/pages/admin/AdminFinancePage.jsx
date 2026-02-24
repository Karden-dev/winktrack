import React, { useState, useEffect } from 'react';
import { 
    TrendingUp, TrendingDown, DollarSign, Wallet, 
    AlertTriangle, CheckCircle, Clock, ArrowUpRight, 
    ArrowDownLeft, Search, Filter, Download, Loader2 
} from 'lucide-react';
import api from '../../services/api'; //

export default function AdminFinancePage() {
    const [activeTab, setActiveTab] = useState('WITHDRAWALS'); 
    const [stats, setStats] = useState({ totalRevenue: 0, netProfit: 0, cashInHands: 0, pendingPayouts: 0 });
    const [withdrawals, setWithdrawals] = useState([]);
    const [debts, setDebts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- 1. CHARGEMENT DES DONNÉES FINANCIÈRES RÉELLES ---
    const fetchFinanceData = async () => {
        setLoading(true);
        try {
            // Ces routes agrègent les données des tables 'orders' et 'transactions'
            const [statsRes, withdrawalsRes, debtsRes, historyRes] = await Promise.all([
                api.auth.getFinanceStats(),     // KPI Globaux
                api.auth.getPendingPayouts(),   // Retraits en attente
                api.auth.getRiderDebts(),       // Livreurs endettés
                api.auth.getAllTransactions()   // Journal complet
            ]);

            setStats(statsRes.data);
            setWithdrawals(withdrawalsRes.data);
            setDebts(debtsRes.data);
            setTransactions(historyRes.data);
        } catch (err) {
            console.error("Erreur Finance:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFinanceData();
    }, []);

    // --- 2. ACTIONS DE TRÉSORERIE ---

    const handleApproveWithdrawal = async (withdrawalId) => {
        if(window.confirm("Confirmer le virement Mobile Money vers le livreur ?")) {
            try {
                // Déclenche le transfert via Campay ou marque comme payé
                await api.auth.processPayout(withdrawalId);
                alert("Virement effectué et débité du compte Wink.");
                fetchFinanceData();
            } catch (err) {
                alert("Erreur lors du virement.");
            }
        }
    };

    const handleCollectDebt = async (riderId, amount) => {
        if(window.confirm(`Confirmer la perception de ${amount} F en cash ?`)) {
            try {
                // Remet le wallet du livreur à zéro
                await api.rider.collectDebt(riderId, { amount });
                alert("Dette encaissée. Trésorerie mise à jour.");
                fetchFinanceData();
            } catch (err) {
                alert("Erreur de mise à jour.");
            }
        }
    };

    if (loading && transactions.length === 0) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-wink-yellow" size={40}/></div>;

    return (
        <div className="flex flex-col h-full bg-white font-sans">
            
            {/* 1. HEADER & KPI (Vue d'ensemble des revenus) */}
            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Trésorerie Centrale</h1>
                    <button className="flex items-center gap-2 px-4 py-2 bg-wink-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">
                        <Download size={14}/> Exporter Rapport PDF
                    </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <KpiCard 
                        label="Volume d'Affaires" amount={stats.totalRevenue} 
                        icon={TrendingUp} color="text-slate-900" sub="Total facturé clients"
                    />
                    <KpiCard 
                        label="Profit Net Wink" amount={stats.netProfit} 
                        icon={DollarSign} color="text-green-600" bg="bg-green-50/50" sub="Commissions encaissées"
                    />
                    <KpiCard 
                        label="Dettes Cash" amount={stats.cashInHands} 
                        icon={AlertTriangle} color="text-red-600" bg="bg-red-50/50" sub="À récupérer (Livreurs)"
                    />
                    <KpiCard 
                        label="Payouts en attente" amount={stats.pendingPayouts} 
                        icon={Wallet} color="text-blue-600" bg="bg-blue-50/50" sub="Demandes de retraits"
                    />
                </div>
            </div>

            {/* 2. NAVIGATION PAR ONGLETS */}
            <div className="px-8 border-b border-slate-100 bg-white sticky top-0 z-10">
                <div className="flex gap-8">
                    <TabButton 
                        active={activeTab === 'WITHDRAWALS'} onClick={() => setActiveTab('WITHDRAWALS')} 
                        label="Demandes de Retrait" count={withdrawals.filter(w => w.status === 'PENDING').length}
                    />
                    <TabButton 
                        active={activeTab === 'DEBTS'} onClick={() => setActiveTab('DEBTS')} 
                        label="Recouvrement Cash" count={debts.length} color="red"
                    />
                    <TabButton 
                        active={activeTab === 'HISTORY'} onClick={() => setActiveTab('HISTORY')} 
                        label="Journal Global" 
                    />
                </div>
            </div>

            {/* 3. CONTENU DYNAMIQUE */}
            <div className="flex-1 overflow-y-auto p-8">
                
                {/* --- DEMANDES DE RETRAIT (PAYOUTS) --- */}
                {activeTab === 'WITHDRAWALS' && (
                    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-400 font-black text-[10px] uppercase tracking-widest">
                                <tr>
                                    <th className="px-8 py-5">Livreur</th>
                                    <th className="px-8 py-5">Montant Net</th>
                                    <th className="px-8 py-5">Méthode</th>
                                    <th className="px-8 py-5">Date</th>
                                    <th className="px-8 py-5 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 font-medium">
                                {withdrawals.map(w => (
                                    <tr key={w.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-5">
                                            <p className="font-black text-slate-900">{w.rider_name}</p>
                                            <p className="text-[10px] text-slate-400">{w.phone}</p>
                                        </td>
                                        <td className="px-8 py-5 font-black text-lg text-slate-900">{w.amount?.toLocaleString()} F</td>
                                        <td className="px-8 py-5">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black ${w.method === 'OM' ? 'bg-orange-100 text-orange-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                                {w.method} MONEY
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-slate-400 text-xs">{new Date(w.created_at).toLocaleDateString()}</td>
                                        <td className="px-8 py-5 text-right">
                                            {w.status === 'PENDING' ? (
                                                <button 
                                                    onClick={() => handleApproveWithdrawal(w.id)}
                                                    className="bg-wink-black text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                                                >
                                                    Valider Virement
                                                </button>
                                            ) : <span className="text-green-500 font-black text-[10px] uppercase">Effectué</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* --- RECOUVREMENT CASH (DETTES) --- */}
                {activeTab === 'DEBTS' && (
                    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-red-50/50 text-red-400 font-black text-[10px] uppercase tracking-widest">
                                <tr>
                                    <th className="px-8 py-5">Livreur</th>
                                    <th className="px-8 py-5">Dette Liquide</th>
                                    <th className="px-8 py-5">Dernière Sync</th>
                                    <th className="px-8 py-5 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 font-medium">
                                {debts.map(d => (
                                    <tr key={d.id} className="hover:bg-red-50/30 transition-colors">
                                        <td className="px-8 py-5 font-black text-slate-900">{d.first_name} {d.last_name}</td>
                                        <td className="px-8 py-5 font-black text-xl text-red-600">{Math.abs(d.wallet_balance).toLocaleString()} F</td>
                                        <td className="px-8 py-5 text-slate-400 text-xs uppercase">Aujourd'hui</td>
                                        <td className="px-8 py-5 text-right">
                                            <button 
                                                onClick={() => handleCollectDebt(d.id, Math.abs(d.wallet_balance))}
                                                className="bg-red-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95"
                                            >
                                                Encaisser Cash
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* --- JOURNAL DES TRANSACTIONS --- */}
                {activeTab === 'HISTORY' && (
                    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 font-black text-[10px] uppercase tracking-widest text-slate-400">
                                <tr>
                                    <th className="px-8 py-5">Type</th>
                                    <th className="px-8 py-5">Description</th>
                                    <th className="px-8 py-5 text-right">Montant</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {transactions.map(t => (
                                    <tr key={t.id} className="hover:bg-slate-50/30">
                                        <td className="px-8 py-5">
                                            <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${t.type === 'CREDIT' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {t.type}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 font-bold text-slate-800">{t.description}</td>
                                        <td className={`px-8 py-5 text-right font-black ${t.type === 'CREDIT' ? 'text-green-600' : 'text-slate-900'}`}>
                                            {t.type === 'CREDIT' ? '+' : '-'}{t.amount} F
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

// --- SOUS-COMPOSANTS ---

const KpiCard = ({ label, amount, icon: Icon, color, bg = "bg-white", sub }) => (
    <div className={`p-6 rounded-[28px] border border-slate-100 shadow-sm transition-transform hover:scale-[1.02] ${bg}`}>
        <div className="flex justify-between items-start mb-4">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{label}</p>
            <div className={`p-2.5 rounded-2xl bg-white shadow-sm ${color}`}>
                <Icon size={20} />
            </div>
        </div>
        <p className={`text-3xl font-black ${color}`}>{amount?.toLocaleString()} <span className="text-sm">F</span></p>
        <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tighter italic opacity-60">{sub}</p>
    </div>
);

const TabButton = ({ active, onClick, label, count, color = "blue" }) => (
    <button 
        onClick={onClick}
        className={`pb-5 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-3 ${
            active 
            ? `border-wink-black text-slate-900` 
            : 'border-transparent text-slate-300 hover:text-slate-500'
        }`}
    >
        {label}
        {count > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-white text-[9px] ${active ? 'bg-red-500' : 'bg-slate-300'}`}>
                {count}
            </span>
        )}
    </button>
);