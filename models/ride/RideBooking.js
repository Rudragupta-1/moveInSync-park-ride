const RideBookingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bookingReference: { type: String, unique: true },
    rideType: { type: String, enum: ['cab', 'shuttle', 'e-rickshaw'], required: true },
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'RideProvider' },
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'RideVehicle' },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
    relatedParkingBookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingBooking' }, // If ride is connected to parking
    pickupLocation: {
      stationName: String,
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
    actualPickupTime: Date,
    actualDropTime: Date,
    estimatedDuration: Number, // in minutes
    estimatedDistance: Number, // in kilometers
    status: { 
      type: String, 
      enum: ['scheduled', 'driver-assigned', 'on-the-way', 'arrived', 'in-progress', 'completed', 'cancelled'], 
      default: 'scheduled' 
    },
    baseFare: { type: Number, required: true },
    distanceFare: Number,
    timeFare: Number,
    surgeMultiplier: { type: Number, default: 1.0 },
    discountAmount: { type: Number, default: 0 },
    totalFare: { type: Number, required: true },
    paymentStatus: { 
      type: String, 
      enum: ['pending', 'paid', 'refunded', 'failed'], 
      default: 'pending' 
    },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    isShared: { type: Boolean, default: false },
    ridePoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'RidePool' }, // For shared rides
    userRating: { type: Number, min: 1, max: 5 },
    userFeedback: String,
    driverRating: { type: Number, min: 1, max: 5 },
    driverFeedback: String,
    cancellationReason: String,
    cancellationFee: Number,
    createdAt: { type: Date, default: Date.now }
  }, { timestamps: true });
  module.exports =  mongoose.model('RideBooking', RideBookingSchema);



