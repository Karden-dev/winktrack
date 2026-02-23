// src/pages/ConfirmDestination.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { useParams } from 'react-router-dom';
import { MapPin, Navigation, CheckCircle, Loader2, Package, Search, AlertCircle, SignalHigh, SignalLow, SignalMedium } from 'lucide-react';
import WinkButton from '../components/WinkButton';
import api from '../services/api';

const mapContainerStyle = { width: '100%', height: '100%' };
const defaultCenter = { lat: 4.0511, lng: 9.7679 }; // Douala par défaut
const mapOptions = {
    disableDefaultUI: true,
    zoomControl: false,
    gestureHandling: "greedy",
    clickableIcons: false,
};
const LIBRARIES = ['places'];

export default function ConfirmDestination() {
    const { token } = useParams();
    
    // --- ÉTATS ---
    const [map, setMap] = useState(null);
    const [autocomplete, setAutocomplete] = useState(null);
    const [center, setCenter] = useState(defaultCenter);
    const [address, setAddress] = useState("Recherche de votre position...");
    
    // États GPS & Précision
    const [gpsAccuracy, setGpsAccuracy] = useState(null); // en mètres
    const [isLocating, setIsLocating] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isLoadingAddr, setIsLoadingAddr] = useState(false);

    // États Données
    const [order, setOrder] = useState(null);
    const [loadingOrder, setLoadingOrder] = useState(true);
    const [error, setError] = useState(null);
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const timerRef = useRef(null);
    const watchIdRef = useRef(null); // Pour stopper le tracking GPS

    // 1. CHARGEMENT GOOGLE MAPS
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        libraries: LIBRARIES
    });

    // 2. RÉCUPÉRATION DE LA COMMANDE
    useEffect(() => {
        const fetchOrder = async () => {
            try {
                // ✅ Utilisation de resolveToken (au lieu de getStatus)
                const res = await api.orders.resolveToken(token);
                
                if (res.data.success) {
                    setOrder(res.data.order);
                    
                    // ✅ CORRECTION DU BUG "Tout est OK" : On autorise le statut INITIATED
                    const allowedStatuses = ['INITIATED', 'WAITING_DROPOFF', 'DRAFT', '', null];
                    // Si le statut n'est pas dans la liste des "en cours", alors c'est fini
                    if (!allowedStatuses.includes(res.data.order.status)) {
                        setIsConfirmed(true);
                    }
                } else {
                    setError("Ce lien est invalide.");
                }
            } catch (err) {
                console.error("Erreur lien:", err);
                setError("Impossible de charger la commande.");
            } finally {
                setLoadingOrder(false);
            }
        };
        if (token) fetchOrder();

        return () => {
            if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
        };
    }, [token]);

    // 3. FONCTION DE LOCALISATION PRÉCISE (Le "Sniper")
    const startPrecisionLocating = () => {
        setIsLocating(true);
        
        if (!navigator.geolocation) {
            alert("Votre navigateur ne supporte pas la géolocalisation.");
            setIsLocating(false);
            return;
        }

        if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);

        watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude, accuracy } = pos.coords;
                const newPos = { lat: latitude, lng: longitude };
                
                setGpsAccuracy(Math.round(accuracy));
                setCenter(newPos);
                
                if (map) map.panTo(newPos);
                getAddress(latitude, longitude);

                // Si précision top (< 20m), on arrête l'indicateur de chargement
                if (accuracy <= 20) {
                    setIsLocating(false);
                }
            },
            (err) => {
                console.warn("Erreur GPS:", err);
                setIsLocating(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 20000,
                maximumAge: 0
            }
        );
    };

    const onLoad = useCallback((mapInstance) => {
        setMap(mapInstance);
        startPrecisionLocating(); // Lance le GPS dès l'ouverture
    }, []);

    const onAutocompleteLoad = (autocompleteInstance) => setAutocomplete(autocompleteInstance);
    
    const onPlaceChanged = () => {
        if (autocomplete !== null) {
            const place = autocomplete.getPlace();
            if (place.geometry) {
                const location = {
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng()
                };
                setCenter(location);
                map.panTo(location);
                setAddress(place.formatted_address);
                setGpsAccuracy(10); // Simulation précision parfaite pour recherche manuelle
                setIsLocating(false);
            }
        }
    };

    const handleIdle = () => {
        if (!map) return;
        setIsDragging(false);
        const newCenter = map.getCenter();
        
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            getAddress(newCenter.lat(), newCenter.lng());
        }, 800);
    };

    const getAddress = async (lat, lng) => {
        setIsLoadingAddr(true);
        try {
            // Utilise bien api.google.reverseGeocode (ou .reverse selon ton api.js)
            const res = await api.google.reverseGeocode(lat, lng);
            const addr = res.data.address || res.data.results?.[0]?.formatted_address;
            setAddress(addr || "Adresse inconnue");
        } catch (error) {
            setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        } finally {
            setIsLoadingAddr(false);
        }
    };

    const handleConfirm = async () => {
        if (!map || isSubmitting) return;
        
        // Bloquage si précision faible (plus de 50m)
        if (gpsAccuracy > 50) {
            if(!window.confirm(`La précision GPS est faible (${gpsAccuracy}m). Êtes-vous sûr ?`)) {
                return;
            }
        }

        setIsSubmitting(true);
        const finalPos = map.getCenter();

        try {
            // ✅ CORRECTION DU PAYLOAD : On envoie la structure attendue par le Backend
            await api.orders.confirmDestination({
                orderId: order.id, // ID de la commande (obligatoire)
                dropoff: {
                    lat: finalPos.lat(),
                    lng: finalPos.lng(),
                    address: address
                }
            });
            setIsConfirmed(true);
        } catch (error) {
            console.error(error);
            alert("Erreur lors de la validation. Vérifiez votre connexion.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- INDICATEUR VISUEL GPS ---
    const renderGpsStatus = () => {
        if (!gpsAccuracy) return null;
        
        let color = "text-red-500";
        let Icon = SignalLow;

        if (gpsAccuracy <= 10) {
            color = "text-green-500";
            Icon = SignalHigh;
        } else if (gpsAccuracy <= 20) {
            color = "text-green-600";
            Icon = SignalMedium;
        } else if (gpsAccuracy <= 50) {
            color = "text-yellow-500";
            Icon = SignalMedium;
        }

        return (
            <div className="absolute top-36 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 text-xs font-bold border border-gray-100 z-20">
                <Icon size={14} className={color} />
                <span className="text-gray-700">Précision : {gpsAccuracy}m</span>
            </div>
        );
    };

    // --- ÉCRAN DE SUCCÈS ---
    if (isConfirmed) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-slate-900 p-8 text-center animate-in fade-in zoom-in duration-300">
                <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,197,94,0.4)]">
                    <CheckCircle size={60} className="text-green-500 animate-bounce" />
                </div>
                <h1 className="text-3xl font-black text-white mb-4">C'est tout bon !</h1>
                <p className="text-gray-400 leading-relaxed mb-8 max-w-sm">
                    Votre position a été envoyée avec succès.<br/>
                    L'expéditeur peut maintenant finaliser la commande.
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
                <div className="bg-red-50 p-6 rounded-full mb-6">
                    <AlertCircle className="text-red-500" size={48} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">Lien Expiré</h2>
                <p className="text-slate-500 mb-8 max-w-xs mx-auto">{error}</p>
            </div>
        );
    }

    if (!isLoaded || loadingOrder) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-white">
                <Loader2 className="animate-spin text-yellow-500 mb-4" size={48} />
                <p className="text-gray-500 font-bold tracking-tight animate-pulse">Connexion au satellite...</p>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen relative bg-white overflow-hidden">
            
            {/* BARRE DE RECHERCHE */}
            <div className="absolute top-20 left-4 right-4 z-30">
                <Autocomplete onLoad={onAutocompleteLoad} onPlaceChanged={onPlaceChanged}>
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Rechercher un point de repère..."
                            className="w-full h-12 pl-12 pr-4 bg-white rounded-xl shadow-xl font-medium outline-none border-0 ring-1 ring-gray-100 focus:ring-2 focus:ring-yellow-400 transition-all"
                        />
                    </div>
                </Autocomplete>
            </div>

            {renderGpsStatus()}

            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={center}
                zoom={18}
                options={mapOptions}
                onLoad={onLoad}
                onBoundsChanged={() => { setIsDragging(true); handleIdle(); }}
            >
            </GoogleMap>

            {/* HEADER EXPÉDITEUR */}
            <div className="absolute top-0 left-0 right-0 p-4 z-10 bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex items-center gap-3 text-white">
                    <div className="bg-yellow-400 p-2 rounded-xl text-black shadow-lg">
                        <Package size={18} />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase tracking-wider opacity-60 font-bold">Colis de la part de</p>
                        <p className="font-bold text-sm">{order?.sender_name || "Client Wink"}</p>
                    </div>
                </div>
            </div>

            {/* CIBLE CENTRALE */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none flex flex-col items-center pb-[42px] transition-all duration-300 ${isDragging ? '-translate-y-8 scale-110 opacity-70' : ''}`}>
                <div className="bg-slate-900 text-white text-[11px] font-bold px-4 py-2 rounded-xl shadow-2xl mb-2 flex items-center gap-2 whitespace-nowrap border border-white/20">
                    {isLoadingAddr ? <Loader2 size={12} className="animate-spin text-yellow-400"/> : address}
                </div>
                <div className="relative">
                    <MapPin size={52} className="text-green-500 fill-white drop-shadow-2xl" strokeWidth={2} />
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-1.5 bg-black/30 rounded-full blur-[2px]"></div>
                </div>
            </div>

            {/* BOUTON RELOCALISER */}
            <button 
                onClick={startPrecisionLocating}
                className={`absolute right-4 bottom-48 w-14 h-14 bg-white rounded-2xl shadow-xl flex items-center justify-center z-20 transition-all active:scale-95 ${isLocating ? 'ring-4 ring-yellow-200' : ''}`}
            >
                {isLocating ? (
                    <Loader2 size={24} className="text-yellow-500 animate-spin" />
                ) : (
                    <Navigation size={24} className="text-slate-700" />
                )}
            </button>

            {/* BOUTON VALIDER */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-white rounded-t-[30px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-20">
                <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>
                
                <h2 className="text-lg font-black text-gray-900 mb-1 flex items-center gap-2">
                    Confirmez la position
                    {gpsAccuracy <= 20 && <CheckCircle size={16} className="text-green-500"/>}
                </h2>
                
                <p className="text-xs text-gray-500 mb-6">
                    {gpsAccuracy > 20 
                        ? `Précision actuelle : ${gpsAccuracy}m. Attendez que le signal s'améliore...` 
                        : "Signal GPS excellent. Vous pouvez valider."}
                </p>
                
                <WinkButton 
                    variant="primary" 
                    onClick={handleConfirm}
                    isLoading={isSubmitting}
                    disabled={gpsAccuracy > 50 && !isSubmitting}
                >
                    {gpsAccuracy > 20 && gpsAccuracy <= 50 ? (
                        <span>Valider quand même ({gpsAccuracy}m)</span>
                    ) : (
                        <span>C'est ici !</span>
                    )}
                </WinkButton>
            </div>
        </div>
    );
}