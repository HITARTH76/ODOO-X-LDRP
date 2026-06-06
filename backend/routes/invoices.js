const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

router.post('/', auth, roleCheck(['Procurement Officer', 'Admin', 'Vendor']), invoiceController.createInvoice);
router.get('/', auth, invoiceController.getAllInvoices);
router.get('/:id', auth, invoiceController.getInvoiceById);
router.post('/:id/email', auth, invoiceController.sendInvoiceEmail);
router.patch('/:id/status', auth, roleCheck(['Procurement Officer', 'Admin']), invoiceController.updateInvoiceStatus);

module.exports = router;
