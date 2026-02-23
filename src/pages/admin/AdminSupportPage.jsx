import React, { useState, useEffect, useRef } from 'react';
import { 
    Search, MessageCircle, Send, User, 
    CheckCircle, AlertCircle, Paperclip, Zap, Loader2, X, Phone
} from 'lucide-react';
import api from '../../services/api'; //

export default function AdminSupportPage() {
    // --- ÉTATS RÉELS ---
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('OPEN'); // OPEN, RESOLVED, ALL
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    
    const messagesEndRef = useRef(null);

    // --- 1. CHARGEMENT DES TICKETS DEPUIS LA DB ---
    const fetchTickets = async () => {
        setLoading(true);
        try {
            // Récupère les tickets de support réels
            const res = await api.auth.getSupportTickets(); 
            setTickets(res.data || []);
        } catch (err) {
            console.error("Erreur support:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    // Scroll automatique vers le bas du chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [selectedTicket?.messages]);

    // --- 2. LOGIQUE DE CHAT RÉELLE ---

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if(!replyText.trim()) return;

        try {
            // Envoi du message au backend
            const res = await api.auth.sendSupportReply(selectedTicket.id, {
                message: replyText,
                sender_type: 'ADMIN'
            });

            if (res.data.success) {
                // Mise à jour locale immédiate pour la fluidité
                const newMessage = { 
                    id: Date.now(), 
                    sender: "admin", 
                    text: replyText, 
                    time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                };
                
                const updatedTicket = { 
                    ...selectedTicket, 
                    messages: [...(selectedTicket.messages || []), newMessage],
                    lastUpdate: "À l'instant"
                };

                setTickets(tickets.map(t => t.id === selectedTicket.id ? updatedTicket : t));
                setSelectedTicket(updatedTicket);
                setReplyText('');
            }
        } catch (err) {
            alert("Erreur lors de l'envoi du message.");
        }
    };

    const handleResolveTicket = async () => {
        if(window.confirm("Voulez-vous clôturer ce dossier ?")) {
            try {
                await api.auth.updateTicketStatus(selectedTicket.id, 'RESOLVED');
                const updated = { ...selectedTicket, status: 'RESOLVED' };
                setTickets(tickets.map(t => t.id === selectedTicket.id ? updated : t));
                setSelectedTicket(updated);
                alert("Ticket marqué comme résolu.");
            } catch (err) {
                alert("Erreur de mise à jour.");
            }
        }
    };

    const handleQuickReply = (text) => {
        setReplyText(text);
    };

    // --- FILTRAGE ---
    const filteredTickets = tickets.filter(t => {
        const matchesSearch = t.user?.toLowerCase().includes(searchTerm.toLowerCase()) || t.subject?.toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchesSearch) return false;
        if (activeFilter === 'ALL') return true;
        return t.status === activeFilter;
    });

    if (loading && tickets.length === 0) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-wink-yellow" size={40}/></div>;

    return (
        <div className="flex h-full bg-white font-sans overflow-hidden">
            
            {/* 1. SIDEBAR : LISTE DES DOSSIERS */}
            <div className="w-[380px] flex flex-col border-r border-slate-100 bg-white z-10 shadow-lg">
                
                <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                    <h1 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-4">Support Wink</h1>
                    <div className="flex bg-slate-200/50 p-1 rounded-xl mb-4">
                        {['OPEN', 'RESOLVED', 'ALL'].map(filter => (
                            <button 
                                key={filter} onClick={() => setActiveFilter(filter)}
                                className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all uppercase tracking-widest ${
                                    activeFilter === filter ? 'bg-wink-black text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                {filter === 'OPEN' ? 'En Cours' : filter === 'RESOLVED' ? 'Clos' : 'Tout'}
                            </button>
                        ))}
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                        <input 
                            type="text" placeholder="Client, sujet, n° ticket..." 
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-wink-black shadow-inner"
                            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {filteredTickets.length === 0 ? (
                        <div className="p-10 text-center text-slate-300 uppercase text-[10px] font-black tracking-widest">Aucun ticket</div>
                    ) : filteredTickets.map(ticket => (
                        <div 
                            key={ticket.id} onClick={() => setSelectedTicket(ticket)}
                            className={`p-5 border-b border-slate-50 cursor-pointer transition-all hover:bg-slate-50 relative ${
                                selectedTicket?.id === ticket.id ? 'bg-slate-50 border-l-4 border-l-wink-black' : 'border-l-4 border-l-transparent'
                            }`}
                        >
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${
                                        ticket.role === 'RIDER' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                                    }`}>
                                        {ticket.role}
                                    </span>
                                    <span className="font-black text-xs text-slate-900 truncate max-w-[120px]">{ticket.user}</span>
                                </div>
                                <span className="text-[9px] font-bold text-slate-400 uppercase">{ticket.lastUpdate}</span>
                            </div>
                            <h4 className={`text-sm font-bold truncate mb-1 ${ticket.status === 'OPEN' ? 'text-slate-900' : 'text-slate-400 line-through'}`}>
                                {ticket.subject}
                            </h4>
                            <p className="text-[10px] text-slate-400 font-medium truncate italic">
                                {ticket.messages && ticket.messages.length > 0 ? ticket.messages[ticket.messages.length - 1].text : 'Pas de message'}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* 2. MAIN : CENTRE DE RÉPONSE */}
            <div className="flex-1 flex flex-col bg-slate-50/50 relative">
                {selectedTicket ? (
                    <>
                        {/* Header Chat */}
                        <div className="bg-white p-6 border-b border-slate-100 flex justify-between items-center shadow-sm z-20">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-inner ${selectedTicket.role === 'RIDER' ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'}`}>
                                    {selectedTicket.user?.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-slate-900 leading-none mb-1 uppercase tracking-tighter">
                                        #{selectedTicket.id} • {selectedTicket.subject}
                                    </h2>
                                    <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        <span className="flex items-center gap-1 text-wink-black"><Phone size={10}/> {selectedTicket.phone}</span>
                                        <span>•</span>
                                        <span className={selectedTicket.status === 'OPEN' ? 'text-green-500' : 'text-slate-300'}>
                                            {selectedTicket.status === 'OPEN' ? 'Dossier Ouvert' : 'Dossier Clos'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                {selectedTicket.status === 'OPEN' && (
                                    <button 
                                        onClick={handleResolveTicket}
                                        className="bg-wink-black text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 active:scale-95 transition-all shadow-xl shadow-black/10"
                                    >
                                        <CheckCircle size={14} className="text-wink-yellow"/> Clôturer le ticket
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Fil de discussion */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-6"> 
                            {selectedTicket.messages?.map(msg => (
                                <div 
                                    key={msg.id} 
                                    className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[65%] rounded-[24px] p-5 shadow-sm relative ${
                                        msg.sender === 'admin' 
                                        ? 'bg-wink-black text-white rounded-tr-none' 
                                        : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                                    }`}>
                                        <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                                        <span className={`text-[9px] font-bold block text-right mt-2 uppercase tracking-widest ${msg.sender === 'admin' ? 'text-slate-500' : 'text-slate-300'}`}>
                                            {msg.time}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Zone Saisie (Seulement si ticket ouvert) */}
                        {selectedTicket.status === 'OPEN' && (
                            <div className="bg-white p-6 border-t border-slate-100">
                                {/* Réponses Rapides Stratégiques */}
                                <div className="flex gap-3 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                                    <QuickReply label="Bonjour 👋" text="Bonjour, comment puis-je vous aider ?" onClick={handleQuickReply}/>
                                    <QuickReply label="Désolé 😔" text="Wink Express s'excuse pour ce désagrément. Nous traitons le problème." onClick={handleQuickReply}/>
                                    <QuickReply label="Commande 🏍️" text="Je contacte immédiatement le livreur pour faire le point." onClick={handleQuickReply}/>
                                    <QuickReply label="Paiement 💸" text="Nous avons bien reçu votre paiement. Le wallet sera mis à jour." onClick={handleQuickReply}/>
                                </div>

                                <form onSubmit={handleSendMessage} className="flex gap-4 items-end bg-slate-50 p-3 rounded-[28px] border border-slate-100">
                                    <button type="button" className="p-3 text-slate-400 hover:text-wink-black transition-colors">
                                        <Paperclip size={20}/>
                                    </button>
                                    <textarea 
                                        rows="1" value={replyText} onChange={(e) => setReplyText(e.target.value)}
                                        placeholder="Écrire un message au client/rider..."
                                        className="flex-1 bg-transparent border-none py-3 text-sm font-bold text-slate-700 outline-none resize-none placeholder:text-slate-300"
                                        onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); }}}
                                    />
                                    <button 
                                        type="submit" disabled={!replyText.trim()}
                                        className={`p-4 rounded-2xl transition-all active:scale-90 ${replyText.trim() ? 'bg-wink-black text-wink-yellow' : 'bg-slate-200 text-slate-400'}`}
                                    >
                                        <Send size={20} fill="currentColor"/>
                                    </button>
                                </form>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-200">
                        <MessageCircle size={80} strokeWidth={1} className="mb-6 opacity-20"/>
                        <p className="text-xs font-black uppercase tracking-[4px]">Sélectionnez une discussion</p>
                    </div>
                )}
            </div>
        </div>
    );
}

const QuickReply = ({ label, text, onClick }) => (
    <button 
        type="button" onClick={() => onClick(text)}
        className="shrink-0 px-4 py-2 bg-white border border-slate-200 hover:border-wink-black rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-tighter transition-all flex items-center gap-2 shadow-sm"
    >
        <Zap size={12} className="text-wink-yellow fill-current"/> {label}
    </button>
);