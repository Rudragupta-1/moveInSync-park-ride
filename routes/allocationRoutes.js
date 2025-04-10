// // routes/allocationRoutes.js
// const express = require('express');
// const router = express.Router();
// const allocationController = require('../controllers/allocationController');
// const { authenticate } = require('../middleware/auth'); 

// // Generate allocation of vehicles to spots for a station
// router.post('/stations/:stationId/allocate', authenticate, allocationController.allocateVehiclesToStation);

// // Reserve spots based on allocation results
// router.post('/reserve', authenticate, allocationController.reserveAllocatedSpots);

// // Get cost matrix for a station and vehicles
// router.post('/stations/:stationId/cost-matrix', authenticate, allocationController.getCostMatrix);

// module.exports = router;