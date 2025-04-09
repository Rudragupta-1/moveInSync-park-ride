const RidePoolSchema = new mongoose.Schema({
    poolId: { type: String, unique: true },
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'RideProvider' },
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'RideVehicle' },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
    startLocation: {
      stationName: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    },
    routePlannedPath: [{
      lat: Number,
      lng: Number,
      stopOrder: Number,
      estimatedArrival: Date
    }],
    capacity: { type: Number, required: true },
    occupiedSeats: { type: Number, default: 0 },
    rideBookings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'RideBooking' }],
    status: { 
      type: String, 
      enum: ['forming', 'active', 'completed', 'cancelled'], 
      default: 'forming' 
    },
    departureTime: Date,
    estimatedArrivalTime: Date,
    actualDepartureTime: Date,
    actualArrivalTime: Date
  }, { timestamps: true });
  module.exports =  mongoose.model('RidePool', RidePoolSchema);