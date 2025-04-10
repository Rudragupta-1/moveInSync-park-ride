const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const auth = require('../middleware/auth');

// All notification routes are protected
router.get('/', auth, notificationController.getUserNotifications);
router.get('/unread', auth, notificationController.getUnreadNotifications);
router.put('/:id/read', auth, notificationController.markAsRead);
router.put('/read-all', auth, notificationController.markAllAsRead);
router.put('/preferences', auth, notificationController.updateNotificationPreferences);

module.exports = router;