const mongoose = require('mongoose');
const RideProviderSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, enum: ['cab', 'shuttle', 'e-rickshaw'], required: true },
    contactInfo: {
      phone: String, 
      email: String
    },
    fleetSize: Number,
    operatingHours: {
      open: String, 
      close: String,
      is24Hours: { type: Boolean, default: false }
    },
    servingStations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ParkingStation' }],
    active: { type: Boolean, default: true },
    ratingAverage: { type: Number, default: 0 },
    totalRides: { type: Number, default: 0 }
  }, { timestamps: true });
  module.exports = mongoose.model('RideProvider', RideProviderSchema);