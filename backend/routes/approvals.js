const express = require('express');
const router = express.Router();
const approvalController = require('../controllers/approvalController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

router.post('/', auth, roleCheck(['Manager', 'Admin']), approvalController.processApproval);
router.get('/quotation/:quotationId', auth, approvalController.getApprovalsByQuotation);

module.exports = router;
