const express = require('express');
const router = express.Router();
const rfqController = require('../controllers/rfqController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

router.post('/', auth, roleCheck(['Procurement Officer', 'Admin']), rfqController.createRfq);
router.get('/', auth, rfqController.getAllRfqs);
router.get('/:id', auth, rfqController.getRfqById);
router.delete('/:id', auth, roleCheck(['Admin']), rfqController.deleteRfq);

module.exports = router;
