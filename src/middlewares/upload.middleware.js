const multer = require('multer');
const path = require('path');
const fs = require('fs');

// S'assurer que le dossier uploads existe
const uploadDir = path.join(__dirname, '../../uploads/riders');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuration du stockage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Nom unique : cni-IDDU-LIVREUR-TIMESTAMP.jpg
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    }
});

// Filtre (Accepter seulement Images et PDF)
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Format non supporté (Images ou PDF uniquement)'), false);
    }
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB par fichier
    fileFilter: fileFilter
});

module.exports = upload;