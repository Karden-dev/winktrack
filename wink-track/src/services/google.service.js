// src/services/google.service.js
const axios = require('axios');

class GoogleService {
    constructor() {
        this.apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_SERVER_KEY;
        this.baseUrl = 'https://maps.googleapis.com/maps/api';
    }

    // 1. DISTANCE MATRIX
    async getDistanceMatrix(origin, destination) {
        try {
            const response = await axios.get(`${this.baseUrl}/distancematrix/json`, {
                params: {
                    origins: `${origin.lat},${origin.lng}`,
                    destinations: `${destination.lat},${destination.lng}`,
                    key: this.apiKey,
                    mode: 'driving'
                }
            });
            const data = response.data.rows[0].elements[0];
            if (data.status !== 'OK') return null;
            return {
                distanceKm: data.distance.value / 1000,
                durationMin: Math.ceil(data.duration.value / 60)
            };
        } catch (error) {
            console.error("Erreur Distance Matrix:", error.message);
            return null;
        }
    }

    // 2. REVERSE GEOCODING (Lat/Lng -> Adresse)
    async getAddressFromCoords(lat, lng) {
        try {
            const response = await axios.get(`${this.baseUrl}/geocode/json`, {
                params: { latlng: `${lat},${lng}`, key: this.apiKey }
            });
            if (response.data.status === 'OK' && response.data.results.length > 0) {
                return {
                    address: response.data.results[0].formatted_address,
                    place_id: response.data.results[0].place_id
                };
            }
            return null;
        } catch (error) {
            console.error("Erreur Geocoding:", error.message);
            return null;
        }
    }

    // 3. AUTOCOMPLETE (Recherche d'adresse)
    async getAutocomplete(input) {
        try {
            const response = await axios.get(`${this.baseUrl}/place/autocomplete/json`, {
                params: {
                    input,
                    key: this.apiKey,
                    components: 'country:cm' // Restreint au Cameroun
                }
            });
            return response.data;
        } catch (error) {
            console.error("Erreur Autocomplete:", error.message);
            return { status: 'ERROR', predictions: [] };
        }
    }

    // 4. PLACE DETAILS (ID -> Coordonnées)
    async getPlaceDetails(placeId) {
        try {
            const response = await axios.get(`${this.baseUrl}/place/details/json`, {
                params: { place_id: placeId, key: this.apiKey }
            });
            const result = response.data.result;
            return {
                lat: result.geometry.location.lat,
                lng: result.geometry.location.lng,
                address: result.formatted_address
            };
        } catch (error) {
            console.error("Erreur Details:", error.message);
            return null;
        }
    }

    // 5. DIRECTIONS (Polylines)
    async getRoutePolyline(origin, destination) {
        try {
            const response = await axios.get(`${this.baseUrl}/directions/json`, {
                params: {
                    origin: `${origin.lat},${origin.lng}`,
                    destination: `${destination.lat},${destination.lng}`,
                    key: this.apiKey
                }
            });
            return response.data.routes[0].overview_polyline.points;
        } catch (error) {
            return null;
        }
    }
}

module.exports = new GoogleService();