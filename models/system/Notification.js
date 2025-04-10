const mongoose = require('mongoose');
const NotificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { 
      type: String, 
      enum: ['booking_confirmation', 'reminder', 'check_in', 'check_out', 'ride_update', 'payment', 'promo', 'system'], 
      required: true 
    },
    relatedTo: {
      bookingType: { type: String, enum: ['parking', 'ride'] },
      bookingId: mongoose.Schema.Types.ObjectId
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    sentVia: [{ type: String, enum: ['email', 'sms', 'push'] }],
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }, { timestamps: true });
  module.exports =mongoose.model('Notification', NotificationSchema);