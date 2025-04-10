const ParkingBookingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    stationId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingStation', required: true },
    parkingSpotId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingSpot', required: true },
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    bookingReference: { type: String, unique: true }, // Unique booking code/identifier
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    checkInTime: Date,
    checkOutTime: Date,
    bookingType: { type: String, enum: ['hourly', 'daily', 'monthly'], required: true },
    status: { 
      type: String, 
      enum: ['booked', 'checked-in', 'checked-out', 'cancelled', 'no-show', 'extended'], 
      default: 'booked' 
    },
    qrCode: String,
    baseAmount: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    paymentStatus: { 
      type: String, 
      enum: ['pending', 'paid', 'refunded', 'partial-refund', 'failed'], 
      default: 'pending' 
    },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    loyaltyPointsEarned: { type: Number, default: 0 },
    loyaltyPointsRedeemed: { type: Number, default: 0 },
    refundDetails: {
      amount: Number,
      reason: String,
      status: { type: String, enum: ['processing', 'completed', 'rejected'] },
      refundedAt: Date
    },
    extensionHistory: [{
      originalEndTime: Date,
      newEndTime: Date,
      additionalAmount: Number,
      extensionTime: { type: Date, default: Date.now }
    }],
    cancellationReason: String,
    notes: String,
    createdAt: { type: Date, default: Date.now }
  }, { timestamps: true });
  module.exports =mongoose.model('ParkingBooking', ParkingBookingSchema);



