const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const roleCheck = require('../middleware/roleCheck');
const upload = require('../config/multerConfig');
const auth = require('../middleware/auth'); // Assuming auth middleware exists

// Create a new product (Admin/Manager only)
router.post('/', auth, roleCheck(['Admin', 'Manager']), upload.single('image'), productController.createProduct);

// List all products (any authenticated user)
router.get('/', auth, productController.listProducts);

module.exports = router;
