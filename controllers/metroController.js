const MetroStation = require('../models/metro/MetroStation');
const MetroSchedule = require('../models/metro/MetroSchedule');

// Metro station controllers
exports.getAllStations = async (req, res) => {
  try {
    const stations = await MetroStation.find();
    res.status(200).json({ success: true, data: stations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getStationById = async (req, res) => {
  try {
    const station = await MetroStation.findById(req.params.id);
    
    if (!station) {
      return res.status(404).json({ success: false, error: 'Station not found' });
    }
    
    res.status(200).json({ success: true, data: station });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getStationByCode = async (req, res) => {
  try {
    const station = await MetroStation.findOne({ code: req.params.code });
    
    if (!station) {
      return res.status(404).json({ success: false, error: 'Station not found with this code' });
    }
    
    res.status(200).json({ success: true, data: station });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getStationsNearby = async (req, res) => {
  const { lat, lng, radius = 5 } = req.query; // radius in kilometers
  
  try {
    if (!lat || !lng) {
      return res.status(400).json({ success: false, error: 'Latitude and longitude are required' });
    }

    // Find stations near the given coordinates
    // This is a simplified approach - for production, consider using geospatial queries
    const stations = await MetroStation.find();
    
    const nearbyStations = stations.filter(station => {
      const distance = calculateDistance(
        parseFloat(lat),
        parseFloat(lng),
        station.location.coordinates.lat,
        station.location.coordinates.lng
      );
      
      return distance <= radius;
    });
    
    res.status(200).json({ success: true, data: nearbyStations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Metro schedule controllers
exports.getScheduleByStation = async (req, res) => {
  try {
    const schedules = await MetroSchedule.find({ stationId: req.params.stationId })
      .populate('stationId');
    
    if (!schedules.length) {
      return res.status(404).json({ success: false, error: 'No schedules found for this station' });
    }
    
    res.status(200).json({ success: true, data: schedules });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getScheduleByStationAndLine = async (req, res) => {
  try {
    const schedules = await MetroSchedule.find({ 
      stationId: req.params.stationId,
      lineName: req.params.lineName
    }).populate('stationId');
    
    if (!schedules.length) {
      return res.status(404).json({ 
        success: false, 
        error: 'No schedules found for this station and line' 
      });
    }
    
    res.status(200).json({ success: true, data: schedules });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getScheduleByStationAndDay = async (req, res) => {
  try {
    const schedules = await MetroSchedule.find({ 
      stationId: req.params.stationId,
      dayType: req.params.dayType
    }).populate('stationId');
    
    if (!schedules.length) {
      return res.status(404).json({ 
        success: false, 
        error: 'No schedules found for this station on the specified day type' 
      });
    }
    
    res.status(200).json({ success: true, data: schedules });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Helper function to calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  
  return distance;
}

module.exports = exports;