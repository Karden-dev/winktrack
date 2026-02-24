import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Circle, Marker } from '@react-google-maps/api';
import { 
    Search, Edit2, Save, Plus, Trash2, 
    AlertCircle, DollarSign, Navigation, 
    CheckCircle, XCircle, Zap, Loader2, MapPin, X
} from 'lucide-react';
import api from '../../services/api';

const mapContainerStyle = { width: '100%', height: '100%' };
const defaultCenter = { lat: 3.8480, lng: 11.5021 }; // Yaoundé
const LIBRARIES = ['places'];

export default function AdminZonesPage() {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        libraries: LIBRARIES
    });

    const [map, setMap] = useState(null);
    const [zones, setZones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedZone, setSelectedZone] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [predictions, setPredictions] = useState([]);

    const fetchZones = async () => {
        try {
            const res = await api.auth.getAllZones();
            setZones(res.data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchZones(); }, []);

    // --- LOGIQUE NOUVELLE ZONE ---
    const handleStartCreate = () => {
        const newZoneTemplate = {
            name: "Nouveau Quartier",
            lat: map ? map.getCenter().lat() : defaultCenter.lat,
            lng: map ? map.getCenter().lng() : defaultCenter.lng,
            radius: 1500,
            base_price: 1000,
            price_per_km: 150,
            status: 'ACTIVE',
            is_surge: 0
        };
        setSelectedZone(newZoneTemplate);
        setIsEditing(true);
        setIsCreating(true);
        // On centre la carte sur le nouveau point
        map?.panTo({ lat: newZoneTemplate.lat, lng: newZoneTemplate.lng });
    };

    const onMapClick = useCallback((e) => {
        if (isEditing) {
            setSelectedZone(prev => ({
                ...prev,
                lat: e.latLng.lat(),
                lng: e.latLng.lng()
            }));
        }
    }, [isEditing]);

    const handleSaveZone = async () => {
        try {
            if (isCreating) {
                await api.auth.createZone(selectedZone);
                alert("✅ Zone créée avec succès !");
            } else {
                await api.auth.updateZone(selectedZone.id, selectedZone);
                alert("✅ Zone mise à jour !");
            }
            setIsEditing(false);
            setIsCreating(false);
            fetchZones();
        } catch (err) { 
            alert("❌ Erreur : " + (err.response?.data?.error || "Impossible d'enregistrer")); 
        }
    };

    const handleDeleteZone = async (id) => {
        if (window.confirm("Supprimer définitivement cette zone ?")) {
            try {
                await api.auth.deleteZone(id);
                setSelectedZone(null);
                fetchZones();
            } catch (err) { alert("Erreur suppression"); }
        }
    };

    // --- AUTOCOMPLETE ---
    const handleSearch = async (val) => {
        setSearchQuery(val);
        if (val.length > 2) {
            try {
                const res = await api.auth.autocomplete(val);
                setPredictions(res.data.predictions || []);
            } catch (err) { console.error(err); }
        } else { setPredictions([]); }
    };

    const selectLocation = async (placeId) => {
        setPredictions([]);
        setSearchQuery('');
        try {
            const res = await api.auth.getDetails(placeId);
            if (res.data.success && map) {
                const newPos = { lat: res.data.lat, lng: res.data.lng };
                map.panTo(newPos);
                if (isEditing) setSelectedZone(prev => ({ ...prev, ...newPos }));
            }
        } catch (err) { console.error(err); }
    };

    if (!isLoaded || (loading && zones.length === 0)) {
        return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-wink-yellow" size={40}/></div>;
    }

    return (
        <div className="flex h-full bg-white font-sans overflow-hidden">
            
            {/* SIDEBAR */}
            <div className="w-[380px] flex flex-col border-r border-slate-100 bg-white z-10 shadow-2xl">
                <div className="p-8 border-b bg-slate-50/50">
                    <h1 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-4">Zones de Livraison</h1>
                    
                    <button 
                        onClick={handleStartCreate}
                        className="w-full py-4 bg-wink-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl hover:bg-slate-800 cursor-pointer"
                    >
                        <Plus size={18} className="text-wink-yellow"/> Nouvelle Zone
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-3">
                    {zones.length === 0 ? (
                        <p className="text-center text-slate-400 text-xs font-bold py-10 uppercase">Aucune zone définie</p>
                    ) : zones.map(zone => (
                        <div 
                            key={zone.id}
                            onClick={() => {
                                setSelectedZone(zone);
                                setIsEditing(false);
                                setIsCreating(false);
                                map?.panTo({ lat: parseFloat(zone.lat), lng: parseFloat(zone.lng) });
                            }}
                            className={`p-5 rounded-[24px] border transition-all cursor-pointer ${
                                selectedZone?.id === zone.id ? 'border-wink-black bg-slate-50 ring-2 ring-wink-black/5' : 'border-slate-100 bg-white hover:border-slate-300'
                            }`}
                        >
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-black text-slate-900 text-xs uppercase">{zone.name}</span>
                                <div className={`w-2 h-2 rounded-full ${zone.status === 'ACTIVE' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-slate-300'}`}></div>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400">{zone.base_price} F + {zone.price_per_km} F/km</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* MAP SECTION */}
            <div className="flex-1 relative">
                
                {/* SEARCH BAR */}
                <div className="absolute top-6 left-6 z-20 w-96">
                    <div className="bg-white rounded-2xl shadow-2xl flex items-center px-5 py-3.5 border border-slate-100">
                        <Search size={18} className="text-slate-400 mr-3" />
                        <input 
                            className="flex-1 outline-none text-sm font-bold text-slate-700"
                            placeholder="Centrer la carte sur un lieu..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                        {searchQuery && <X size={16} className="text-slate-300 cursor-pointer" onClick={() => setSearchQuery('')}/>}
                    </div>
                    {predictions.length > 0 && (
                        <div className="mt-2 bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95">
                            {predictions.map(p => (
                                <button 
                                    key={p.place_id} onClick={() => selectLocation(p.place_id)}
                                    className="w-full text-left p-4 hover:bg-slate-50 text-xs font-bold text-slate-600 border-b border-slate-50 last:border-0 flex items-center gap-3"
                                >
                                    <MapPin size={14} className="text-wink-yellow"/> {p.description}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={defaultCenter}
                    zoom={12}
                    onLoad={m => setMap(m)}
                    onClick={onMapClick}
                    options={{ disableDefaultUI: true, clickableIcons: false }}
                >
                    {/* Zones existantes */}
                    {zones.map(zone => (
                        <Circle
                            key={zone.id}
                            center={{ lat: parseFloat(zone.lat), lng: parseFloat(zone.lng) }}
                            radius={parseInt(zone.radius)}
                            options={{
                                strokeColor: zone.status === 'INACTIVE' ? '#94a3b8' : (zone.is_surge ? '#ef4444' : '#1e293b'),
                                strokeOpacity: 0.5,
                                strokeWeight: 1,
                                fillColor: zone.status === 'INACTIVE' ? '#94a3b8' : (zone.is_surge ? '#ef4444' : '#fbbf24'),
                                fillOpacity: 0.15,
                            }}
                            onClick={() => { setSelectedZone(zone); setIsEditing(false); setIsCreating(false); }}
                        />
                    ))}

                    {/* Zone active (Édition ou Sélection) */}
                    {selectedZone && (
                        <Circle
                            center={{ lat: parseFloat(selectedZone.lat), lng: parseFloat(selectedZone.lng) }}
                            radius={parseInt(selectedZone.radius)}
                            options={{
                                strokeColor: isCreating ? '#fbbf24' : (selectedZone.is_surge ? '#ef4444' : '#1e293b'),
                                strokeOpacity: 1,
                                strokeWeight: 3,
                                fillColor: isCreating ? '#fbbf24' : (selectedZone.is_surge ? '#ef4444' : '#fbbf24'),
                                fillOpacity: 0.35,
                            }}
                        />
                    )}
                </GoogleMap>

                {/* MODALE FLOTTANTE */}
                {selectedZone && (
                    <div className="absolute top-6 right-6 z-20 w-80 bg-white rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden animate-in slide-in-from-right">
                        <div className={`p-6 text-white flex justify-between items-center ${isCreating ? 'bg-wink-yellow text-black' : 'bg-slate-900'}`}>
                            <span className="text-[10px] font-black uppercase tracking-widest">
                                {isCreating ? '🆕 Nouvelle Zone' : '⚙️ Configuration'}
                            </span>
                            <button onClick={() => { setSelectedZone(null); setIsEditing(false); setIsCreating(false); }} className="p-1 hover:bg-white/10 rounded-full"><X size={18}/></button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase block mb-2 tracking-widest">Nom du quartier</label>
                                <input 
                                    type="text" disabled={!isEditing} value={selectedZone.name}
                                    onChange={(e) => setSelectedZone({...selectedZone, name: e.target.value})}
                                    className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-wink-black"
                                />
                            </div>

                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase block mb-2 tracking-widest">Rayon ({selectedZone.radius}m)</label>
                                <input 
                                    type="range" min="500" max="10000" step="100" 
                                    disabled={!isEditing} value={selectedZone.radius}
                                    onChange={(e) => setSelectedZone({...selectedZone, radius: parseInt(e.target.value)})}
                                    className="w-full accent-wink-black cursor-pointer"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase block mb-2">Base (F)</label>
                                    <input type="number" disabled={!isEditing} value={selectedZone.base_price} onChange={e => setSelectedZone({...selectedZone, base_price: e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl text-sm font-bold outline-none" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase block mb-2">Km (F)</label>
                                    <input type="number" disabled={!isEditing} value={selectedZone.price_per_km} onChange={e => setSelectedZone({...selectedZone, price_per_km: e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl text-sm font-bold outline-none" />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                {!isEditing ? (
                                    <>
                                        <button onClick={() => setIsEditing(true)} className="flex-1 py-4 bg-slate-100 text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"><Edit2 size={14}/> Éditer</button>
                                        <button onClick={() => handleDeleteZone(selectedZone.id)} className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18}/></button>
                                    </>
                                ) : (
                                    <button onClick={handleSaveZone} className="w-full py-5 bg-wink-black text-white rounded-[24px] font-black text-[11px] uppercase tracking-[2px] shadow-2xl flex items-center justify-center gap-3">
                                        <Save size={18} className="text-wink-yellow"/> Enregistrer
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}