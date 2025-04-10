const mongoose = require('mongoose');
const PaymentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bookingType: { type: String, enum: ['parking', 'ride'], required: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, required: true },
    transactionId: { type: String, unique: true },
    amount: { type: Number, required: true },
    paymentMethod: { 
      type: String, 
      enum: ['credit_card', 'debit_card', 'upi', 'wallet', 'metro_card', 'loyalty_points'], 
      required: true 
    },
    paymentGatewayResponse: Object,
    status: { 
      type: String, 
      enum: ['initiated', 'processing', 'completed', 'failed', 'refunded'], 
      default: 'initiated' 
    },
    failureReason: String,
    refundDetails: {
      amount: Number,
      reason: String,
      refundId: String,
      refundedAt: Date
    },
    createdAt: { type: Date, default: Date.now } 
  }, { timestamps: true });
  module.exports =  mongoose.model('Payment', PaymentSchema);