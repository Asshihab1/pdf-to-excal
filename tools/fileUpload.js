const multer = require('multer');
const path = require('path');
const fs = require('fs');


const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);


const upload = multer({
    storage: multer.diskStorage({
        destination: uploadDir,
        filename: (req, file, cb) => {
            cb(null, `upload-${Date.now()}${path.extname(file.originalname)}`);
        }
    }),
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    },
    limits: { fileSize: 50 * 1024 * 1024 } 
});

module.exports = upload;