import React, { useState, useEffect } from 'react';
import { 
    Tag, DollarSign, Percent, Calculator, 
    Save, Plus, Trash2, Clock, 
    Zap, CheckCircle, Settings, 
    UserCheck, ShieldCheck, TrendingUp
} from 'lucide-react';

export default function AdminPricingPage() {
    const [activeTab, setActiveTab] = useState('PRICING');

    // --- 1. TARIFICATION UNIVERSELLE (SANS TYPE DE VÉHICULE) ---
    const [pricing, setPricing] = useState({
        basePrice: 500,
        perKm: 150
    });

    // --- 2. CODES PROMO ---
    const [promos, setPromos] = useState([
        { id: 1, code: "WINK2026", type: "PERCENT", value: 20, uses: 150, maxUses: 500, expiry: "2026-12-31", status: "ACTIVE" },
        { id: 2, code: "CASH500", type: "FIXED", value: 500, uses: 45, maxUses: 100, expiry: "2026-06-10", status: "ACTIVE" },
    ]);

    // --- 3. RÉMUNÉRATION & MAJORATIONS ---
    const [settings, setSettings] = useState({
        riderPayoutRate: 80, // 80% pour le livreur
        nightModeSurge: 1.5,
        rainModeSurge: 1.3,
        rushHourSurge: 1.2,
    });

    // --- 4. SIMULATEUR ---
    const [simDist, setSimDist] = useState(5);
    const [simPrice, setSimPrice] = useState(0);

    // Calcul automatique (Prix = Base + (KM * TarifKM))
    useEffect(() => {
        let price = pricing.basePrice + (pricing.perKm * simDist);
        setSimPrice(Math.round(price));
    }, [simDist, pricing]);

    const handlePricingChange = (field, value) => {
        setPricing({ ...pricing, [field]: parseInt(value) || 0 });
    };

    return (
        <div className="flex h-full bg-gray-50 font-sans overflow-hidden">
            
            {/* PANNEAU GAUCHE : CONFIGURATION */}
            <div className="flex-1 flex flex-col overflow-hidden">
                
                <div className="bg-white border-b px-6 py-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Pricing & Stratégie</h1>
                        <p className="text-sm text-slate-500 font-medium">Gestion des tarifs universels et rémunérations.</p>
                    </div>
                    <div className="bg-slate-100 p-1 rounded-2xl flex gap-1">
                        <TabBtn active={activeTab === 'PRICING'} onClick={() => setActiveTab('PRICING')} icon={DollarSign} label="Tarifs" />
                        <TabBtn active={activeTab === 'PROMOS'} onClick={() => setActiveTab('PROMOS')} icon={Tag} label="Promos" />
                        <TabBtn active={activeTab === 'SETTINGS'} onClick={() => setActiveTab('SETTINGS')} icon={Settings} label="Réglages" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8">

                    {/* --- CONTENU : TARIFS KM --- */}
                    {activeTab === 'PRICING' && (
                        <div className="max-w-2xl space-y-8">
                            <div className="bg-white p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm">
                                <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                                    <CheckCircle className="text-green-500" size={20} /> Configuration du Tarif Universel
                                </h3>
                                
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="bg-slate-50 p-6 rounded-2xl">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Prise en charge</label>
                                        <div className="flex items-center gap-2 border-b-2 border-slate-200 pb-2 focus-within:border-green-500 transition-colors">
                                            <input 
                                                type="number" value={pricing.basePrice}
                                                onChange={(e) => handlePricingChange('basePrice', e.target.value)}
                                                className="bg-transparent text-3xl font-black text-slate-800 outline-none w-full"
                                            />
                                            <span className="font-bold text-slate-400">F</span>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-6 rounded-2xl">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Prix au Kilomètre</label>
                                        <div className="flex items-center gap-2 border-b-2 border-slate-200 pb-2 focus-within:border-green-500 transition-colors">
                                            <input 
                                                type="number" value={pricing.perKm}
                                                onChange={(e) => handlePricingChange('perKm', e.target.value)}
                                                className="bg-transparent text-3xl font-black text-slate-800 outline-none w-full"
                                            />
                                            <span className="font-bold text-slate-400">F</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="mt-8 p-4 bg-blue-50 rounded-2xl border border-blue-100 text-blue-700 text-sm font-bold italic flex items-center gap-3">
                                    <Calculator size={20}/>
                                    Formule : Prix = Frais de base + (Distance × Tarif au KM)
                                </div>
                            </div>
                            <button className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-black transition-all">
                                APPLIQUER LES NOUVEAUX TARIFS
                            </button>
                        </div>
                    )}

                    {/* --- CONTENU : PROMOS --- */}
                    {activeTab === 'PROMOS' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="font-black text-xl text-slate-800">Coupons Marketing</h3>
                                <button className="bg-green-600 text-white px-5 py-2.5 rounded-2xl text-sm font-black flex items-center gap-2 shadow-lg shadow-green-500/20">
                                    <Plus size={18}/> NOUVEAU CODE
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-4">
                                {promos.map(p => (
                                    <div key={p.id} className="bg-white p-6 rounded-3xl border border-slate-100 flex justify-between items-center shadow-sm hover:border-blue-200 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                                                <Tag size={28} />
                                            </div>
                                            <div>
                                                <p className="font-black text-xl tracking-tighter">{p.code}</p>
                                                <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-blue-100 text-blue-600 rounded-md">
                                                    {p.type === 'PERCENT' ? `-${p.value}%` : `-${p.value}F`}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-8">
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-slate-400 uppercase">Expire le</p>
                                                <p className="font-bold text-slate-700">{p.expiry}</p>
                                            </div>
                                            <button className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                                                <Trash2 size={20}/>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* --- CONTENU : RÉMUNÉRATION LIVREUR --- */}
                    {activeTab === 'SETTINGS' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm">
                                <div className="flex items-center gap-2 mb-8 text-green-600">
                                    <UserCheck size={28}/>
                                    <h3 className="text-xl font-black text-slate-900">Rémunération Livreur</h3>
                                </div>
                                <div className="space-y-8">
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-6xl font-black text-slate-900 tracking-tighter">{settings.riderPayoutRate}%</span>
                                        <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Pour le coursier</span>
                                    </div>
                                    <input 
                                        type="range" min="50" max="100" 
                                        value={settings.riderPayoutRate}
                                        onChange={(e) => setSettings({...settings, riderPayoutRate: parseInt(e.target.value)})}
                                        className="w-full h-3 bg-slate-100 rounded-full appearance-none cursor-pointer accent-green-500"
                                    />
                                    <div className="p-4 bg-slate-50 rounded-2xl italic text-xs text-slate-500 font-medium">
                                        Wink prélève une commission de {100 - settings.riderPayoutRate}% sur le prix total de la course.
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm">
                                <div className="flex items-center gap-2 mb-8 text-orange-500">
                                    <Zap size={28}/>
                                    <h3 className="text-xl font-black text-slate-900">Majorations (Surge)</h3>
                                </div>
                                <div className="space-y-4">
                                    <SurgeItem label="Nuit (22h-05h)" value={settings.nightModeSurge} icon={Clock} onChange={(v) => setSettings({...settings, nightModeSurge: v})} />
                                    <SurgeItem label="Pluie Intense" value={settings.rainModeSurge} icon={Zap} onChange={(v) => setSettings({...settings, rainModeSurge: v})} />
                                    <SurgeItem label="Heures de Pointe" value={settings.rushHourSurge} icon={TrendingUp} onChange={(v) => setSettings({...settings, rushHourSurge: v})} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* PANNEAU DROIT : SIMULATEUR DYNAMIQUE */}
            <div className="w-[400px] bg-slate-950 text-white flex flex-col shadow-2xl relative z-20">
                <div className="p-8 border-b border-white/10">
                    <h2 className="text-2xl font-black flex items-center gap-3 text-green-400 tracking-tighter uppercase">
                        <Calculator size={28}/> Preview Gains
                    </h2>
                    <p className="text-xs text-slate-500 font-bold mt-2 uppercase tracking-widest">Simulation temps réel</p>
                </div>
                
                <div className="p-8 space-y-10 flex-1">
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase mb-4 block tracking-[0.2em]">Distance Simulation</label>
                        <div className="space-y-6">
                            <input 
                                type="range" min="1" max="40" 
                                value={simDist} 
                                onChange={(e) => setSimDist(parseInt(e.target.value))}
                                className="w-full h-2 bg-slate-800 rounded-full appearance-none cursor-pointer accent-green-500"
                            />
                            <div className="flex justify-between items-end">
                                <span className="text-5xl font-black leading-none">{simDist} <small className="text-slate-600 text-lg uppercase">Km</small></span>
                                <span className="text-3xl font-black text-green-500 tracking-tighter">{simPrice} F</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-10 border-t border-white/5">
                        <div className="flex justify-between items-center bg-white/5 p-5 rounded-3xl border border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-green-500/20 flex items-center justify-center text-green-400">
                                    <UserCheck size={20}/>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Gain Livreur</p>
                                    <p className="text-xl font-black text-white">{Math.round(simPrice * (settings.riderPayoutRate/100))} F</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center bg-white/5 p-5 rounded-3xl border border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                                    <ShieldCheck size={20}/>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Profit Wink</p>
                                    <p className="text-xl font-black text-white">{Math.round(simPrice * (1 - settings.riderPayoutRate/100))} F</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-white/5 m-4 rounded-[2rem] border border-white/5">
                    <p className="text-[10px] font-black text-slate-500 uppercase mb-4 flex items-center gap-2">
                        <Zap size={14} className="text-orange-400"/> Impact des majorations
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-900 p-4 rounded-2xl border border-white/5">
                            <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Si Pluie</p>
                            <p className="text-lg font-black text-orange-400">{Math.round(simPrice * settings.rainModeSurge)} F</p>
                        </div>
                        <div className="bg-slate-900 p-4 rounded-2xl border border-white/5">
                            <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Si Nuit</p>
                            <p className="text-lg font-black text-purple-400">{Math.round(simPrice * settings.nightModeSurge)} F</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- SOUS-COMPOSANTS ---

const TabBtn = ({ active, onClick, icon: Icon, label }) => (
    <button 
        onClick={onClick}
        className={`px-8 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
            active ? 'bg-white shadow-xl text-slate-950 scale-105' : 'text-slate-500 hover:text-slate-900'
        }`}
    >
        <Icon size={16} /> {label}
    </button>
);

const SurgeItem = ({ label, value, icon: Icon, onChange }) => (
    <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-transparent hover:border-orange-100 transition-all">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                <Icon size={16} className="text-slate-400" />
            </div>
            <span className="text-sm font-black text-slate-700">{label}</span>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-300">x</span>
            <input 
                type="number" step="0.1"
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="w-14 bg-white border-2 border-slate-100 rounded-xl py-1 text-center font-black text-slate-900 outline-none focus:border-orange-500"
            />
        </div>
    </div>
);