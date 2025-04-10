// routes/allocationRoutes.js
const express = require('express');
const router = express.Router();
const allocationController = require('../controllers/allocationController');

router.post('/allocate/:stationId', allocationController.allocateVehiclesToStation);
router.post('/reserve', allocationController.reserveAllocatedSpots);
router.post('/cost-matrix/:stationId', allocationController.getCostMatrix);

module.exports = router;
