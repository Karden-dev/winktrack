import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
    Phone, User, MapPin, ArrowRight, CheckCircle, 
    Motorbike, Wallet, Zap, Star, Trophy, Rocket, Lock, AlertCircle
} from 'lucide-react';
import api from '../../services/api'; 

export default function RiderRegister() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [showSuccess, setShowSuccess] = useState(false);
    const [activeSlide, setActiveSlide] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        phone: '', 
        firstName: '', 
        lastName: '', 
        password: '', // Le code PIN à 4 chiffres
        city: 'Yaoundé'
    });

    const slides = [
        { 
            title: "Rejoins l'Élite 🚀", 
            sub: "La flotte la plus rapide du Cameroun.",
            color: "text-green-500"
        },
        { 
            title: "Gagne 10.000F / Jour 💸", 
            sub: "0% de commission sur tes 10 premières courses.",
            color: "text-yellow-400"
        },
        { 
            title: "Sois ton Propre Patron 👑", 
            sub: "Travaille quand tu veux, où tu veux.",
            color: "text-blue-400"
        }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveSlide((prev) => (prev + 1) % slides.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleNext = (e) => {
        e.preventDefault();
        setError(null);

        const cleanPhone = formData.phone.replace(/\s+/g, '');

        if (step === 1) {
            if (cleanPhone.length >= 9) {
                setStep(2);
            } else {
                setError("Veuillez entrer un numéro de téléphone valide.");
            }
        } else if (step === 2) {
            if (formData.firstName && formData.lastName && formData.password.length === 4) {
                triggerRegister();
            } else if (formData.password.length !== 4) {
                setError("Le code PIN doit contenir exactement 4 chiffres.");
            } else {
                setError("Veuillez remplir tous les champs.");
            }
        }
    };

    /**
     * ✅ LOGIQUE DE CRÉATION + CONNEXION DIRECTE
     */
    const triggerRegister = async () => {
        setLoading(true);
        setError(null);
        try {
            const finalData = {
                ...formData,
                phone: formData.phone.replace(/\s+/g, '')
            };

            const response = await api.auth.registerRider(finalData);
            
            if (response.data.success) {
                // 1. ✅ CONNEXION AUTOMATIQUE : Harmonisation sur 'wink_token'
                localStorage.setItem('wink_token', response.data.token);
                localStorage.setItem('wink_rider_data', JSON.stringify(response.data.rider));

                // 2. Animation de succès
                setShowSuccess(true);
                
                // 3. Redirection directe vers le radar sans repasser par le login
                setTimeout(() => {
                    navigate('/rider/radar');
                }, 2500);
            }
        } catch (err) {
            console.error("Erreur Inscription:", err);
            setError(err.response?.data?.message || "Une erreur est survenue lors de l'inscription.");
        } finally {
            setLoading(false);
        }
    };

    const handlePinChange = (e) => {
        const val = e.target.value.replace(/\D/g, ''); 
        if (val.length <= 4) {
            setFormData({...formData, password: val});
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-950 font-sans relative overflow-hidden">
            
            {showSuccess && (
                <div className="fixed inset-0 z-[100] bg-green-500 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-300">
                    <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mb-8 animate-bounce shadow-2xl">
                        <Rocket size={64} className="text-green-600 ml-1" />
                    </div>
                    <h2 className="text-5xl font-black text-slate-900 mb-4 tracking-tighter uppercase leading-none">C'EST PARTI !</h2>
                    <p className="text-slate-900 text-xl font-bold opacity-80 uppercase tracking-widest animate-pulse">Activation du compte...</p>
                </div>
            )}

            <div className="pt-16 pb-12 px-6 text-center relative z-10 h-64 flex flex-col justify-center">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-green-500 via-slate-950 to-slate-950"></div>
                
                <div className="animate-in fade-in slide-in-from-bottom duration-700 transition-all">
                    <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full mb-6">
                        <Zap size={14} className="text-green-400 fill-green-400"/>
                        <span className="text-[10px] font-black text-green-400 uppercase tracking-widest">Wink Express Recruit</span>
                    </div>
                    
                    <h1 className={`text-4xl font-black mb-3 tracking-tight leading-none transition-colors duration-500 ${slides[activeSlide].color}`}>
                        {slides[activeSlide].title}
                    </h1>
                    <p className="text-slate-400 font-bold text-sm max-w-xs mx-auto">
                        {slides[activeSlide].sub}
                    </p>
                </div>
            </div>

            <div className="flex justify-center gap-2 mb-8 px-12 relative z-10">
                <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= 1 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-slate-800'}`}></div>
                <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-slate-800'}`}></div>
            </div>

            <div className="flex-1 bg-white rounded-t-[3rem] p-8 shadow-[0_-20px_50px_-15px_rgba(0,0,0,0.5)] z-20">
                
                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-6 flex items-center gap-2 text-xs font-bold border border-red-100 animate-in fade-in slide-in-from-top">
                        <AlertCircle size={16}/> {error}
                    </div>
                )}

                <form onSubmit={handleNext} className="space-y-6">
                    {step === 1 && (
                        <div className="animate-in slide-in-from-right duration-500">
                            <label className="text-xs font-black text-slate-400 uppercase ml-1 block mb-2">Ton Numéro WhatsApp</label>
                            <div className="relative mb-8">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 font-black text-slate-900 border-r-2 pr-4 border-slate-100">
                                    <span className="text-xl">🇨🇲</span> +237
                                </div>
                                <input 
                                    type="tel" 
                                    autoFocus
                                    placeholder="6xx xx xx xx"
                                    className="w-full pl-32 pr-4 py-5 bg-slate-50 border-2 border-slate-50 focus:border-green-500 focus:bg-white rounded-2xl font-black text-2xl outline-none transition-all text-slate-900"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    required
                                />
                            </div>

                            <button type="submit" className="w-full bg-slate-950 text-white py-5 rounded-2xl font-black text-xl shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-transform group">
                                CONTINUER <ArrowRight size={24} className="text-green-500 group-hover:translate-x-1 transition-transform"/>
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="animate-in slide-in-from-right duration-500 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Prénom</label>
                                    <input 
                                        type="text" 
                                        placeholder="Jean"
                                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 focus:border-green-500 rounded-2xl font-bold text-lg outline-none"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nom</label>
                                    <input 
                                        type="text" 
                                        placeholder="Paul"
                                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 focus:border-green-500 rounded-2xl font-bold text-lg outline-none"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1">
                                    <Lock size={10}/> Choisis ton PIN de connexion (4 chiffres)
                                </label>
                                <input 
                                    type="password" 
                                    inputMode="numeric"
                                    placeholder="XXXX"
                                    maxLength={4}
                                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 focus:border-green-500 rounded-2xl font-black text-2xl tracking-[1rem] text-center outline-none"
                                    value={formData.password}
                                    onChange={handlePinChange}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase ml-1 block">Ta Ville 📍</label>
                                <div className="flex gap-2">
                                    {["Yaoundé", "Douala"].map(v => (
                                        <button 
                                            key={v}
                                            type="button"
                                            onClick={() => setFormData({...formData, city: v})}
                                            className={`flex-1 py-4 rounded-2xl text-sm font-black border-2 transition-all ${formData.city === v ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-100'}`}
                                        >
                                            {v}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button 
                                type="submit"
                                disabled={loading}
                                className={`w-full ${loading ? 'bg-slate-400' : 'bg-green-500'} text-slate-900 py-5 rounded-2xl font-black text-xl shadow-2xl active:scale-95 transition-transform flex items-center justify-center gap-3`}
                            >
                                {loading ? 'ACTIVATION...' : 'DEVENIR LIVREUR'} <Rocket size={24}/>
                            </button>
                        </div>
                    )}
                </form>

                <div className="mt-8 text-center">
                    <p className="text-xs font-bold text-slate-400 uppercase">
                        Déjà inscrit ? <Link to="/rider/login" className="text-slate-900 font-black border-b-2 border-green-500 ml-1">Se connecter</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}