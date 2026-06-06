const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

// Storage configuration: each product gets its own folder under uploads/products/<product-id>
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Temporary folder for initial upload
    const tempDir = path.join(__dirname, '..', '..', 'uploads', 'temp');
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = uuidv4() + ext;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = /\.(jpeg|jpg|png|webp)$/i;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter
});

module.exports = upload;
