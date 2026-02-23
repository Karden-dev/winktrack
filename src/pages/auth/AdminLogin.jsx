import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Loader, AlertCircle } from 'lucide-react';
import api from '../../services/api'; // Import de ton service API

export default function AdminLogin() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({ email: '', password: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // APPEL RÉEL AU BACKEND
            // On envoie 'email' dans le champ 'username' attendu par le contrôleur
            const res = await api.auth.loginAdmin(formData.email, formData.password);
            
            if (res.data.success) {
                // 1. Stockage des informations de session
                localStorage.setItem('wink_token', res.data.token);
                localStorage.setItem('wink_user_role', 'ADMIN');
                
                // 2. Redirection vers le dashboard admin
                navigate('/admin/dashboard', { replace: true });
            }
        } catch (err) {
            // Gestion des erreurs (Identifiants incorrects ou serveur HS)
            const message = err.response?.data?.error || "Impossible de se connecter au serveur.";
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-screen w-full bg-white font-sans overflow-hidden notranslate" translate="no">
            
            {/* 1. GAUCHE : VISUEL MARQUE (Desktop Only) */}
            <div className="hidden lg:flex w-1/2 bg-slate-900 relative items-center justify-center overflow-hidden">
                <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1616401784845-180886ba9ca8?q=80&w=2574&auto=format&fit=crop')] bg-cover bg-center"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
                
                <div className="relative z-10 p-12 text-white max-w-lg">
                    <div className="w-16 h-16 bg-wink-yellow rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-wink-yellow/20">
                        <span className="font-black text-slate-900 text-3xl">W</span>
                    </div>
                    <h1 className="text-5xl font-black mb-4 tracking-tight">Wink Express <br/>Back-Office.</h1>
                    <p className="text-lg text-slate-300 leading-relaxed">
                        Gérez votre flotte, suivez les livraisons en temps réel et analysez vos performances financières depuis une seule interface.
                    </p>
                </div>
            </div>

            {/* 2. DROITE : FORMULAIRE */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50">
                <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                    
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-black text-gray-900">Connexion Admin</h2>
                        <p className="text-sm text-gray-500 mt-2">Accès réservé au personnel autorisé.</p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600 text-sm font-bold">
                            <AlertCircle size={16}/> 
                            {/* Protection contre le bug removeChild : on enveloppe le texte dynamique */}
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        
                        {/* Email */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Professionnel</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 text-gray-400" size={20}/>
                                <input 
                                    type="email" 
                                    required
                                    placeholder="nom@wink.cm"
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all font-medium"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mot de Passe</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 text-gray-400" size={20}/>
                                <input 
                                    type="password" 
                                    required
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all font-medium"
                                    value={formData.password}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-black transition-all transform active:scale-95 flex items-center justify-center gap-2 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <Loader className="animate-spin"/>
                            ) : (
                                <span className="flex items-center gap-2">Se Connecter <ArrowRight size={20}/></span>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-gray-100 text-center text-xs text-gray-400">
                        &copy; 2024 Wink Express Systems. Secured by SSL.
                    </div>
                </div>
            </div>
        </div>
    );
}