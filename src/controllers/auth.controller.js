const SubscriberModel = require('../models/subscriber.model');
const PromoModel = require('../models/promo.model');

// Fonction utilitaire : Génère un code parrain unique pour le nouveau venu
function generateReferralCode(name) {
    const cleanName = (name || 'USER').toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 6);
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${cleanName}-${random}`;
}

// 1. INSCRIPTION / MISE À JOUR
exports.register = async (req, res) => {
    console.log("➡️ CONTROLLER: Début de register()");
    try {
        const {
            phone, firstName, lastName, city, country, 
            isIndependent, companyName, referralCode 
        } = req.body;

        if (!phone) {
            return res.status(400).json({ error: "Le numéro de téléphone est obligatoire." });
        }

        const existingUser = await SubscriberModel.findByPhone(phone);

        // --- CAS 1 : UTILISATEUR EXISTANT (Mise à jour) ---
        if (existingUser) {
            if (firstName) {
                await SubscriberModel.updateProfile(existingUser.id, {
                    first_name: firstName,
                    last_name: lastName || existingUser.last_name,
                    city: city || existingUser.city,
                    is_independent: isIndependent !== undefined ? isIndependent : existingUser.is_independent,
                    company_name: companyName || existingUser.company_name,
                    custom_message_template: existingUser.custom_message_template
                });
            }
            return res.json({
                success: true,
                message: "Profil mis à jour !",
                slug: existingUser.magic_slug,
                isNew: false
            });

        } else {
            // --- CAS 2 : NOUVELLE INSCRIPTION ---
            console.log(`📝 Création nouveau compte pour ${phone}`);
            
            const cleanNameSlug = (firstName || 'user').toLowerCase().replace(/[^a-z0-9]/g, '');
            const randomCodeSlug = Math.floor(1000 + Math.random() * 9000);
            const slug = `${cleanNameSlug}-${randomCodeSlug}`;
            
            // Génération de SON code parrain à lui
            const myReferralCode = generateReferralCode(firstName);

            // Gestion du Parrainage (Code reçu)
            let referrerCodeToSave = null;
            let expirationDate = null;
            let successMessage = "Compte créé avec succès.";

            // Nettoyage du code saisi (Majuscules + sans espaces)
            const cleanInputCode = referralCode ? referralCode.trim().toUpperCase() : null;

            if (cleanInputCode && cleanInputCode.length > 2) {
                console.log(`🔍 Vérification du code parrain: ${cleanInputCode}`);
                
                // A. Vérifier si c'est un autre livreur (PARRAINAGE)
                const validReferrer = await SubscriberModel.findByReferralCode(cleanInputCode);
                
                if (validReferrer) {
                    referrerCodeToSave = cleanInputCode; // IMPORTANT: On garde le code pour récompenser le parrain plus tard
                    
                    const now = new Date();
                    now.setDate(now.getDate() + 3); // 3 Jours offerts au Filleul
                    expirationDate = now;
                    
                    successMessage = "Parrainage validé : 3 jours offerts ! 🎉";
                    console.log(`✅ Code Parrain Valide. Expiration: ${expirationDate}`);
                } 
                // B. Vérifier si c'est un code promo système (PROMO)
                else if (PromoModel) {
                    const validPromo = await PromoModel.findActiveCode(cleanInputCode);
                    if (validPromo) {
                        const now = new Date();
                        now.setDate(now.getDate() + validPromo.days_bonus);
                        expirationDate = now;
                        
                        successMessage = `Code Promo validé : ${validPromo.days_bonus} jours offerts ! 🎁`;
                        await PromoModel.incrementUsage(validPromo.id);
                        console.log(`✅ Code Promo Valide.`);
                    } else {
                        console.log("❌ Code introuvable ou expiré.");
                    }
                }
            }

            const userData = {
                phone_number: phone,
                magic_slug: slug,
                first_name: firstName || '',
                last_name: lastName || '',
                city: city || '',
                country: country || 'Cameroun',
                is_independent: isIndependent !== undefined ? isIndependent : true,
                company_name: companyName || '',
                referral_code: myReferralCode,     // SON code
                referred_by: referrerCodeToSave,   // Le code de SON PARRAIN (Crucial pour la récompense future)
                subscription_expires_at: expirationDate
            };

            await SubscriberModel.create(userData);

            return res.status(201).json({
                success: true,
                message: successMessage,
                slug: slug,
                isNew: true,
                hasBonus: !!expirationDate
            });
        }
    } catch (error) {
        console.error("❌ ERREUR Controller Register:", error);
        res.status(500).json({ error: "Une erreur interne est survenue." });
    }
};

// 2. VÉRIFICATION DU NUMÉRO
exports.checkUser = async (req, res) => {
    try {
        const { phone } = req.body;
        const user = await SubscriberModel.findByPhone(phone);
        
        if (user) {
            res.json({ exists: true, name: user.first_name, slug: user.magic_slug });
        } else {
            res.json({ exists: false });
        }
    } catch (error) {
        console.error("❌ Erreur checkUser:", error);
        res.status(500).json({ error: "Erreur serveur base de données" });
    }
};

// 3. VÉRIFICATION CODE PARRAIN (Pour l'UI en direct)
exports.checkReferral = async (req, res) => {
    try {
        let { code } = req.body;
        if(!code) return res.json({ valid: false });
        
        code = code.trim().toUpperCase(); // Nettoyage
        
        const user = await SubscriberModel.findByReferralCode(code);
        if (user) {
            return res.json({ valid: true, type: 'referral', days: 3 });
        }

        if (PromoModel) {
            const promo = await PromoModel.findActiveCode(code);
            if (promo) {
                return res.json({ valid: true, type: 'promo', days: promo.days_bonus });
            }
        }
        res.json({ valid: false });
    } catch (error) {
        console.error("❌ Erreur CheckReferral:", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
};