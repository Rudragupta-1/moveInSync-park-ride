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
router.post('/spots', parkingController.addParkingSpot);// Tested
router.get('/spots/:stationId', parkingController.getSpotsByStation);// Tested
router.get('/spots/:stationId/available', parkingController.getAvailableSpotsByStation);// Tested
router.get('/spots/:stationId/category/:category', parkingController.getSpotsByCategory);// Tested

// Parking booking routes (protected)
router.post('/bookings', auth, parkingController.createBooking);// Tested
router.get('/bookings', auth, parkingController.getUserBookings);// Tested
router.get('/bookings/:id', auth, parkingController.getBookingById);// Tested
router.put('/bookings/:id/cancel', auth, parkingController.cancelBooking);// Tested
router.put('/bookings/:id/extend', auth, parkingController.extendBooking); // Tested 
router.post('/bookings/:id/check-in', auth, parkingController.checkInBooking);
router.post('/bookings/:id/check-out', auth, parkingController.checkOutBooking);

// Dynamic pricing routes
router.get('/pricing/:stationId', parkingController.getParkingPricing);
router.get('/pricing/:stationId/calculate', parkingController.calculateParkingFee);

module.exports = router;