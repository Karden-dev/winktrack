const SubscriberModel = require('../models/subscriber.model');
const PromoModel = require('../models/promo.model');

// Fonction utilitaire : Génère un code parrain unique
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

        if (existingUser) {
            // CAS 1 : UTILISATEUR EXISTANT
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
            // CAS 2 : NOUVELLE INSCRIPTION
            const cleanNameSlug = (firstName || 'user').toLowerCase().replace(/[^a-z0-9]/g, '');
            const randomCodeSlug = Math.floor(1000 + Math.random() * 9000);
            const slug = `${cleanNameSlug}-${randomCodeSlug}`;
            const myReferralCode = generateReferralCode(firstName);

            let referrerCodeToSave = null;
            let expirationDate = null;
            let successMessage = "Compte créé avec succès.";

            if (referralCode) {
                const validReferrer = await SubscriberModel.findByReferralCode(referralCode);
                if (validReferrer) {
                    referrerCodeToSave = referralCode;
                    const now = new Date();
                    now.setDate(now.getDate() + 3);
                    expirationDate = now;
                    successMessage = "Parrainage validé : 3 jours offerts ! 🎉";
                } else if (PromoModel) {
                    const validPromo = await PromoModel.findActiveCode(referralCode);
                    if (validPromo) {
                        const now = new Date();
                        now.setDate(now.getDate() + validPromo.days_bonus);
                        expirationDate = now;
                        successMessage = `Code Promo validé : ${validPromo.days_bonus} jours offerts ! 🎁`;
                        await PromoModel.incrementUsage(validPromo.id);
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
                referral_code: myReferralCode,
                referred_by: referrerCodeToSave,
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

// 2. VÉRIFICATION DU NUMÉRO (C'est ici que tu coinces)
exports.checkUser = async (req, res) => {
    console.log(`➡️ CONTROLLER: checkUser appelé pour le numéro: ${req.body.phone}`);

    try {
        const { phone } = req.body;
        
        console.log("⏳ Appel du Modèle SubscriberModel.findByPhone...");
        const user = await SubscriberModel.findByPhone(phone);
        console.log("✅ Réponse du Modèle reçue.");
        
        if (user) {
            console.log(`   -> Utilisateur TROUVÉ : ${user.first_name}`);
            res.json({ exists: true, name: user.first_name, slug: user.magic_slug });
        } else {
            console.log(`   -> Utilisateur NON TROUVÉ (Nouveau)`);
            res.json({ exists: false });
        }
    } catch (error) {
        console.error("❌ ERREUR CRITIQUE DANS CHECKUSER:", error);
        res.status(500).json({ error: "Erreur serveur base de données" });
    }
};

// 3. VÉRIFICATION CODE PARRAIN
exports.checkReferral = async (req, res) => {
    console.log(`➡️ CONTROLLER: checkReferral code=${req.body.code}`);
    try {
        const { code } = req.body;
        
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