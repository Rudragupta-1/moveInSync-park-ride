const express = require('express');
const router = express.Router();
const metroController = require('../controllers/metroController');
const auth = require('../middleware/auth');

// Metro station routes
router.post('/stations', auth, metroController.addStation); //Tested
router.get('/stations', metroController.getAllStations);//Tested
router.get('/stations/nearby', metroController.getStationsNearby);//Tested
router.get('/stations/code/:code', metroController.getStationByCode);
router.get('/stations/:id', metroController.getStationById);//Tested

// Metro schedule routes
router.post('/schedules', auth, metroController.addSchedule);//Tested
router.get('/schedules/:stationId', metroController.getScheduleByStation);//Tested
router.get('/schedules/:stationId/line/:lineName', metroController.getScheduleByStationAndLine);//Tested
router.get('/schedules/:stationId/day/:dayType', metroController.getScheduleByStationAndDay);// Tested

module.exports = router;