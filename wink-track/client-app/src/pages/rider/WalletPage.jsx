import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
    Wallet, ArrowUpRight, ArrowDownLeft, History, Zap, 
    Copy, CheckCircle, Loader2, AlertCircle, Lock, AlertTriangle 
} from 'lucide-react';
import api from '../../services/api';

export default function WalletPage() {
    const { darkMode } = useOutletContext();
    
    // États pour les données réelles
    const [walletData, setWalletData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);

    // --- 1. CHARGEMENT DES DONNÉES DEPUIS LE BACKEND ---
    useEffect(() => {
        const fetchWalletData = async () => {
            setIsLoading(true);
            try {
                // Récupère le solde, le statut KYC et les transactions réelles
                const res = await api.rider.getWallet(); 
                setWalletData(res.data);
                setError(null);
            } catch (err) {
                console.error("Erreur Wallet:", err);
                setError("Impossible de charger votre solde.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchWalletData();
    }, []);

    // --- 2. ACTIONS ---
    const handleCopyCode = () => {
        if (!walletData?.referralCode) return;
        navigator.clipboard.writeText(walletData.referralCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleWithdraw = () => {
        if (walletData?.status !== 'VERIFIED' && walletData?.status !== 'ACTIVE') {
            return; // Sécurité supplémentaire
        }
        alert(`Demande de retrait vers le numéro ${walletData?.paymentNumber || 'enregistré'} envoyée à l'administration.`);
    };

    // Vérification du statut pour le blocage des retraits
    const isVerified = walletData?.status === 'VERIFIED' || walletData?.status === 'ACTIVE';

    // Styles dynamiques
    const cardClass = darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100 shadow-sm";
    const textMuted = darkMode ? "text-gray-400" : "text-gray-500";

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <Loader2 className="animate-spin text-wink-yellow mb-4" size={40} />
            <p className={textMuted + " font-bold uppercase text-[10px] tracking-widest"}>Accès à votre coffre-fort...</p>
        </div>
    );

    if (error) return (
        <div className="p-10 text-center space-y-4">
            <AlertCircle size={48} className="text-red-500 mx-auto" />
            <p className="text-gray-500 font-bold">{error}</p>
            <button onClick={() => window.location.reload()} className="text-wink-yellow font-black text-xs uppercase tracking-widest">Réessayer</button>
        </div>
    );

    return (
        <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 bg-transparent">
            
            {/* 1. HEADER & SOLDE RÉEL (Depuis la DB) */}
            <div className="relative overflow-hidden rounded-[32px] p-8 text-white shadow-2xl bg-wink-black border border-white/5">
                <div className="absolute top-0 right-0 -mt-6 -mr-6 w-40 h-40 bg-wink-yellow/20 blur-[60px] rounded-full"></div>
                
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                            <Wallet size={14} className="text-wink-yellow"/> Mon Portefeuille
                        </p>
                        <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${isVerified ? 'bg-wink-yellow text-black' : 'bg-red-500/20 text-red-500 border border-red-500/50'}`}>
                            {isVerified ? 'PRO RIDER' : 'COMPTE RESTREINT'}
                        </div>
                    </div>
                    
                    <h1 className="text-5xl font-black mb-10 tracking-tighter">
                        {walletData.balance?.toLocaleString()} <span className="text-xl font-medium text-gray-400">F</span>
                    </h1>

                    {/* BLOC ACTIONS / SÉCURITÉ */}
                    <div className="space-y-4">
                        {isVerified ? (
                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={handleWithdraw}
                                    className="bg-wink-yellow hover:scale-105 text-black font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl shadow-wink-yellow/10 text-xs uppercase"
                                >
                                    <ArrowUpRight size={18}/> Retirer
                                </button>
                                <button className="bg-white/5 hover:bg-white/10 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 border border-white/10 text-xs uppercase">
                                    <ArrowDownLeft size={18}/> Dépôt
                                </button>
                            </div>
                        ) : (
                            <div className="bg-white/5 border border-white/10 backdrop-blur-md p-4 rounded-2xl">
                                <button disabled className="w-full bg-gray-800 text-gray-500 py-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 cursor-not-allowed mb-3 uppercase tracking-widest">
                                    <Lock size={16}/> Retraits bloqués
                                </button>
                                <div className="flex items-start gap-3">
                                    <AlertTriangle size={16} className="text-wink-yellow shrink-0 mt-0.5" />
                                    <p className="text-[9px] text-gray-400 leading-relaxed font-bold uppercase tracking-tight">
                                        Veuillez valider vos documents dans votre profil pour débloquer les retraits Mobile Money.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 2. STATS RÉELLES DU JOUR */}
            <div className="grid grid-cols-2 gap-4">
                <div className={`p-5 rounded-[24px] border ${cardClass}`}>
                    <p className={`text-[9px] uppercase font-black ${textMuted} mb-2 tracking-widest`}>Aujourd'hui</p>
                    <p className="text-2xl font-black text-green-500">+{walletData.incomeToday || 0} <span className="text-xs">F</span></p>
                </div>
                <div className={`p-5 rounded-[24px] border ${cardClass}`}>
                    <p className={`text-[9px] uppercase font-black ${textMuted} mb-2 tracking-widest`}>Missions</p>
                    <p className="text-2xl font-black">{walletData.missionsCount || 0}</p>
                </div>
            </div>

            {/* 3. PARRAINAGE (Dynamique) */}
            <div className={`p-6 rounded-[24px] border relative overflow-hidden ${cardClass}`}>
                <div className="flex justify-between items-start mb-6 relative z-10">
                    <div>
                        <h3 className="font-black text-sm uppercase tracking-tighter flex items-center gap-2">
                            <Zap className="text-wink-yellow fill-current" size={16}/> 
                            Programme Parrain
                        </h3>
                        <p className={`text-[10px] ${textMuted} mt-2 max-w-[180px] font-medium leading-relaxed`}>
                            Partagez votre code et gagnez des bonus sur les courses de vos filleuls.
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-3xl font-black text-wink-yellow leading-none">{walletData.referralCount || 0}</p>
                        <p className="text-[8px] uppercase font-black text-gray-400 mt-1">Amis</p>
                    </div>
                </div>

                <div className="bg-gray-100 dark:bg-gray-900/50 p-4 rounded-2xl flex justify-between items-center border border-dashed border-gray-300 dark:border-gray-700 relative z-10">
                    <span className="font-black text-lg tracking-[4px] pl-2 text-wink-black dark:text-white uppercase">
                        {walletData.referralCode || 'WINK-PRO'}
                    </span>
                    <button 
                        onClick={handleCopyCode}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all flex items-center gap-2 ${copied ? 'bg-green-500 text-white' : 'bg-wink-black text-white'}`}
                    >
                        {copied ? <CheckCircle size={14}/> : <Copy size={14}/>}
                        {copied ? 'COPIÉ' : 'COPIER'}
                    </button>
                </div>
            </div>

            {/* 4. HISTORIQUE RÉEL */}
            <div className="pb-10">
                <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${textMuted}`}>
                        <History size={14}/> Activité Récente
                    </h3>
                    <button className="text-[10px] font-black text-wink-yellow uppercase tracking-tighter">Voir tout</button>
                </div>
                
                <div className="space-y-3">
                    {!walletData.transactions || walletData.transactions.length === 0 ? (
                        <p className="text-center text-gray-400 py-10 text-xs font-bold uppercase tracking-widest">Aucune transaction</p>
                    ) : (
                        walletData.transactions.map((tx) => (
                            <div key={tx.id} className={`p-4 rounded-[24px] border flex items-center justify-between ${cardClass}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-xl ${
                                        tx.type === 'credit' || tx.type === 'EARNING' 
                                            ? 'bg-green-500/10 text-green-500' 
                                            : 'bg-red-500/10 text-red-500'
                                    }`}>
                                        {tx.type === 'credit' || tx.type === 'EARNING' ? '🏍️' : '💸'}
                                    </div>
                                    <div>
                                        <p className="font-black text-sm">{tx.description || tx.label}</p>
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">
                                            <span>{new Date(tx.created_at || Date.now()).toLocaleDateString()}</span>
                                            <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                                            <span>{tx.type}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className={`font-black text-sm ${tx.type === 'credit' || tx.type === 'EARNING' ? 'text-green-500' : 'text-gray-400'}`}>
                                    {tx.type === 'credit' || tx.type === 'EARNING' ? '+' : '-'}{tx.amount} <span className="text-[10px]">F</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}