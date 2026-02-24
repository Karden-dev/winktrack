import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Lock, ArrowRight, Loader, Star, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import api from '../../services/api'; 

export default function RiderLogin() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null); 
    const [activeSlide, setActiveSlide] = useState(0);
    const [formData, setFormData] = useState({ phone: '', pin: '' });

    // Arguments de vente
    const slides = [
        { 
            text: "Gagne jusqu'à 10.000F / jour 💸", 
            sub: "Revenus garantis et payés cash.",
            icon: <TrendingUp size={32} className="text-green-400 mb-4"/> 
        },
        { 
            text: "Sois ton propre Patron 👑", 
            sub: "Connexion libre. Zéro contrainte.",
            icon: <Star size={32} className="text-yellow-400 mb-4"/> 
        },
        { 
            text: "Livraisons dans ta Zone 📍", 
            sub: "Optimise tes trajets et ton carburant.",
            icon: <Clock size={32} className="text-blue-400 mb-4"/> 
        }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveSlide((prev) => (prev + 1) % slides.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    /**
     * ✅ LOGIQUE DE CONNEXION RÉELLE
     */
    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            // Nettoyage du numéro de téléphone
            const cleanPhone = formData.phone.replace(/\s+/g, '');
            
            // Appel au backend via api.js
            // formData.pin sera reçu comme 'password' par le backend
            const response = await api.auth.loginRider(cleanPhone, formData.pin);

            if (response.data.success) {
                // ✅ Stockage harmonisé sur 'wink_token' pour api.js
                localStorage.setItem('wink_token', response.data.token);
                // On stocke les infos pour le Radar/Profil
                localStorage.setItem('wink_rider_data', JSON.stringify(response.data.rider));
                
                // Redirection vers le Radar
                navigate('/rider/radar');
            }
        } catch (err) {
            console.error("Erreur login:", err);
            setError(err.response?.data?.message || "Numéro ou PIN incorrect");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen w-full bg-slate-900 font-sans overflow-hidden relative">
            
            <div className="flex-1 relative flex flex-col justify-center items-center px-6 text-center z-10">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-green-500 via-slate-900 to-slate-900"></div>
                
                <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mb-8 shadow-2xl shadow-green-500/50 transform -rotate-3">
                    <span className="font-black text-slate-900 text-3xl">W</span>
                </div>

                <div className="h-32 flex flex-col items-center justify-center transition-all duration-500">
                    <div className="animate-in fade-in slide-in-from-bottom duration-700">
                        {slides[activeSlide].icon}
                        <h1 className="text-3xl font-black text-white mb-2 leading-tight">
                            {slides[activeSlide].text}
                        </h1>
                        <p className="text-slate-400 font-medium">
                            {slides[activeSlide].sub}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2 mt-6">
                    {slides.map((_, idx) => (
                        <div key={idx} className={`h-1.5 rounded-full transition-all duration-300 ${idx === activeSlide ? 'w-8 bg-green-500' : 'w-2 bg-slate-700'}`}></div>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-t-[2.5rem] p-8 pb-4 shadow-2xl z-20 animate-in slide-in-from-bottom duration-500">
                
                <h2 className="text-xl font-black text-gray-800 mb-6">Connexion Livreur</h2>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 flex items-center gap-2 text-sm font-bold border border-red-100 animate-shake">
                        <AlertCircle size={18}/> {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-xl flex items-center px-4 py-3 focus-within:border-green-500 transition-colors">
                        <Phone className="text-gray-400 mr-3" size={20}/>
                        <input 
                            type="tel" 
                            placeholder="N° Téléphone"
                            className="bg-transparent font-bold text-gray-800 w-full outline-none"
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            required
                        />
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl flex items-center px-4 py-3 focus-within:border-green-500 transition-colors">
                        <Lock className="text-gray-400 mr-3" size={20}/>
                        <input 
                            type="password" 
                            inputMode="numeric"
                            maxLength={4}
                            placeholder="Code PIN (4 chiffres)"
                            className="bg-transparent font-bold text-gray-800 w-full outline-none"
                            value={formData.pin}
                            onChange={(e) => setFormData({...formData, pin: e.target.value.replace(/\D/g, '')})}
                            required
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-transform flex justify-center items-center gap-2 disabled:opacity-70"
                    >
                        {isLoading ? <Loader className="animate-spin" size={20}/> : "SE CONNECTER"}
                    </button>
                </form>

                <div className="mt-6 text-center border-t border-gray-100 pt-4">
                    <p className="text-xs text-gray-400 font-bold mb-2 uppercase">Nouveau sur Wink ?</p>
                    <button 
                        onClick={() => navigate('/rider/register')} 
                        className="w-full py-3 border-2 border-green-500 text-green-600 rounded-xl font-black text-sm uppercase hover:bg-green-50 transition-colors flex items-center justify-center gap-2"
                    >
                        Créer un compte livreur <ArrowRight size={16}/>
                    </button>
                </div>
            </div>
        </div>
    );
}