const multer = require('multer');
const path = require('path');

// 1. Buat folder uploads jika belum ada
const uploadDir = path.join(__dirname, '../public/uploads');
require('fs').mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Gunakan variabel yang sudah didefinisikan
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    // 2. Format nama file lebih rapi (tanpa random string)
    const filename = `project-${Date.now()}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    allowedTypes.includes(ext) 
      ? cb(null, true) 
      : cb(new Error('Hanya file JPG/JPEG/PNG/WEBP yang diperbolehkan'), false);
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

module.exports = upload;