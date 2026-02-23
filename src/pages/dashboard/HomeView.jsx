import React from 'react';
import { Zap, ArrowUpRight, MapPin, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function HomeView({ user, rides }) {
    const navigate = useNavigate();

    return (
        <div className="space-y-10">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Salut, {user.firstName} 👋</h1>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Prêt pour une livraison ?</p>
            </div>

            <button 
                onClick={() => navigate('/map')}
                className="w-full bg-wink-black text-white h-28 rounded-[32px] font-black text-xl shadow-2xl active:scale-95 transition-all flex items-center justify-between px-8 group"
            >
                <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-wink-yellow rounded-2xl flex items-center justify-center rotate-3 group-hover:rotate-12 transition-transform">
                        <Zap size={32} className="text-black fill-current" />
                    </div>
                    <div className="text-left">
                        <span className="block text-2xl tracking-tighter">Nouvelle Course</span>
                        <span className="text-[10px] font-black opacity-40 uppercase tracking-[2px]">Wink Fast Track</span>
                    </div>
                </div>
                <ArrowUpRight size={28} className="text-wink-yellow" />
            </button>

            <div>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Activités Récentes</h3>
                    <button onClick={() => navigate('/dashboard/history')} className="text-[10px] font-black text-wink-black uppercase tracking-tighter border-b-2 border-wink-yellow">Voir tout</button>
                </div>

                <div className="space-y-4">
                    {rides.length === 0 ? (
                        <div className="bg-white p-10 rounded-[32px] border border-slate-100 text-center">
                            <Clock size={32} className="text-slate-200 mx-auto mb-3" />
                            <p className="text-xs text-slate-400 font-bold uppercase">Aucune course enregistrée</p>
                        </div>
                    ) : (
                        rides.map((ride) => (
                            <div key={ride.id} className="bg-white p-5 rounded-[28px] border border-slate-50 shadow-sm flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-wink-black"><MapPin size={20} /></div>
                                    <div className="flex-1 min-w-0 pr-4">
                                        <p className="text-sm font-black text-slate-900 truncate uppercase tracking-tighter">{ride.dropoff_address || "En attente"}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(ride.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-slate-900">{ride.total_price} F</p>
                                    <span className="text-[8px] font-black px-2 py-1 rounded-full bg-slate-100 text-slate-400 uppercase">{ride.status}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}