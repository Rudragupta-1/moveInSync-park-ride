const mongoose = require('mongoose');
const DriverSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: String,
    licenseNumber: { type: String, required: true, unique: true },
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'RideProvider', required: true },
    currentVehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'RideVehicle' },
    status: { 
      type: String, 
      enum: ['active', 'off-duty', 'on-ride', 'unavailable'], 
      default: 'active' 
    },
    ratingAverage: { type: Number, default: 0 },
    totalRides: { type: Number, default: 0 },
    profileImage: String,
    documents: {
      licenseImage: String,
      verificationStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' }
    }
  }, { timestamps: true });
  module.exports = mongoose.model('Driver', DriverSchema);