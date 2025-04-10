const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

// Authentication routes
router.post('/register', userController.register);// Tested
router.post('/login', userController.login);//Tested
router.post('/verify-email', userController.verifyEmail);
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password', userController.resetPassword);

// User profile routes (protected)
router.get('/profile', auth, userController.getUserProfile);
router.put('/profile', auth, userController.updateUserProfile); 
router.put('/profile/password', auth, userController.changePassword);
router.put('/profile/image', auth, userController.updateProfileImage);

// User preferences routes (protected)
router.get('/preferences', auth, userController.getUserPreferences);
router.put('/preferences', auth, userController.updateUserPreferences);
router.post('/preferences/favorite-stations', auth, userController.addFavoriteStation);
router.delete('/preferences/favorite-stations/:stationId', auth, userController.removeFavoriteStation);
router.post('/preferences/favorite-routes', auth, userController.addFavoriteRoute);
router.delete('/preferences/favorite-routes/:routeId', auth, userController.removeFavoriteRoute);

// User payment methods (protected)
router.get('/payment-methods', auth, userController.getPaymentMethods);
router.post('/payment-methods', auth, userController.addPaymentMethod);
router.put('/payment-methods/:methodId', auth, userController.updatePaymentMethod);
router.delete('/payment-methods/:methodId', auth, userController.deletePaymentMethod);
router.put('/payment-methods/:methodId/default', auth, userController.setDefaultPaymentMethod);

// User commute history (protected)
router.get('/commute-history', auth, userController.getCommuteHistory);

// User loyalty (protected)
router.get('/loyalty', auth, userController.getLoyaltyInfo);

module.exports = router;