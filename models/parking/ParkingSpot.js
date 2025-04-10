const mongoose = require('mongoose');
const ParkingSpotSchema = new mongoose.Schema({
    stationId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingStation', required: true },
    level: { type: String, required: true },
    slotNumber: { type: String, required: true },
    category: { type: String, enum: ['standard', 'compact', 'disabled', 'ev-charging', 'vip'], default: 'standard' },
    isOccupied: { type: Boolean, default: false },
    isReserved: { type: Boolean, default: false },
    coordinates: {
        x: Number, // horizontal position within level
        y: Number  // vertical position within level
      },
      distanceToExit: Number, // distance in meters
      distanceToElevator: Number, // distance in meters
      preferenceScore: { type: Number, default: 0 }, // higher score for premium locations
    currentVehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
    currentBookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingBooking' },
    sensorId: String, // for IoT device tracking
    sensorStatus: { type: String, enum: ['active', 'maintenance', 'offline'], default: 'active' },
    lastUpdated: { type: Date, default: Date.now }
  }, { timestamps: true });
  module.exports = mongoose.model('ParkingSpot', ParkingSpotSchema);