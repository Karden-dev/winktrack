const SubscriberModel = require('../models/subscriber.model');

// Fonction principale : Inscription ou Mise à jour (Tout-en-un)
exports.register = async (req, res) => {
    try {
        // 1. Récupération des données envoyées par le Frontend
        const {
            phone,          // Obligatoire (ex: 699000000)
            firstName,      // Optionnel (ex: Moussa)
            lastName,       // Optionnel
            city,           // Optionnel (ex: Douala)
            country,        // Optionnel (défaut: Cameroun)
            isIndependent,  // true ou false
            companyName     // Optionnel (si pas indépendant)
        } = req.body;

        // Validation basique
        if (!phone) {
            return res.status(400).json({ error: "Le numéro de téléphone est obligatoire." });
        }

        // 2. Vérification : Est-ce que ce numéro existe déjà ?
        const existingUser = await SubscriberModel.findByPhone(phone);
        let slug;

        if (existingUser) {
            // --- CAS A : IL EXISTE DÉJÀ ---
            // On récupère son lien existant
            slug = existingUser.magic_slug;

            // On met à jour son profil s'il a envoyé de nouvelles infos
            // (Seulement si firstName est fourni, pour éviter d'écraser avec du vide)
            if (firstName) {
                await SubscriberModel.updateProfile(existingUser.id, {
                    first_name: firstName,
                    last_name: lastName || existingUser.last_name,
                    city: city || existingUser.city,
                    is_independent: isIndependent !== undefined ? isIndependent : existingUser.is_independent,
                    company_name: companyName || existingUser.company_name,
                    custom_message_template: existingUser.custom_message_template // On ne touche pas à son message perso
                });
            }

            return res.json({
                success: true,
                message: "Profil mis à jour avec succès !",
                slug: slug,
                isNew: false
            });

        } else {
            // --- CAS B : NOUVEL UTILISATEUR ---
            // 1. Génération du Lien Magique (Slug)
            // Ex: moussa-8492 (Prénom + 4 chiffres aléatoires pour éviter les doublons)
            const cleanName = (firstName || 'user').toLowerCase().replace(/[^a-z0-9]/g, ''); // Enlève accents et espaces
            const randomCode = Math.floor(1000 + Math.random() * 9000);
            slug = `${cleanName}-${randomCode}`;

            // 2. Préparation des données
            const userData = {
                phone_number: phone,
                magic_slug: slug,
                first_name: firstName || '',
                last_name: lastName || '',
                city: city || '',
                country: country || 'Cameroun',
                is_independent: isIndependent !== undefined ? isIndependent : true, // Par défaut Indépendant
                company_name: companyName || ''
            };

            // 3. Enregistrement en base
            await SubscriberModel.create(userData);

            return res.status(201).json({
                success: true,
                message: "Compte créé ! Bienvenue sur Wink Track.",
                slug: slug,
                isNew: true
            });
        }

    } catch (error) {
        console.error("❌ Erreur Auth Register:", error);
        res.status(500).json({ error: "Une erreur est survenue lors de l'inscription." });
    }
};

// Petite fonction utile pour vérifier si un numéro est déjà inscrit (sans l'inscrire)
// Utile si tu veux faire un champ "Déjà inscrit ?" sur le site
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