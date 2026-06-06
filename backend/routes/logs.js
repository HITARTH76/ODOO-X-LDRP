const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const auth = require('../middleware/auth');

router.get('/activity', auth, logController.getActivityLogs);
router.get('/notifications', auth, logController.getNotifications);
router.post('/notifications/read', auth, logController.markNotificationsRead);

module.exports = router;
