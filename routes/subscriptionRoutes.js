const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const auth = require('../middleware/auth');

// Get all available subscription plans
router.post('/plans', subscriptionController.createPlan);// Tested
router.get('/plans', subscriptionController.getAllPlans);//Tested
router.get('/plans/:id', subscriptionController.getPlanById);// Tested
router.get('/plans/type/:type', subscriptionController.getPlansByType);// Tested

// User subscription management (protected)
router.post('/subscribe', auth, subscriptionController.createSubscription);
router.get('/my-subscription', auth, subscriptionController.getUserSubscription);
router.put('/cancel', auth, subscriptionController.cancelSubscription);
router.put('/renew', auth, subscriptionController.renewSubscription);
router.put('/auto-renew', auth, subscriptionController.toggleAutoRenew);

module.exports = router;