const express = require('express');
const router = express.Router();
const rideController = require('../controllers/rideController');
const auth = require('../middleware/auth');

// Ride provider routes
router.post('/providers', auth, rideController.createProvider);// Tested
router.get('/providers', rideController.getAllProviders);// Tested
router.get('/providers/:id', rideController.getProviderById);// Tested
router.get('/providers/station/:stationId', rideController.getProvidersByStation);// Tested
router.get('/providers/type/:type', rideController.getProvidersByType);// Tested

// Ride vehicle routes
router.post('/vehicles', auth, rideController.createVehicle);// Tested
router.get('/vehicles/:providerId', rideController.getVehiclesByProvider);// Tested
router.get('/vehicles/available/:stationId', rideController.getAvailableVehiclesNearStation);

// Driver routes
router.get('/drivers/:providerId', rideController.getDriversByProvider);

// Ride booking routes (protected)
router.post('/bookings', auth, rideController.createBooking);// Tested
router.get('/bookings', auth, rideController.getUserBookings);// Tested
router.get('/bookings/:id', auth, rideController.getBookingById);//Tested
router.put('/bookings/:id/cancel', auth, rideController.cancelBooking);// Tested
router.post('/bookings/:id/rate', auth, rideController.rateRide);// Tested

// Ride pool routes (protected)
router.get('/pools/available/:stationId', auth, rideController.getAvailablePoolsFromStation);
router.post('/pools/join/:poolId', auth, rideController.joinRidePool);

// Dynamic pricing routes
router.get('/pricing/:providerId', rideController.getRidePricing);
router.get('/pricing/calculate', rideController.calculateRideFare);

module.exports = router;