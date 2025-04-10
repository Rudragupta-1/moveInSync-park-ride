// const express = require('express');
// const router = express.Router();
// const paymentController = require('../controllers/paymentController');
// const auth = require('../middleware/auth');

// // All payment routes are protected
// router.post('/initiate', auth, paymentController.initiatePayment);
// router.post('/verify', auth, paymentController.verifyPayment); 
// router.get('/history', auth, paymentController.getPaymentHistory);
// router.get('/:id', auth, paymentController.getPaymentById);
// router.post('/refund/:id', auth, paymentController.requestRefund);
// router.get('/refund/:id/status', auth, paymentController.getRefundStatus);

// // Loyalty points payments
// router.post('/redeem-points', auth, paymentController.redeemLoyaltyPoints);
// router.get('/earned-points', auth, paymentController.getEarnedPointsHistory);

// module.exports = router; 