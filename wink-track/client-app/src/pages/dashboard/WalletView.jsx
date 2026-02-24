import React, { useState } from 'react';
import { Wallet, Plus, ArrowDownLeft, ArrowUpRight, Minus, X, CreditCard, Smartphone } from 'lucide-react';
import WinkButton from '../../components/WinkButton';
import WinkInput from '../../components/WinkInput';

export default function WalletView({ user, transactions = [] }) {
    const [actionType, setActionType] = useState(null); // 'DEPOSIT' ou 'WITHDRAW' ou null
    const [amount, setAmount] = useState('');
    const [phone, setPhone] = useState(user.paymentNumber || user.phone);
    const [isLoading, setIsLoading] = useState(false);

    // 1. Transformer les courses (rides) en format "Transaction"
    // Note: Dans le futur, tu auras une API api.wallet.getTransactions() qui retournera tout (dépôts + retraits + courses)
    // Pour l'instant, on simule que les courses sont les seules dépenses visibles.
    const formattedTransactions = transactions.map(ride => ({
        id: ride.id,
        type: 'DEBIT', // Dépense
        label: `Course vers ${ride.dropoff_address ? ride.dropoff_address.substring(0, 20) + '...' : 'Destination inconnu'}`,
        date: ride.created_at,
        amount: ride.total_price,
        status: ride.status
    })).sort((a, b) => new Date(b.date) - new Date(a.date)); // Plus récent en premier

    // --- GESTION DES ACTIONS ---
    const handleTransaction = async () => {
        if (!amount || amount < 100) return alert("Montant minimum : 100 FCFA");
        
        setIsLoading(true);
        try {
            // ICI: Appeler l'API de paiement (ex: Campay / CinetPay)
            // await api.wallet.initiateTransaction({ type: actionType, amount, phone });
            
            console.log(`Action: ${actionType}, Montant: ${amount}, Tel: ${phone}`);
            
            // Simulation
            setTimeout(() => {
                alert(actionType === 'DEPOSIT' ? "Rechargement initié ! Vérifiez votre téléphone." : "Demande de retrait envoyée.");
                setIsLoading(false);
                setActionType(null);
                setAmount('');
            }, 1500);

        } catch (error) {
            alert("Erreur lors de la transaction");
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            
            {/* --- CARTE SOLDE --- */}
            <div className="bg-wink-black rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl">
                {/* Effets de fond */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-wink-yellow/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -ml-10 -mb-10"></div>
                
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                            <Wallet className="text-wink-yellow" size={24} />
                        </div>
                        <span className="bg-wink-yellow/20 text-wink-yellow text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                            Compte Vérifié
                        </span>
                    </div>

                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Solde Disponible</p>
                    <h2 className="text-5xl font-black text-white mb-8 tracking-tighter">
                        {user.balance.toLocaleString()} <span className="text-xl font-normal text-wink-yellow">FCFA</span>
                    </h2>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            onClick={() => setActionType('DEPOSIT')}
                            className="flex items-center justify-center gap-2 bg-wink-yellow text-wink-black py-4 rounded-2xl font-black text-sm hover:bg-white transition-colors"
                        >
                            <Plus size={18} /> Recharger
                        </button>
                        <button 
                            onClick={() => setActionType('WITHDRAW')}
                            className="flex items-center justify-center gap-2 bg-white/10 text-white py-4 rounded-2xl font-black text-sm hover:bg-white/20 transition-colors backdrop-blur-sm"
                        >
                            <ArrowUpRight size={18} /> Retrait
                        </button>
                    </div>
                </div>
            </div>

            {/* --- LISTE DES TRANSACTIONS --- */}
            <div className="bg-white rounded-[40px] p-8 border border-slate-100 min-h-[400px]">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Historique des transactions</h3>
                
                <div className="space-y-6">
                    {formattedTransactions.length > 0 ? (
                        formattedTransactions.map((tx) => (
                            <div key={tx.id} className="flex justify-between items-center group hover:bg-slate-50 p-2 rounded-xl transition-colors -mx-2">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                                        tx.type === 'CREDIT' ? 'bg-green-100 text-green-600' : 'bg-red-50 text-red-500'
                                    }`}>
                                        {tx.type === 'CREDIT' ? <ArrowDownLeft size={20}/> : <ArrowUpRight size={20}/>}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">{tx.label}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">
                                            {new Date(tx.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute:'2-digit' })}
                                        </p>
                                    </div>
                                </div>
                                <span className={`font-black text-sm ${
                                    tx.type === 'CREDIT' ? 'text-green-600' : 'text-slate-900'
                                }`}>
                                    {tx.type === 'CREDIT' ? '+' : '-'}{tx.amount.toLocaleString()} F
                                </span>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                <CreditCard size={24} />
                            </div>
                            <p className="text-slate-400 font-bold text-xs uppercase">Aucune transaction</p>
                        </div>
                    )}
                </div>
            </div>

            {/* --- MODALE D'ACTION (RECHARGE / RETRAIT) --- */}
            {actionType && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-wink-black/80 backdrop-blur-sm animate-in fade-in" onClick={() => setActionType(null)}></div>
                    <div className="bg-white w-full max-w-sm rounded-[32px] p-8 relative z-10 animate-in zoom-in-95 duration-200 shadow-2xl">
                        
                        <button onClick={() => setActionType(null)} className="absolute top-6 right-6 text-slate-300 hover:text-wink-black">
                            <X size={24} />
                        </button>

                        <div className="mb-6">
                            <h3 className="text-2xl font-black text-slate-900 mb-1">
                                {actionType === 'DEPOSIT' ? 'Recharger' : 'Effectuer un retrait'}
                            </h3>
                            <p className="text-xs font-bold text-slate-400 uppercase">Via Mobile Money / Orange Money</p>
                        </div>

                        <div className="space-y-4">
                            <WinkInput 
                                label="Montant (FCFA)" 
                                type="number" 
                                placeholder="Ex: 5000" 
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                icon={CreditCard}
                            />
                            
                            <WinkInput 
                                label="Numéro de téléphone" 
                                type="tel" 
                                placeholder="6xx xx xx xx" 
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                icon={Smartphone}
                            />

                            <div className="pt-2">
                                <WinkButton 
                                    variant="primary" 
                                    isLoading={isLoading} 
                                    onClick={handleTransaction}
                                    className={actionType === 'DEPOSIT' ? 'bg-wink-black text-white' : 'bg-red-500 border-red-500 text-white'}
                                >
                                    {actionType === 'DEPOSIT' ? 'Confirmer le rechargement' : 'Confirmer le retrait'}
                                </WinkButton>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}