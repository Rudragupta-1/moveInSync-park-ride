const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const auth = require('../middleware/auth');

// All vehicle routes are protected
router.post('/', auth, vehicleController.addVehicle);
router.get('/', auth, vehicleController.getUserVehicles);
router.get('/:id', auth, vehicleController.getVehicleById);
router.put('/:id', auth, vehicleController.updateVehicle);
router.delete('/:id', auth, vehicleController.deleteVehicle);
router.put('/:id/default', auth, vehicleController.setDefaultVehicle);
router.post('/:id/rfid', auth, vehicleController.addRFIDTag);

module.exports = router;