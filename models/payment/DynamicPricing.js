const mongoose = require('mongoose');
const DynamicPricingSchema = new mongoose.Schema({
    type: { type: String, enum: ['parking', 'ride'], required: true },
    stationId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingStation' }, // For parking pricing
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'RideProvider' }, // For ride pricing
    baseRate: { type: Number, required: true },
    peakHourMultiplier: { type: Number, default: 1.5 },
    offPeakDiscount: { type: Number, default: 0.8 }, // 20% discount
    weekendMultiplier: { type: Number, default: 1.2 },
    holidayMultiplier: { type: Number, default: 1.3 },
    weatherConditionMultiplier: { type: Number, default: 1.2 }, // For bad weather
    occupancyRates: [{
      threshold: Number, // e.g., 80% occupancy
      multiplier: Number // e.g., 1.2x pricing
    }],
    specialEventMultipliers: [{
      eventName: String,
      multiplier: Number,
      startDate: Date,
      endDate: Date
    }],
    lastUpdated: { type: Date, default: Date.now }
  }, { timestamps: true });
  module.exports =  mongoose.model('DynamicPricing', DynamicPricingSchema);