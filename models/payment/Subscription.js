const SubscriptionSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    type: { type: String, enum: ['parking', 'ride', 'combo'], required: true },
    duration: { type: Number, required: true }, // in days
    price: { type: Number, required: true },
    benefits: {
      discountPercentage: { type: Number, default: 0 },
      priorityBooking: { type: Boolean, default: false },
      freeRides: { type: Number, default: 0 },
      freeParking: { type: Number, default: 0 },
      loyaltyPointsMultiplier: { type: Number, default: 1 }
    },
    isActive: { type: Boolean, default: true }
  }, { timestamps: true });
  module.exports = mongoose.model('Subscription', SubscriptionSchema);