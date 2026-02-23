import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
    User, Moon, Sun, ChevronRight, ShieldCheck, Truck, 
    AlertTriangle, Camera, LogOut, FileText, Star, Clock, 
    MapPin, Smartphone, HelpCircle, Lock, UploadCloud, Loader2, CheckCircle
} from 'lucide-react';
import WinkButton from '../../components/WinkButton';
import api from '../../services/api'; 

export default function ProfilePage() {
    const { darkMode, setDarkMode } = useOutletContext();
    const myPhone = localStorage.getItem('wink_phone') || "237 6xx xxx xxx";

    // --- ÉTATS RÉELS ---
    const [rider, setRider] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Références pour les inputs de fichiers cachés
    const fileInputRefs = {
        cni: useRef(null),
        license: useRef(null),
        greyCard: useRef(null)
    };

    // --- 1. CHARGEMENT DU PROFIL ---
    const fetchProfile = async () => {
        try {
            const res = await api.rider.getStats(); 
            setRider(res.data);
        } catch (err) {
            console.error("Erreur profil:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    // --- 2. ACTIONS D'UPLOAD ---
    const handleFileSelect = async (type, e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Vérification de taille (5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert("Le fichier est trop lourd (max 5Mo)");
            return;
        }

        const formData = new FormData();
        formData.append('riderId', rider.id);
        formData.append(type, file); // 'cni', 'license' ou 'greyCard'

        setUploading(true);
        try {
            const res = await api.rider.uploadDoc(formData);
            if (res.data.success) {
                alert(`${type.toUpperCase()} mis à jour avec succès !`);
                await fetchProfile(); // Recharger pour voir le changement de statut
            }
        } catch (err) {
            console.error("Erreur upload:", err);
            alert("Erreur lors de l'envoi du document.");
        } finally {
            setUploading(false);
        }
    };

    const handleEquipmentUpdate = async (key, value) => {
        try {
            await api.rider.updateEquipment({ [key]: value });
            setRider(prev => ({
                ...prev,
                equipment: { ...prev.equipment, [key]: value },
                // Mise à jour directe selon la structure reçue
                [key]: value 
            }));
        } catch (err) {
            alert("Erreur lors de la mise à jour de l'équipement.");
        }
    };

    const handleLogout = () => {
        if(confirm("Se déconnecter ?")) {
            localStorage.removeItem('wink_token');
            localStorage.removeItem('wink_phone');
            window.location.href = '/rider/login';
        }
    };

    const openWhatsAppSupport = () => {
        window.open(`https://wa.me/237600000000?text=Bonjour Support Wink, je suis le livreur ${rider?.first_name}`, "_blank");
    };

    // --- RENDU ---
    const textMuted = darkMode ? "text-gray-400" : "text-gray-500";

    if (loading) return <div className="h-[60vh] flex items-center justify-center"><Loader2 className="animate-spin text-wink-yellow" size={32}/></div>;

    return (
        <div className="p-4 space-y-6 pb-24 font-sans animate-in fade-in bg-transparent">
            
            {/* 1. HERO SECTION */}
            <div className="flex items-center gap-5 mt-4">
                <div className="relative">
                    <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-[32px] flex items-center justify-center text-4xl border-4 border-white dark:border-gray-900 shadow-2xl overflow-hidden">
                        {rider.avatar_url ? <img src={rider.avatar_url} alt="Profile" className="w-full h-full object-cover"/> : "🏍️"}
                    </div>
                    <button className="absolute -bottom-1 -right-1 bg-wink-black text-white p-2 rounded-2xl border-2 border-white dark:border-gray-900 shadow-lg">
                        <Camera size={14} />
                    </button>
                </div>
                <div className="flex-1">
                    <h1 className="text-2xl font-black leading-tight text-gray-900 dark:text-white">
                        {rider.first_name} {rider.last_name}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                        <StatusBadge status={rider.status} />
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${textMuted} flex items-center gap-1`}>
                            <Clock size={12}/> Depuis {new Date(rider.created_at).getFullYear()}
                        </span>
                    </div>
                </div>
            </div>

            {/* 2. STATS DE PERFORMANCE */}
            <div className="grid grid-cols-2 gap-4">
                <StatCard label="Note" value={rider.stats?.rating || '5.0'} sub={`${rider.stats?.reviews_count || 0} avis`} icon={Star} color="text-wink-yellow" darkMode={darkMode} />
                <StatCard label="Distance" value={`${rider.total_km || 0} km`} sub="Total cumulé" icon={MapPin} color="text-blue-500" darkMode={darkMode} />
                <StatCard label="Acceptation" value={`${rider.stats?.acceptanceRate || 100}%`} sub="Qualité Pro" icon={ShieldCheck} color="text-green-500" darkMode={darkMode} />
                <StatCard label="Missions" value={rider.stats?.completedOrders || 0} sub="Livrées" icon={Truck} color="text-purple-500" darkMode={darkMode} />
            </div>

            {/* 3. KYC (Vérification Documents Réelle) */}
            <Section title="Vérification Documents" icon={FileText} darkMode={darkMode}>
                <div className="space-y-1">
                    {uploading && (
                        <div className="flex items-center gap-2 text-[10px] font-bold text-wink-yellow animate-pulse mb-2">
                            <Loader2 size={12} className="animate-spin" /> ENVOI EN COURS...
                        </div>
                    )}
                    {rider.documents?.map((doc) => (
                        <div key={doc.id} className={`py-4 flex justify-between items-center border-b last:border-0 ${darkMode ? 'border-gray-700' : 'border-gray-50'}`}>
                            <div>
                                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{doc.label}</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                                    {doc.status === 'VALID' ? 'Document validé' : 'Action Requise'}
                                </p>
                            </div>
                            
                            {doc.status === 'VALID' ? (
                                <div className="bg-green-100 p-2 rounded-xl"><CheckCircle size={16} className="text-green-600"/></div>
                            ) : (
                                <>
                                    <input 
                                        type="file" 
                                        ref={el => fileInputRefs[doc.label.toLowerCase().replace(' ', '')] = el}
                                        className="hidden" 
                                        accept="image/*,.pdf"
                                        onChange={(e) => handleFileSelect(doc.label === 'CNI' ? 'cni' : doc.label === 'Permis' ? 'license' : 'greyCard', e)}
                                    />
                                    <button 
                                        onClick={() => {
                                            const key = doc.label === 'CNI' ? 'cni' : doc.label === 'Permis' ? 'license' : 'greyCard';
                                            // Déclencher l'input correspondant
                                            const input = document.createElement('input');
                                            input.type = 'file';
                                            input.accept = 'image/*,application/pdf';
                                            input.onchange = (e) => handleFileSelect(key, e);
                                            input.click();
                                        }}
                                        className="bg-wink-black text-white text-[9px] font-black px-4 py-2 rounded-xl flex items-center gap-2"
                                    >
                                        <UploadCloud size={12}/> ENVOYER
                                    </button>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </Section>

            {/* 4. LOGISTIQUE */}
            <Section title="Matériel & Transport" icon={Truck} darkMode={darkMode}>
                <div className="space-y-4">
                    <EquipToggle label="Sac Isotherme Wink" checked={rider.settings?.isOnline} // Exemple de liaison
                        onChange={() => handleEquipmentUpdate('has_bag', !rider.has_bag)} darkMode={darkMode} />
                    <EquipToggle label="Support Smartphone" checked={rider.has_mount} 
                        onChange={() => handleEquipmentUpdate('has_mount', !rider.has_mount)} darkMode={darkMode} />
                </div>
            </Section>

            {/* 5. PRÉFÉRENCES */}
            <Section title="Préférences" icon={Smartphone} darkMode={darkMode}>
                <button onClick={() => setDarkMode(!darkMode)} className="w-full py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        {darkMode ? <Moon size={18} className="text-wink-yellow"/> : <Sun size={18} className="text-wink-yellow"/>}
                        <span className="text-sm font-bold">Mode {darkMode ? 'Sombre' : 'Clair'}</span>
                    </div>
                    <div className={`w-12 h-7 rounded-full relative transition-colors ${darkMode ? 'bg-wink-yellow' : 'bg-gray-200'}`}>
                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-md ${darkMode ? 'left-6' : 'left-1'}`}></div>
                    </div>
                </button>
            </Section>

            {/* FOOTER */}
            <div className="space-y-4 pt-4">
                <WinkButton variant="primary" onClick={openWhatsAppSupport}>SUPPORT WHATSAPP 24/7</WinkButton>
                <button onClick={handleLogout} className="w-full py-5 text-red-500 font-black text-xs uppercase tracking-[2px] flex items-center justify-center gap-3 opacity-50">
                    <LogOut size={16} /> Déconnexion ({myPhone})
                </button>
                <p className="text-center text-[9px] font-black text-gray-400 uppercase tracking-widest">
                    Wink Rider Engine v3.2 • Driver ID: {rider.id}
                </p>
            </div>
        </div>
    );
}

// --- SOUS-COMPOSANTS ---
const Section = ({ title, icon: Icon, children, darkMode }) => (
    <div className={`p-6 rounded-[32px] border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
        <h3 className="font-black text-[10px] uppercase text-gray-400 mb-6 flex items-center gap-2 tracking-widest">
            <Icon size={14} className="text-wink-yellow"/> {title}
        </h3>
        {children}
    </div>
);

const StatusBadge = ({ status }) => {
    const isVerified = status === 'ACTIVE' || status === 'VERIFIED';
    return (
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${isVerified ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
            {isVerified ? <ShieldCheck size={12} /> : <Clock size={12} />}
            {isVerified ? "Vérifié" : "En Examen"}
        </div>
    );
};

const StatCard = ({ label, value, sub, icon: Icon, color, darkMode }) => (
    <div className={`p-5 rounded-[28px] border flex flex-col items-center justify-center text-center ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
        <Icon size={24} className={`mb-2 ${color} fill-current opacity-20`} />
        <p className="text-2xl font-black leading-none">{value}</p>
        <p className="text-[9px] font-black uppercase text-gray-400 mt-2 tracking-tighter">{label}</p>
        <p className="text-[8px] text-gray-300 font-bold">{sub}</p>
    </div>
);

const EquipToggle = ({ label, checked, onChange, darkMode }) => (
    <div onClick={onChange} className="flex justify-between items-center cursor-pointer group">
        <span className={`text-xs font-bold transition-colors ${checked ? 'text-green-500' : 'text-gray-400'}`}>{label}</span>
        <div className={`w-12 h-7 rounded-full relative transition-all ${checked ? 'bg-green-500' : (darkMode ? 'bg-gray-700' : 'bg-gray-200')}`}>
            <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-md ${checked ? 'left-6' : 'left-1'}`}></div>
        </div>
    </div>
);