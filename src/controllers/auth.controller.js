const SubscriberModel = require('../models/subscriber.model');

// Fonction utilitaire pour générer le code parrain (ex: MOUSSA-8821)
function generateReferralCode(name) {
    const cleanName = (name || 'USER').toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 6);
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${cleanName}-${random}`;
}

exports.register = async (req, res) => {
    try {
        const {
            phone, firstName, lastName, city, country, 
            isIndependent, companyName,
            referralCode // <--- Le code entré par l'utilisateur (optionnel)
        } = req.body;

        if (!phone) {
            return res.status(400).json({ error: "Le numéro de téléphone est obligatoire." });
        }

        const existingUser = await SubscriberModel.findByPhone(phone);

        if (existingUser) {
            // --- CAS : UTILISATEUR EXISTANT (Mise à jour simple) ---
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
            // --- CAS : NOUVEL UTILISATEUR (Inscription) ---
            
            // 1. Génération Slug (Lien GPS)
            const cleanNameSlug = (firstName || 'user').toLowerCase().replace(/[^a-z0-9]/g, '');
            const randomCodeSlug = Math.floor(1000 + Math.random() * 9000);
            const slug = `${cleanNameSlug}-${randomCodeSlug}`;

            // 2. Génération Code Parrainage (Pour qu'il puisse parrainer à son tour)
            const myReferralCode = generateReferralCode(firstName);

            // 3. Gestion du Parrainage (A-t-il été invité ?)
            let referrerCodeToSave = null;
            let expirationDate = null; // Par défaut, pas d'abo (expiré)

            if (referralCode) {
                // On vérifie si le code donné est valide
                const validReferrer = await SubscriberModel.findByReferralCode(referralCode);
                
                if (validReferrer) {
                    referrerCodeToSave = referralCode;
                    
                    // CADEAU : 3 Jours offerts !
                    const bonusDays = 3;
                    const now = new Date();
                    now.setDate(now.getDate() + bonusDays);
                    expirationDate = now; // La date d'expiration est dans le futur
                }
            }

            // 4. Enregistrement
            const userData = {
                phone_number: phone,
                magic_slug: slug,
                first_name: firstName || '',
                last_name: lastName || '',
                city: city || '',
                country: country || 'Cameroun',
                is_independent: isIndependent !== undefined ? isIndependent : true,
                company_name: companyName || '',
                referral_code: myReferralCode,     // Son code à lui
                referred_by: referrerCodeToSave,   // Le code de son parrain (ou null)
                subscription_expires_at: expirationDate // Date calculée (ou null)
            };

            await SubscriberModel.create(userData);

            return res.status(201).json({
                success: true,
                message: expirationDate ? "Compte créé + 3 jours offerts ! 🎉" : "Compte créé avec succès.",
                slug: slug,
                isNew: true,
                hasBonus: !!expirationDate
            });
        }

    } catch (error) {
        console.error("❌ Erreur Auth Register:", error);
        res.status(500).json({ error: "Une erreur est survenue lors de l'inscription." });
    }
};

// Vérifier si un numéro existe (utilisé par le frontend à l'étape 1)
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
        res.status(500).json({ error: "Erreur serveur" });
    }
};

// Vérifier si un code parrain est valide (API optionnelle pour afficher le check vert en live)
exports.checkReferral = async (req, res) => {
    try {
        const { code } = req.body;
        const user = await SubscriberModel.findByReferralCode(code);
        res.json({ valid: !!user });
    } catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};