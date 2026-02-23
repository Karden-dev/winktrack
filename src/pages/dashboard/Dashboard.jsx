import React, { useState, useEffect } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import api from '../../services/api';

// ✅ Import du Layout
import DashboardLayout from '../../components/layouts/DashboardLayout';

// ✅ Import des vues (Ajoutez PromoView ici)
import HomeView from './HomeView';
import ProfileView from './ProfileView';
import HistoryView from './HistoryView';
import WalletView from './WalletView';
import SupportView from './SupportView';
import PromoView from './PromoView'; // <--- NOUVEL IMPORT

export default function Dashboard() {
    const navigate = useNavigate();
    const myPhone = localStorage.getItem('wink_phone');
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [rides, setRides] = useState([]);

    useEffect(() => {
        if (!myPhone) return navigate('/');

        const fetchData = async () => {
            try {
                const [profileRes, historyRes] = await Promise.all([
                    api.clients.getProfile(myPhone),
                    api.clients.getHistory(myPhone)
                ]);
                
                if (profileRes.data) {
                    setUser({
                        firstName: profileRes.data.first_name || "Client",
                        lastName: profileRes.data.last_name || "",
                        phone: profileRes.data.phone,
                        paymentNumber: profileRes.data.payment_number || "",
                        balance: profileRes.data.wallet_balance || 0,
                    });
                }
                setRides(Array.isArray(historyRes.data) ? historyRes.data : []);
            } catch (err) {
                console.error("Erreur Dashboard:", err);
                if (err.response?.status === 401) handleLogout();
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [myPhone, navigate]);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    if (loading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
                <Loader2 className="animate-spin text-wink-yellow mb-4" size={40}/>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Chargement...</p>
            </div>
        );
    }

    return (
        <DashboardLayout user={user} onLogout={handleLogout}>
            <Routes>
                <Route path="/" element={<HomeView user={user} rides={rides.slice(0, 3)} />} />
                <Route path="/profile" element={<ProfileView user={user} setUser={setUser} />} />
                <Route path="/history" element={<HistoryView rides={rides} />} />
                <Route path="/wallet" element={<WalletView user={user} transactions={rides} />} />
                <Route path="/help" element={<SupportView />} />
                
                {/* ✅ AJOUT DE LA ROUTE PROMO */}
                <Route path="/promos" element={<PromoView user={user} />} />
            </Routes>
        </DashboardLayout>
    );
}