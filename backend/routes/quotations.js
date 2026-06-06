const express = require('express');
const router = express.Router();
const quotationController = require('../controllers/quotationController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

router.post('/', auth, roleCheck('Vendor'), quotationController.submitQuotation);
router.get('/rfq/:rfqId', auth, roleCheck(['Procurement Officer', 'Manager', 'Admin']), quotationController.getQuotationsByRfq);
router.get('/all', auth, roleCheck(['Procurement Officer', 'Manager', 'Admin']), quotationController.getAllQuotations);
router.get('/vendor', auth, roleCheck('Vendor'), quotationController.getVendorQuotations);

module.exports = router;
