const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const auth = require('../middleware/auth');

router.get('/dashboard', auth, reportController.getDashboardMetrics);
router.get('/analytics', auth, reportController.getAnalyticsReports);

module.exports = router;
