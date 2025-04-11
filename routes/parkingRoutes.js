const express = require('express');
const router = express.Router();
const parkingController = require('../controllers/parkingController');
const auth = require('../middleware/auth');

// Parking station routes
router.post('/stations', parkingController.addParkingStation);// Tested
router.get('/stations', parkingController.getAllStations);// Tested
router.get('/stations/:id', parkingController.getStationById); // Tested
router.get('/stations/near-metro/:metroId', parkingController.getStationsNearMetro);// Tested
router.get('/stations/near-location', parkingController.getStationsNearLocation);

// Parking spot routes
router.get('/spots/:stationId', parkingController.getSpotsByStation);
router.get('/spots/:stationId/available', parkingController.getAvailableSpotsByStation);
router.get('/spots/:stationId/category/:category', parkingController.getSpotsByCategory);

// Parking booking routes (protected)
router.post('/bookings', auth, parkingController.createBooking);
router.get('/bookings', auth, parkingController.getUserBookings);
router.get('/bookings/:id', auth, parkingController.getBookingById);
router.put('/bookings/:id/cancel', auth, parkingController.cancelBooking);
router.put('/bookings/:id/extend', auth, parkingController.extendBooking); 
router.post('/bookings/:id/check-in', auth, parkingController.checkInBooking);
router.post('/bookings/:id/check-out', auth, parkingController.checkOutBooking);

// Dynamic pricing routes
router.get('/pricing/:stationId', parkingController.getParkingPricing);
router.get('/pricing/:stationId/calculate', parkingController.calculateParkingFee);

module.exports = router;