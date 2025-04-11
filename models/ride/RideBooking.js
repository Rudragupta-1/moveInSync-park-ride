const mongoose = require('mongoose');

const RideBookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bookingReference: { type: String, unique: true, required: true },
  rideType: { type: String, enum: ['cab', 'shuttle', 'e-rickshaw'], required: true },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'RideProvider', required: true },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'RideVehicle', required: true },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  pickupLocation: {
    address: String,
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    }
  },
  dropLocation: {
    address: String,
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    }
  },
  scheduleTime: { type: Date, required: true },
  status: {
    type: String,
    enum: ['scheduled', 'driver-assigned', 'on-the-way', 'arrived', 'in-progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  baseFare: { type: Number, required: true },
  totalFare: { type: Number, required: true },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'failed'],
    default: 'pending'
  },
  isShared: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('RideBooking', RideBookingSchema);
