const mongoose = require('mongoose');
const MetroStationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    code: { type: String, unique: true },
    location: {
      address: String,
      city: String,
      coordinates: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
      }
    },
    lines: [String], // Metro lines that pass through this station
    connectedParkingStations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ParkingStation' }],
    facilities: [String], // Elevator, Wheelchair access, etc.
    operatingHours: {
      open: String,
      close: String
    }
  }, { timestamps: true });
  module.exports =  mongoose.model('MetroStation', MetroStationSchema); 