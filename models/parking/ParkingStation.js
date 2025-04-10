const mongoose = require('mongoose');
const ParkingStationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: {
      address: String,
      city: String,
      state: String,
      zipCode: String,
      coordinates: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
      }
    },
    allocationStrategy: {
        type: String,
        enum: ['nearest', 'balanced', 'user-preference', 'energy-efficient'],
        default: 'balanced'
      },
      costMatrix: {
        lastUpdated: Date,
        dataUrl: String // could store a reference to the pre-computed cost matrix
      },
    totalSpots: { type: Number, required: true },
    availableSpots: { type: Number, default: 0 },
    levels: [String], // e.g., ['P1', 'P2', 'P3']
    operatingHours: {
      open: String, // "08:00"
      close: String, // "22:00"
      is24Hours: { type: Boolean, default: false },
      daysOpen: [{ type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] }]
    },
    facilities: [String], // ['EV Charging', 'Disabled Access', 'Security', etc.]
    nearbyMetroStations: [{
      name: String,
      distanceInMeters: Number,
      walkingTimeMinutes: Number
    }],
    imageUrls: [String],
    contactInfo: {
      phone: String,
      email: String
    },
    isActive: { type: Boolean, default: true }
  }, { timestamps: true });
  module.exports = mongoose.model('ParkingStation', ParkingStationSchema);