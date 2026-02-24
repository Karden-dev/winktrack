import React, { useState, useEffect } from 'react';
import { 
    Settings, Users, Shield, Bell, Save, 
    Lock, Globe, Smartphone, Power, Trash2, 
    Plus, Activity, Check, X, Loader2, ShieldAlert
} from 'lucide-react';
import api from '../../services/api'; //

export default function AdminSettingsPage() {
    const [activeTab, setActiveTab] = useState('GENERAL'); 
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // --- 1. CONFIGURATION RÉELLE ---
    const [config, setConfig] = useState({
        appName: "Wink Express",
        supportPhone: "+237 6xx xx xx xx",
        maintenanceMode: false,
        autoDispatch: true,
        maxSearchRadius: 5
    });

    const [team, setTeam] = useState([]);
    const [logs, setLogs] = useState([]);

    // --- 2. CHARGEMENT DES DONNÉES ---
    const fetchSettings = async () => {
        setLoading(true);
        try {
            // Ces routes récupèrent les variables d'environnement et la table des admins
            const [configRes, teamRes, logsRes] = await Promise.all([
                api.auth.getAppConfig(),
                api.auth.getAdminTeam(),
                api.auth.getAuditLogs()
            ]);

            if (configRes.data) setConfig(configRes.data);
            setTeam(teamRes.data || []);
            setLogs(logsRes.data || []);
        } catch (err) {
            console.error("Erreur Settings:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    // --- 3. ACTIONS ---

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Sauvegarde les modifications dans la table 'settings' ou fichier config
            await api.auth.updateAppConfig(config);
            alert("Configuration système mise à jour avec succès.");
        } catch (err) {
            alert("Erreur lors de la sauvegarde.");
        } finally {
            setIsSaving(false);
        }
    };

    const toggleMaintenance = async () => {
        const newState = !config.maintenanceMode;
        const msg = newState 
            ? "ATTENTION : Activer la maintenance bloquera toutes les commandes clients. Continuer ?" 
            : "Réactiver le service Wink Express immédiatement ?";
            
        if(window.confirm(msg)) {
            try {
                await api.auth.updateAppConfig({ ...config, maintenanceMode: newState });
                setConfig({ ...config, maintenanceMode: newState });
            } catch (err) { alert("Erreur réseau"); }
        }
    };

    if (loading && team.length === 0) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-wink-yellow" size={40}/></div>;

    return (
        <div className="flex h-full bg-slate-50 font-sans overflow-hidden">
            
            {/* SIDEBAR NAVIGATION (Wink Style) */}
            <div className="w-[280px] bg-white border-r border-slate-100 flex flex-col shadow-xl z-20">
                <div className="p-8 border-b border-slate-50 bg-slate-50/50">
                    <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Paramètres</h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Console de Contrôle</p>
                </div>
                <nav className="flex-1 p-6 space-y-2">
                    <MenuButton active={activeTab === 'GENERAL'} onClick={() => setActiveTab('GENERAL')} icon={Settings} label="Général & App" />
                    <MenuButton active={activeTab === 'TEAM'} onClick={() => setActiveTab('TEAM')} icon={Users} label="Équipe & Rôles" />
                    <MenuButton active={activeTab === 'SYSTEM'} onClick={() => setActiveTab('SYSTEM')} icon={Globe} label="Clés API & Passerelles" />
                    <MenuButton active={activeTab === 'LOGS'} onClick={() => setActiveTab('LOGS')} icon={Shield} label="Journal d'Audit" />
                </nav>
                <div className="p-6 border-t border-slate-50 text-[10px] font-bold text-slate-300 uppercase tracking-widest text-center">
                    Wink OS v3.5.2 (Stable)
                </div>
            </div>

            {/* CONTENU PRINCIPAL */}
            <div className="flex-1 overflow-y-auto p-12">
                
                {/* --- TAB: GÉNÉRAL --- */}
                {activeTab === 'GENERAL' && (
                    <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4">
                        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                            <h2 className="text-lg font-black text-slate-900 mb-8 uppercase tracking-tight flex items-center gap-3">
                                <Smartphone size={22} className="text-wink-yellow"/> Identité du Service
                            </h2>
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Nom Commercial</label>
                                    <input 
                                        type="text" value={config.appName}
                                        onChange={(e) => setConfig({...config, appName: e.target.value})}
                                        className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-wink-black outline-none shadow-inner"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Support WhatsApp</label>
                                    <input 
                                        type="text" value={config.supportPhone}
                                        onChange={(e) => setConfig({...config, supportPhone: e.target.value})}
                                        className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-wink-black outline-none shadow-inner"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                            <h2 className="text-lg font-black text-slate-900 mb-8 uppercase tracking-tight flex items-center gap-3">
                                <Power size={22} className="text-red-500"/> Urgence & Maintenance
                            </h2>
                            
                            <div className="space-y-4">
                                <div className={`flex items-center justify-between p-6 rounded-[24px] border-2 transition-all ${config.maintenanceMode ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-transparent'}`}>
                                    <div className="flex gap-4 items-start">
                                        <div className={`p-3 rounded-2xl ${config.maintenanceMode ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                            <ShieldAlert size={24}/>
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-900 text-sm uppercase tracking-tight">Mode Maintenance</p>
                                            <p className="text-xs text-slate-400 font-medium">Coupe l'accès aux commandes pour tous les clients.</p>
                                        </div>
                                    </div>
                                    <button onClick={toggleMaintenance} className={`relative w-14 h-8 rounded-full transition-all ${config.maintenanceMode ? 'bg-red-500' : 'bg-slate-300'}`}>
                                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-md ${config.maintenanceMode ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[24px] border border-transparent">
                                    <div className="flex gap-4 items-start">
                                        <div className="p-3 bg-green-100 text-green-600 rounded-2xl">
                                            <Activity size={24}/>
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-900 text-sm uppercase tracking-tight">Dispatch Automatique</p>
                                            <p className="text-xs text-slate-400 font-medium">L'algorithme assigne les livreurs sans intervention humaine.</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setConfig({...config, autoDispatch: !config.autoDispatch})} className={`relative w-14 h-8 rounded-full transition-all ${config.autoDispatch ? 'bg-green-500' : 'bg-slate-300'}`}>
                                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-md ${config.autoDispatch ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={handleSave} disabled={isSaving}
                            className="w-full py-5 bg-wink-black text-white rounded-[24px] font-black text-xs uppercase tracking-[2px] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
                            {isSaving ? <Loader2 className="animate-spin"/> : <><Save size={20} className="text-wink-yellow"/> Enregistrer la Configuration</>}
                        </button>
                    </div>
                )}

                {/* --- TAB: TEAM (Accès réel aux Admins) --- */}
                {activeTab === 'TEAM' && (
                    <div className="space-y-8 animate-in fade-in">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Équipe Administrative</h2>
                            <button className="bg-wink-black text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 shadow-lg">
                                <Plus size={16} className="text-wink-yellow mr-2 inline"/> Recruter un Admin
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {team.map(member => (
                                <div key={member.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex justify-between items-center">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 bg-slate-900 text-wink-yellow rounded-2xl flex items-center justify-center text-xl font-black">
                                            {member.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-900">{member.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{member.role}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-2 h-2 rounded-full ${member.status === 'ACTIVE' ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                                        <button className="text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- TAB: SYSTEM (Sécurité des clés) --- */}
                {activeTab === 'SYSTEM' && (
                    <div className="max-w-2xl space-y-8 animate-in fade-in">
                        <div className="bg-wink-black p-8 rounded-[32px] text-white">
                            <h3 className="text-lg font-black uppercase tracking-widest flex items-center gap-3 mb-6">
                                <Lock size={22} className="text-wink-yellow"/> Sécurité API
                            </h3>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Passerelle Campay (Secret)</label>
                                    <div className="flex gap-4">
                                        <input type="password" value="••••••••••••••••••••" disabled className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-mono text-slate-400"/>
                                        <button className="px-6 py-4 bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all">Gérer</button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Google Cloud Platform Key</label>
                                    <div className="flex gap-4">
                                        <input type="password" value="••••••••••••••••••••" disabled className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-mono text-slate-400"/>
                                        <button className="px-6 py-4 bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all">Gérer</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- TAB: LOGS (Audit réel) --- */}
                {activeTab === 'LOGS' && (
                    <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in">
                        <div className="p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm">Traçabilité des Actions</h3>
                            <span className="text-[9px] font-black bg-wink-black text-white px-3 py-1 rounded-full uppercase tracking-[2px]">Journal 24h</span>
                        </div>
                        <table className="w-full text-left text-sm">
                            <tbody className="divide-y divide-slate-50">
                                {logs.map(log => (
                                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-5 w-32 text-slate-400 font-mono text-[10px] uppercase">{log.time}</td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <span className="font-black text-slate-900 text-xs">{log.user}</span>
                                                <span className="text-[9px] font-black bg-slate-100 px-2 py-0.5 rounded text-slate-500 uppercase tracking-tighter">{log.action}</span>
                                            </div>
                                            <p className="text-[11px] text-slate-400 font-medium mt-1">{log.details}</p>
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

// --- COMPOSANTS UI ---

const MenuButton = ({ active, onClick, icon: Icon, label }) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-4 px-5 py-4 rounded-[20px] text-[11px] font-black uppercase tracking-widest transition-all ${
            active 
            ? 'bg-wink-black text-white shadow-xl shadow-black/10' 
            : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
        }`}
    >
        <Icon size={18} className={active ? 'text-wink-yellow' : 'text-slate-300'} />
        {label}
    </button>
);