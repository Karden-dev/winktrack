import React, { useState } from 'react';
import { Gift, Copy, Share2, Tag, CheckCircle, Ticket, Sparkles } from 'lucide-react';
import WinkButton from '../../components/WinkButton';
import WinkInput from '../../components/WinkInput'; // On utilise le composant WinkInput standard

export default function PromoView({ user }) {
    const [code, setCode] = useState('');
    const [status, setStatus] = useState('IDLE'); // IDLE, LOADING, SUCCESS, ERROR

    const handleApply = () => {
        if (!code || code.length < 3) return;
        setStatus('LOADING');
        
        // Simulation d'appel API
        console.log("Tentative d'application du code :", code);
        setTimeout(() => {
            setStatus('SUCCESS');
            // Reset après 3 secondes
            setTimeout(() => {
                setStatus('IDLE');
                setCode('');
            }, 3000);
        }, 1500);
    };

    const copyReferral = () => {
        const referralCode = `WINK-${user?.firstName?.toUpperCase() || 'AMIS'}`;
        navigator.clipboard.writeText(referralCode);
        // Idéalement, utiliser un toast de notification ici au lieu d'un alert
        alert(`Code ${referralCode} copié !`);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
            
            {/* --- EN-TÊTE --- */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                        Mes Avantages <Sparkles className="text-wink-yellow animate-spin-slow" size={24} />
                    </h2>
                    <p className="text-sm text-slate-500 font-medium">Bons plans et parrainage.</p>
                </div>
            </div>

            {/* --- CARTE PARRAINAGE (DESIGN AMÉLIORÉ) --- */}
            <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-900 to-wink-black p-6 text-white shadow-xl group">
                {/* Effets de fond */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-wink-yellow/30 rounded-full blur-[50px] -mr-10 -mt-10 animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/20 rounded-full blur-[40px] -ml-10 -mb-10"></div>
                
                <div className="relative z-10 text-center space-y-4">
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                        <Gift size={14} className="text-wink-yellow" />
                        <span className="text-[10px] font-bold text-wink-yellow uppercase tracking-wider">Programme Ambassadeur</span>
                    </div>

                    <div>
                        <h3 className="text-2xl font-black tracking-tighter mb-1">
                            Invitez, Gagnez 
                            <span className="text-wink-yellow ml-2">500 F</span>
                        </h3>
                        <p className="text-slate-300 text-xs max-w-xs mx-auto">
                            Votre ami reçoit aussi 500 F sur sa première course.
                        </p>
                    </div>

                    {/* Zone Code Simplifiée */}
                    <div onClick={copyReferral} className="bg-white/10 backdrop-blur-sm border border-white/20 p-3 rounded-xl flex items-center justify-between max-w-xs mx-auto cursor-pointer active:scale-95 transition-all hover:bg-white/20">
                        <div className="font-mono font-black text-lg tracking-widest text-wink-yellow pl-2">
                            WINK-{user?.firstName?.toUpperCase() || 'USER'}
                        </div>
                        <Copy size={18} className="text-white/70" />
                    </div>

                    <button onClick={copyReferral} className="text-[10px] font-bold text-white/50 flex items-center justify-center gap-2 hover:text-white transition-colors">
                        <Share2 size={12} /> Appuyer pour copier et partager
                    </button>
                </div>
            </div>

            {/* --- SECTION AJOUTER UN CODE (CORRIGÉE) --- */}
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Tag size={16} className="text-wink-yellow" /> Ajouter un code promo
                </h3>

                {/* Layout en colonne : Input au-dessus, Bouton en dessous */}
                <div className="space-y-4">
                    <div className="relative">
                        <WinkInput 
                            placeholder="Entrez votre code (ex: BIENVENUE)"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            className="uppercase font-bold text-lg tracking-wider"
                        />
                        {/* Icône de succès visuelle par-dessus l'input */}
                        {status === 'SUCCESS' && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-1 animate-in zoom-in">
                                <CheckCircle className="text-green-500" size={24} />
                            </div>
                        )}
                    </div>

                    <WinkButton 
                        variant="primary" 
                        onClick={handleApply} 
                        isLoading={status === 'LOADING'}
                        disabled={!code || code.length < 3 || status === 'SUCCESS'}
                        className={`w-full transition-all py-4 text-sm ${status === 'SUCCESS' ? 'bg-green-500 hover:bg-green-600 border-transparent text-white' : ''}`}
                    >
                        {status === 'SUCCESS' ? 'Code appliqué avec succès !' : 'Appliquer le code'}
                    </WinkButton>
                </div>
                
                {status === 'SUCCESS' && (
                    <p className="mt-3 text-center text-xs font-bold text-green-600 animate-in slide-in-from-top-2">
                        La réduction sera appliquée sur votre prochaine course éligible.
                    </p>
                )}
            </div>

            {/* --- LISTE DES COUPONS ACTIFS --- */}
            <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Vos coupons actifs</h3>
                
                {/* Exemple de Coupon */}
                <div className="bg-white border border-slate-100 p-5 rounded-[24px] shadow-sm relative overflow-hidden flex justify-between items-center">
                    {/* Décoration */}
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-blue-500"></div>
                    
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-[9px] font-black uppercase">Offre de bienvenue</span>
                        </div>
                        <p className="text-xl font-black text-slate-900">-500 FCFA</p>
                        <p className="text-xs text-slate-500 font-medium">Sur votre prochaine course.</p>
                    </div>
                    <div className="h-10 w-10 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
                        <Ticket size={20} />
                    </div>
                </div>
            </div>
        </div>
    );
}