import React from 'react';
import { MessageCircle, PhoneCall, Mail, ChevronRight } from 'lucide-react';

export default function SupportView() {
    const handleWhatsAppSupport = () => {
        window.open("https://wa.me/237600000000?text=Bonjour Wink, j'ai besoin d'aide.", "_blank");
    };

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-black text-slate-900">Support & Aide</h2>
            
            <div className="grid gap-4">
                <button 
                    onClick={handleWhatsAppSupport}
                    className="flex items-center gap-6 p-6 bg-green-500 text-white rounded-[32px] shadow-lg active:scale-95 transition-all"
                >
                    <MessageCircle size={32} />
                    <div className="text-left">
                        <p className="font-black text-lg">Chat WhatsApp</p>
                        <p className="text-xs opacity-80">Réponse en moins de 5 min</p>
                    </div>
                </button>

                <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden">
                    <div className="p-6 space-y-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Questions fréquentes</h4>
                        {["Comment suivre mon colis ?", "Tarification et zones", "Devenir livreur Wink"].map((q, i) => (
                            <button key={i} className="w-full flex justify-between items-center py-3 border-b border-slate-50 last:border-0 text-left text-sm font-bold text-slate-700">
                                {q} <ChevronRight size={16} className="text-slate-300" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}