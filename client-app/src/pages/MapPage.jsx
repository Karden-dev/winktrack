import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, MapPin, Loader2, Search, Package, ShieldAlert } from 'lucide-react';
import WinkButton from '../components/WinkButton';
import WinkInput from '../components/WinkInput';
import { useOrder } from '../context/OrderContext';
import L from 'leaflet';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';

// Styles CSS requis pour la recherche et la carte
import 'leaflet/dist/leaflet.css';
import 'leaflet-geosearch/dist/geosearch.css';

// --- CONFIGURATION DES ICÔNES LEAFLET ---
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

// --- COMPOSANT DE RECHERCHE (AUTOCOMPLETE) ---
function SearchField({ provider }) {
    const map = useMap();
    useEffect(() => {
        const searchControl = new GeoSearchControl({
            provider,
            style: 'bar',
            showMarker: false, // On gère notre propre marqueur
            autoClose: true,
            searchLabel: 'Rechercher un quartier, un lieu...',
            keepResult: true,
        });
        map.addControl(searchControl);
        
        map.on('geosearch/showlocation', (result) => {
            // Quand on trouve une adresse, on centre la carte dessus
            // Note: Le marqueur principal (LocationMarker) se mettra à jour au clic ou via le state global si besoin
        });

        return () => map.removeControl(searchControl);
    }, [map, provider]);
    return null;
}

// --- GESTION DU CLIC & MARQUEUR ---
function LocationMarker({ position, setPosition }) {
    const map = useMapEvents({
        click(e) {
            setPosition(e.latlng);
            map.flyTo(e.latlng, map.getZoom());
        },
        locationfound(e) {
            setPosition(e.latlng);
            map.flyTo(e.latlng, 16);
        },
    });

    return position === null ? null : (
        <Marker position={position} />
    );
}

// === PAGE PRINCIPALE ===
export default function MapPage() {
    const navigate = useNavigate();
    const { updateOrder } = useOrder();
    
    // États
    const [position, setPosition] = useState(null); // {lat, lng}
    const [description, setDescription] = useState('');
    const [isSecurityChecked, setIsSecurityChecked] = useState(false);
    const [loadingLocation, setLoadingLocation] = useState(false);

    // Initialisation provider recherche
    const searchProvider = new OpenStreetMapProvider();

    // Fonction GPS "Ma Position"
    const getMyLocation = () => {
        setLoadingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                setPosition({ lat: latitude, lng: longitude });
                setLoadingLocation(false);
            },
            (err) => {
                console.error(err);
                setLoadingLocation(false);
                alert("Impossible de vous localiser. Activez votre GPS.");
            },
            { enableHighAccuracy: true }
        );
    };

    const handleValidate = () => {
        if (!position) return alert("📍 Placez un point sur la carte.");
        if (!description.trim()) return alert("📦 Décrivez le colis (ex: Documents, Repas...).");
        if (!isSecurityChecked) return alert("⚠️ Veuillez accepter les règles de sécurité.");

        // Sauvegarde dans le Context
        updateOrder('pickupLocation', position);
        updateOrder('packageDescription', description);
        
        navigate('/recipient');
    };

    return (
        <div className="h-screen flex flex-col bg-white relative">
            
            {/* CARTE PLEIN ÉCRAN */}
            <div className="flex-1 relative z-0">
                <MapContainer 
                    center={{ lat: 3.8666, lng: 11.5167 }} // Yaoundé par défaut
                    zoom={13} 
                    style={{ height: "100%", width: "100%" }}
                    zoomControl={false} // On cache le zoom par défaut pour le style
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; OpenStreetMap'
                    />
                    <SearchField provider={searchProvider} />
                    <LocationMarker position={position} setPosition={setPosition} />
                </MapContainer>
                
                {/* Bouton GPS Flottant */}
                <button 
                    onClick={getMyLocation}
                    className="absolute top-20 right-4 z-[999] bg-white text-wink-black p-3 rounded-full shadow-lg active:scale-90 transition-transform border border-gray-100"
                >
                    {loadingLocation ? <Loader2 className="animate-spin" size={24}/> : <MapPin size={24} className="text-wink-green"/>}
                </button>
            </div>

            {/* PANNEAU FORMULAIRE (Bas de page) */}
            <div className="bg-white rounded-t-3xl shadow-float p-6 z-10 -mt-6 relative">
                <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-6"></div>
                
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Package className="text-wink-yellow" /> Détails de l'envoi
                </h2>

                <div className="space-y-4">
                    {/* Champ Description */}
                    <WinkInput 
                        placeholder="Qu'est-ce qu'on transporte ?"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />

                    {/* Checkbox Sécurité */}
                    <div 
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${isSecurityChecked ? 'bg-wink-green/10 border-wink-green' : 'bg-gray-50 border-gray-100'}`}
                        onClick={() => setIsSecurityChecked(!isSecurityChecked)}
                    >
                        <div className={`mt-1 min-w-[20px] h-5 rounded border flex items-center justify-center ${isSecurityChecked ? 'bg-wink-green border-wink-green text-white' : 'border-gray-300'}`}>
                            {isSecurityChecked && "✓"}
                        </div>
                        <div className="text-xs text-gray-500 leading-tight">
                            Je confirme que ce colis ne contient <strong>aucun produit illicite ou dangereux</strong>.
                        </div>
                    </div>

                    {/* Bouton Valider */}
                    <WinkButton 
                        variant="action" 
                        onClick={handleValidate}
                        disabled={!position} // Désactivé tant qu'il n'y a pas de point sur la carte
                    >
                        Suivant <ArrowRight size={20} />
                    </WinkButton>
                </div>
            </div>
        </div>
    );
}