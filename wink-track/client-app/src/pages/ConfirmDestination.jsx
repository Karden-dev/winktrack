import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { useSearchParams } from 'react-router-dom';
import { ArrowRight, MapPin, Loader2, Search, Navigation, X, Crosshair, CheckCircle } from 'lucide-react';
import WinkButton from '../components/WinkButton';
import { OpenStreetMapProvider } from 'leaflet-geosearch';
import axios from 'axios';
import { API_URL } from '../services/api'; // Assure-toi que API_URL est bien défini dans tes services
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// --- CONFIG LEAFLET ---
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

function MapController({ onMove }) {
    const map = useMapEvents({ move: () => onMove(map.getCenter()), moveend: () => onMove(map.getCenter()) });
    return null;
}

function RecenterMap({ coords }) {
    const map = useMap();
    useEffect(() => { if (coords) map.flyTo(coords, 16, { animate: true, duration: 1.5 }); }, [coords, map]);
    return null;
}

export default function ConfirmDestination() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    // États Vue
    const [viewState, setViewState] = useState('CHOICE'); // CHOICE, MAP, SEARCH, SUCCESS
    const [isLoading, setIsLoading] = useState(false);

    // États Données
    const [mapCenter, setMapCenter] = useState({ lat: 3.8480, lng: 11.5021 });
    const [destinationName, setDestinationName] = useState('');
    
    // GPS Sniper
    const [gpsStatus, setGpsStatus] = useState('IDLE');
    const [accuracy, setAccuracy] = useState(null);
    const [statusMessage, setStatusMessage] = useState("");
    const [gpsPosition, setGpsPosition] = useState(null);
    const watchIdRef = useRef(null);
    const bestAccuracyRef = useRef(99999);

    // Recherche
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const searchProvider = new OpenStreetMapProvider();

    // --- LOGIQUE GPS (Sniper) ---
    const startSniperGPS = () => {
        if (!navigator.geolocation) return alert("GPS non supporté");
        setViewState('MAP');
        setGpsStatus('SEARCHING');
        bestAccuracyRef.current = 99999;
        
        if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);

        watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude, accuracy } = pos.coords;
                const currentAcc = Math.round(accuracy);
                setAccuracy(currentAcc);

                if (currentAcc < bestAccuracyRef.current || currentAcc < 2000) {
                    if (currentAcc < bestAccuracyRef.current) bestAccuracyRef.current = currentAcc;
                    setGpsPosition({ lat: latitude, lng: longitude });
                    
                    if (currentAcc > 100) setStatusMessage("Signal faible... Sortez dehors.");
                    else if (currentAcc > 30) setStatusMessage(`Affinement... (±${currentAcc}m)`);
                    else {
                        setStatusMessage(`✅ Signal Excellent (±${currentAcc}m)`);
                        setGpsStatus('LOCKED');
                    }
                }
            },
            (err) => { console.warn(err); setGpsStatus('ERROR'); setStatusMessage("Signal GPS introuvable."); },
            { enableHighAccuracy: true, timeout: 30000, maximumAge: 10000 }
        );
    };

    useEffect(() => { return () => { if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current); }; }, []);

    // --- RECHERCHE ---
    const handleSearch = async (query) => {
        setSearchQuery(query);
        if (query.length < 3) { setSearchResults([]); return; }
        const results = await searchProvider.search({ query: query + " Cameroun" });
        setSearchResults(results);
    };

    const selectResult = (result) => {
        setGpsPosition({ lat: result.y, lng: result.x });
        setDestinationName(result.label.split(',')[0]);
        setViewState('MAP');
    };

    // --- VALIDATION FINALE (APPEL API) ---
    const handleConfirm = async () => {
        if (!token) return alert("Lien invalide (Token manquant).");
        setIsLoading(true);

        try {
            // Appel au Backend pour valider la position
            await axios.post(`${API_URL}/client/order/validate`, {
                token: token,
                lat: mapCenter.lat,
                lng: mapCenter.lng
            });

            // Si succès, on change l'écran
            setViewState('SUCCESS');
        } catch (error) {
            console.error(error);
            alert("Erreur lors de la validation. Réessayez.");
        } finally {
            setIsLoading(false);
        }
    };

    // --- RENDU : ÉCRAN DE SUCCÈS ---
    if (viewState === 'SUCCESS') {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-white p-6 text-center animate-in fade-in duration-700">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                    <CheckCircle size={48} className="text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">C'est tout bon !</h1>
                <p className="text-gray-500 mb-8 max-w-xs mx-auto">
                    Nous avons transmis votre position exacte. L'expéditeur va maintenant valider la course.
                </p>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 w-full max-w-sm">
                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Votre point de livraison</p>
                    <p className="text-gray-800 font-medium truncate">
                        {destinationName || `${mapCenter.lat.toFixed(4)}, ${mapCenter.lng.toFixed(4)}`}
                    </p>
                </div>
                <p className="text-xs text-gray-400 mt-10">Vous pouvez fermer cette page.</p>
            </div>
        );
    }

    // --- RENDU : CARTE & RECHERCHE (Code précédent simplifié pour la lisibilité) ---
    return (
        <div className="h-screen flex flex-col bg-white relative overflow-hidden font-sans">
            <div className="absolute inset-0 z-0">
                <MapContainer center={[3.8480, 11.5021]} zoom={15} zoomControl={false} style={{ height: "100%", width: "100%" }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <MapController onMove={setMapCenter} />
                    <RecenterMap coords={gpsPosition} />
                </MapContainer>
            </div>

            {/* UX Pin-Centric */}
            <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none flex flex-col items-center pb-8 ${viewState === 'CHOICE' ? 'opacity-0' : 'opacity-100'}`}>
                <div className="text-wink-black drop-shadow-xl relative">
                    <MapPin size={48} fill="#111827" className="text-white" />
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-4 h-2 bg-black/30 rounded-full blur-[2px]"></div>
                </div>
            </div>

            {/* ÉCRAN CHOIX */}
            {viewState === 'CHOICE' && (
                <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-sm flex flex-col justify-end pb-10 px-4 animate-in fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl p-6 border border-gray-100 mb-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-6">Confirmez votre position</h2>
                        <div className="space-y-3">
                            <button onClick={startSniperGPS} className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-green-50 border border-gray-200 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="bg-green-100 p-2 rounded-full text-green-600"><Navigation size={24} /></div>
                                    <div className="text-left"><span className="block font-bold">Me Localiser</span></div>
                                </div>
                            </button>
                            <button onClick={() => setViewState('SEARCH')} className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="bg-gray-100 p-2 rounded-full text-gray-600"><Search size={24} /></div>
                                    <div className="text-left"><span className="block font-bold">Chercher une adresse</span></div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ÉCRAN RECHERCHE */}
            {viewState === 'SEARCH' && (
                <div className="absolute inset-0 z-50 bg-white flex flex-col animate-in slide-in-from-bottom">
                    <div className="p-4 flex items-center gap-2 border-b">
                        <button onClick={() => setViewState('CHOICE')} className="p-2 bg-gray-100 rounded-full"><X size={20}/></button>
                        <input autoFocus type="text" placeholder="Quartier..." className="flex-1 bg-gray-100 rounded-xl p-3 outline-none" value={searchQuery} onChange={(e) => handleSearch(e.target.value)} />
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                        {searchResults.map((r, i) => (
                            <button key={i} onClick={() => selectResult(r)} className="w-full text-left p-4 border-b border-gray-50 hover:bg-gray-50">
                                <p className="font-bold">{r.label.split(',')[0]}</p>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ÉCRAN CARTE & VALIDATION */}
            {viewState === 'MAP' && (
                <>
                    <div className="absolute top-4 left-4 right-4 z-40 flex gap-2">
                        <button onClick={() => setViewState('CHOICE')} className="bg-white p-3 rounded-full shadow-lg"><Search size={20}/></button>
                        {gpsStatus !== 'IDLE' && <div className="flex-1 bg-white/95 backdrop-blur shadow-lg rounded-full px-4 flex items-center justify-between"><span className="text-xs font-bold text-gray-700">Signal GPS</span><span className="text-xs font-mono">{accuracy}m</span></div>}
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 z-40 bg-white rounded-t-3xl shadow-float p-6 pb-8">
                        <div className="text-center mb-6">
                            <h3 className="text-lg font-bold text-gray-800">C'est ici ?</h3>
                            <p className="text-xs text-gray-500">{destinationName || "Placez l'épingle devant chez vous"}</p>
                        </div>
                        <WinkButton variant="primary" onClick={handleConfirm} disabled={isLoading}>
                            {isLoading ? <Loader2 className="animate-spin" /> : <>Valider cette position <ArrowRight size={20} /></>}
                        </WinkButton>
                    </div>
                    
                    <button onClick={startSniperGPS} className="absolute bottom-52 right-4 z-40 bg-white p-3 rounded-full shadow-xl"><Crosshair size={24}/></button>
                </>
            )}
        </div>
    );
}