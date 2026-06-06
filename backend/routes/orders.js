const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

router.post('/', auth, roleCheck(['Procurement Officer', 'Admin']), orderController.createPurchaseOrder);
router.get('/', auth, orderController.getAllPurchaseOrders);
router.get('/:id', auth, orderController.getPurchaseOrderById);
router.patch('/:id/status', auth, orderController.updateOrderStatus);

module.exports = router;
