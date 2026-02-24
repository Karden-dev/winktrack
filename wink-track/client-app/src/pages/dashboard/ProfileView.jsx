import React, { useState } from 'react';
import { User, CreditCard } from 'lucide-react';
import WinkInput from '../../components/WinkInput';
import WinkButton from '../../components/WinkButton';
import api from '../../services/api';

export default function ProfileView({ user, setUser }) {
    const [formData, setFormData] = useState({ ...user });
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        try {
            await api.clients.updateProfile(user.phone, {
                firstName: formData.firstName,
                lastName: formData.lastName,
                paymentNumber: formData.paymentNumber
            });
            setUser(formData);
            alert("Profil mis à jour !");
        } catch (err) {
            alert("Erreur lors de la mise à jour");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100">
            <h2 className="text-2xl font-black mb-8 flex items-center gap-3"><User className="text-wink-yellow" size={28}/> Mon Profil</h2>
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <WinkInput label="Prénom" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} />
                    <WinkInput label="Nom" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} />
                </div>
                <WinkInput 
                    label="Numéro Mobile Money (Paiement)" 
                    value={formData.paymentNumber} 
                    onChange={(e) => setFormData({...formData, paymentNumber: e.target.value})} 
                    icon={CreditCard} 
                    placeholder="6xx xx xx xx" 
                />
                <div className="pt-4">
                    <WinkButton variant="primary" onClick={handleSave} isLoading={loading}>Sauvegarder</WinkButton>
                </div>
            </div>
        </div>
    );
}