const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

router.get('/', auth, vendorController.getAllVendors);
router.get('/profile', auth, roleCheck('Vendor'), vendorController.getVendorProfile);
router.get('/:id', auth, vendorController.getVendorById);
router.patch('/:id/status', auth, roleCheck('Admin'), vendorController.updateVendorStatus);

module.exports = router;
