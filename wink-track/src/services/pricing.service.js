const ZoneModel = require('../models/zone.model');
const PromoModel = require('../models/promo.model');

class PricingService {
    /**
     * Calcule le prix complet d'une course et la répartition des gains.
     * @param {number} distanceKm - Distance calculée par Google Service
     * @param {string} zoneName - Nom du quartier/zone (ex: Akwa)
     * @param {string} cityName - Ville (ex: Douala)
     * @param {string} promoCode - Code promo saisi par le client (optionnel)
     * @param {number} externalSurge - Multiplicateur externe (météo/forte demande - par défaut 1)
     */
    async calculateOrderPrice(distanceKm, zoneName, cityName, promoCode = null, externalSurge = 1) {
        try {
            // 1. Récupération des réglages de la zone (Tarif KM, Base, Multiplicateur zone)
            const zonePricing = await ZoneModel.getPricing(zoneName, cityName) 
                                || await ZoneModel.getDefaultPricing();

            const { base_fare, price_per_km, surge_multiplier } = zonePricing;

            // 2. Calcul du prix de base (Distance * Prix/KM + Prise en charge)
            let calculatedPrice = (distanceKm * parseFloat(price_per_km)) + parseFloat(base_fare);

            // 3. Application des multiplicateurs (Zone + Météo/Demande)
            // Le multiplicateur final est le produit du multiplicateur de zone et de l'externe
            calculatedPrice = calculatedPrice * parseFloat(surge_multiplier) * externalSurge;

            // 4. Gestion du Code Promo
            let discountAmount = 0;
            let appliedPromoId = null;

            if (promoCode) {
                const promo = await PromoModel.validateCode(promoCode);
                if (promo) {
                    appliedPromoId = promo.id;
                    if (promo.discount_type === 'FIXED') {
                        discountAmount = parseFloat(promo.discount_value);
                    } else if (promo.discount_type === 'PERCENTAGE') {
                        discountAmount = calculatedPrice * (parseFloat(promo.discount_value) / 100);
                    }
                }
            }

            // 5. Calcul du prix final après remise
            // On s'assure que le prix ne tombe jamais en dessous du tarif minimum (base_fare)
            let finalPrice = Math.max(parseFloat(base_fare), calculatedPrice - discountAmount);

            // Arrondi au 50 FCFA supérieur pour faciliter le change
            finalPrice = Math.ceil(finalPrice / 50) * 50;

            // 6. Répartition Wink (10%) / Rider (90%)
            // Ces calculs sont basés sur ta structure financière "Cashless"
            const winkCommission = finalPrice * 0.10;
            const riderEarnings = finalPrice - winkCommission;

            return {
                totalPrice: finalPrice,
                riderEarnings: riderEarnings,
                winkCommission: winkCommission,
                distance: distanceKm,
                appliedPromoId: appliedPromoId,
                pricingDetails: {
                    baseFare: base_fare,
                    pricePerKm: price_per_km,
                    surgeApplied: parseFloat(surge_multiplier) * externalSurge
                }
            };

        } catch (error) {
            console.error("Erreur dans PricingService:", error);
            throw error;
        }
    }
}

module.exports = new PricingService();