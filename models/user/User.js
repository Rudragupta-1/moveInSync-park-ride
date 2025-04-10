const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    passwordHash: { type: String, required: true },
    profileImage: String,
    metroCardId: String, // For integration with metro transport
    digitalWalletId: String, // For seamless payments
    vehicleDetails: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' }],
    preferences: {
      defaultRideType: { type: String, enum: ['cab', 'shuttle', 'e-rickshaw'] },
      notificationPreferences: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: true },
        push: { type: Boolean, default: true }
      },
      parkingPreferences: {
        preferNearExit: { type: Boolean, default: false },
        preferNearElevator: { type: Boolean, default: false },
        preferCovered: { type: Boolean, default: false },
        maxWalkingDistance: Number, // in meters
      },
      
      favoriteStations: [String],
      favoriteRoutes: [{ 
        from: String, 
        to: String, 
        frequency: { type: Number, default: 0 } 
      }]
    },
    commuteHistory: [{
      date: { type: Date, default: Date.now },
      from: String,
      to: String,
      mode: String, // metro, cab, etc.
      bookingId: mongoose.Schema.Types.ObjectId
    }],
    loyaltyPoints: { type: Number, default: 0 },
    loyaltyTier: { type: String, enum: ['bronze', 'silver', 'gold', 'platinum'], default: 'bronze' },
    subscription: {
      plan: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' },
      startDate: Date,
      endDate: Date,
      autoRenew: { type: Boolean, default: false },
      status: { type: String, enum: ['active', 'expired', 'cancelled'], default: 'active' }
    },
    paymentMethods: [{
      type: { type: String, enum: ['credit', 'debit', 'upi', 'wallet'] },
      token: String, // Tokenized payment info
      isDefault: Boolean,
      lastUsed: Date
    }],
    isVerified: { type: Boolean, default: false },
    verificationToken: String,
    passwordResetToken: String,
    passwordResetExpires: Date,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  }, { timestamps: true });
  module.exports =mongoose.model('User', UserSchema);