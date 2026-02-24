import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Search, Package, Navigation, Check, Loader2, MapPin, X, AlertCircle } from 'lucide-react';
import WinkButton from '../components/WinkButton';
import WinkInput from '../components/WinkInput';
import { useOrder } from '../context/OrderContext'; 
import api from '../services/api'; // Centralisation des appels API

// --- CONFIGURATION STYLE ---
const mapContainerStyle = { width: '100%', height: '100%' };
const mapOptions = {
    disableDefaultUI: true, 
    zoomControl: false,
    gestureHandling: "greedy", 
    clickableIcons: false, 
    styles: [ { featureType: "poi", elementType: "labels", stylers: [{ visibility: "true" }] } ] // Carte plus propre
};
const LIBRARIES = ['places'];

export default function MapPage() {
    const navigate = useNavigate();
    const { updateOrder } = useOrder(); 

    // --- CHARGEMENT API GOOGLE ---
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        libraries: LIBRARIES
    });

    // --- ÉTATS CARTE ---
    const [map, setMap] = useState(null);
    const [center, setCenter] = useState({ lat: 3.8480, lng: 11.5021 });
    const [isDragging, setIsDragging] = useState(false);
    
    // --- ÉTATS RECHERCHE & ADRESSE ---
    const [addressLabel, setAddressLabel] = useState("Positionner la carte...");
    const [isLoadingAddress, setIsLoadingAddress] = useState(false);
    
    const [isSearchActive, setIsSearchActive] = useState(false); 
    const [searchQuery, setSearchQuery] = useState('');
    const [predictions, setPredictions] = useState([]);
    const [searchError, setSearchError] = useState(null);

    const [description, setDescription] = useState('');
    const [isSecurityChecked, setIsSecurityChecked] = useState(false);

    const timerRef = useRef(null);

    // --- 1. INITIALISATION ---
    const onLoad = useCallback((mapInstance) => {
        setMap(mapInstance);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                mapInstance.panTo(newPos);
                getAddress(newPos.lat, newPos.lng);
            },
            null,
            { enableHighAccuracy: true }
        );
    }, []);

    // --- 2. LOGIQUE PIN FIXE ---
    const handleBoundsChanged = () => {
        if (!map) return;
        setIsDragging(true);
        if (isSearchActive) setIsSearchActive(false); 
        if (timerRef.current) clearTimeout(timerRef.current);
    };

    const handleIdle = () => {
        if (!map) return;
        setIsDragging(false);
        const newCenter = map.getCenter();
        timerRef.current = setTimeout(() => {
            getAddress(newCenter.lat(), newCenter.lng());
        }, 600);
    };

    // --- 3. REVERSE GEOCODING (Via Backend Service) ---
    const getAddress = async (lat, lng) => {
        setIsLoadingAddress(true);
        try {
            const res = await api.google.reverseGeocode(lat, lng); //
            setAddressLabel(res.data.address || "Lieu inconnu");
        } catch (error) {
            setAddressLabel(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        } finally {
            setIsLoadingAddress(false);
        }
    };

    // --- 4. RECENTREMENT GPS AMÉLIORÉ ---
    const handleRecenter = () => {
        if (!map) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                map.panTo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                map.setZoom(17);
            },
            () => alert("Activez votre GPS pour vous localiser"),
            { enableHighAccuracy: true }
        );
    };

    // --- 5. RECHERCHE AUTOCOMPLETE (Via Backend Service) ---
    const handleSearch = async (val) => {
        setSearchQuery(val);
        setSearchError(null);
        if (val.length > 2) {
            try {
                const res = await api.google.autocomplete(val); //
                setPredictions(res.data.predictions || []);
            } catch (err) {
                setSearchError("Erreur de connexion");
            }
        } else {
            setPredictions([]);
        }
    };

    const selectPrediction = async (placeId) => {
        setIsLoadingAddress(true);
        try {
            // Utilise le service pour obtenir les coordonnées du lieu sélectionné
            const res = await api.google.getDetails(placeId); 
            if (res.data.success) {
                map.panTo({ lat: res.data.lat, lng: res.data.lng });
                setIsSearchActive(false);
                setSearchQuery('');
                setPredictions([]);
            }
        } catch (error) {
            alert("Lieu introuvable");
        } finally {
            setIsLoadingAddress(false);
        }
    };

    // --- 6. VALIDATION & PASSAGE AU RECIPIENT ---
    const handleNext = () => {
        if (!description.trim()) return alert("Décrivez brièvement le colis.");
        if (!isSecurityChecked) return alert("Veuillez accepter la clause de sécurité.");

        const currentPos = map.getCenter();
        updateOrder({
            pickupLocation: { lat: currentPos.lat(), lng: currentPos.lng() },
            pickupAddress: addressLabel,
            packageDescription: description
        }); //
        
        navigate('/recipient');
    };

    if (!isLoaded) return <div className="h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-wink-yellow" size={32}/></div>;

    return (
        <div className="h-screen w-screen relative overflow-hidden bg-white">
            
            {/* CARTE GOOGLE MAPS */}
            <div className="absolute inset-0 z-0">
                <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={center}
                    zoom={16}
                    options={mapOptions}
                    onLoad={onLoad}
                    onBoundsChanged={handleBoundsChanged}
                    onIdle={handleIdle}
                />
            </div>

            {/* PIN CENTRAL FIXE (Mobile-First UI) */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none flex flex-col items-center pb-[42px] transition-all duration-300 ${isDragging ? '-translate-y-6 scale-110' : ''}`}>
                <div className="bg-wink-black text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-2xl mb-3 flex items-center gap-2 whitespace-nowrap">
                    {isLoadingAddress ? <Loader2 size={12} className="animate-spin text-wink-yellow"/> : addressLabel}
                </div>
                <div className="relative flex items-center justify-center">
                    <div className="absolute w-12 h-12 bg-wink-yellow/40 rounded-full animate-ping"></div>
                    <MapPin size={46} className="text-wink-black fill-wink-yellow drop-shadow-xl" strokeWidth={2.5} />
                </div>
            </div>

            {/* BARRE DE RECHERCHE GLASSMORPHISM */}
            <div className="absolute top-4 left-4 right-4 z-20 space-y-2">
                <div className="flex gap-2">
                    <div className="flex-1 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 flex items-center h-14 px-4">
                        <Search size={20} className="text-gray-400 mr-3" />
                        <input 
                            className="flex-1 bg-transparent outline-none text-sm font-semibold"
                            placeholder="Rechercher un lieu de ramassage..."
                            value={searchQuery}
                            onFocus={() => setIsSearchActive(true)}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                        {searchQuery && <X size={18} className="text-gray-300" onClick={() => {setSearchQuery(''); setPredictions([]);}} />}
                    </div>
                    {/* BOUTON RECENTREMENT AMÉLIORÉ */}
                    <button 
                        onClick={handleRecenter}
                        className="w-14 h-14 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl flex items-center justify-center border border-white/50 active:scale-90 transition-transform"
                    >
                        <Navigation size={22} className="text-wink-black fill-current" />
                    </button>
                </div>

                {/* RÉSULTATS AUTOCOMPLETE */}
                {isSearchActive && (predictions.length > 0 || searchError) && (
                    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto border border-gray-100 animate-in fade-in slide-in-from-top-2">
                        {predictions.map(p => (
                            <button key={p.place_id} onClick={() => selectPrediction(p.place_id)} className="w-full p-4 flex items-center gap-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 text-left">
                                <div className="bg-gray-100 p-2 rounded-full"><MapPin size={14} className="text-gray-500"/></div>
                                <span className="text-xs font-medium text-gray-700 truncate">{p.description}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* TIROIR DU BAS (Détails Colis) */}
            <div className={`absolute bottom-0 left-0 right-0 z-30 bg-white rounded-t-[32px] p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] transition-transform duration-300 ${isSearchActive ? 'translate-y-full' : 'translate-y-0'}`}>
                <div className="w-12 h-1 bg-gray-100 rounded-full mx-auto mb-6"></div>
                <h2 className="text-lg font-black text-gray-900 mb-5 flex items-center gap-2">
                    <Package className="text-wink-yellow fill-current" /> Ramassage
                </h2>
                <div className="space-y-4">
                    <WinkInput 
                        placeholder="Contenu du colis (ex: Clés, Repas...)"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                    />
                    <div 
                        className={`flex items-start gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${isSecurityChecked ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-transparent'}`}
                        onClick={() => setIsSecurityChecked(!isSecurityChecked)}
                    >
                        <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center border transition-colors ${isSecurityChecked ? 'bg-green-500 border-green-500' : 'bg-white border-gray-300'}`}>
                            {isSecurityChecked && <Check size={12} className="text-white" strokeWidth={4} />}
                        </div>
                        <p className="text-[10px] text-gray-500 leading-tight">Je certifie que ce colis ne contient aucun objet interdit ou dangereux.</p>
                    </div>
                    <WinkButton variant="primary" onClick={handleNext}>
                        Suivant <ArrowRight size={20} className="ml-1" />
                    </WinkButton>
                </div>
            </div>
        </div>
    );
}