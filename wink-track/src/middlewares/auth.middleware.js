const jwt = require('jsonwebtoken');

const authMiddleware = (roles = []) => {
    return (req, res, next) => {
        // 1. Récupérer le token dans le header Authorization
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: "Accès refusé. Token manquant." });
        }

        try {
            // 2. Vérifier la validité du token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded; // Contient { id, role, phone }

            // 3. Vérifier si le rôle de l'utilisateur est autorisé
            if (roles.length && !roles.includes(req.user.role)) {
                return res.status(403).json({ error: "Accès interdit. Permissions insuffisantes." });
            }

            next(); // Tout est OK, on passe au contrôleur
        } catch (error) {
            res.status(401).json({ error: "Token invalide ou expiré." });
        }
    };
};

module.exports = authMiddleware;