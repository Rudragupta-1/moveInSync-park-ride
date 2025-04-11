const mongoose = require('mongoose');
const RideVehicleSchema = new mongoose.Schema({
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'RideProvider', required: true },
    vehicleType: { type: String, required: true }, // Car model, shuttle type, etc.
    registrationNumber: { type: String, required: true, unique: true },
    capacity: { type: Number, required: true },
    currentLocation: {
      lat: Number,
      lng: Number,
      lastUpdated: { type: Date, default: Date.now }
    },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' }, 
    status: { 
      type: String, 
      enum: ['available', 'on-ride', 'offline', 'maintenance'], 
      default: 'available' 
    },
    features: [String], // AC, WiFi, etc.
    isEV: { type: Boolean, default: false },
    currentBatteryLevel: { type: Number, min: 0, max: 100 } // For EVs
  }, { timestamps: true });
  module.exports = mongoose.model('RideVehicle', RideVehicleSchema);