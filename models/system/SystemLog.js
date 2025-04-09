const SystemLogSchema = new mongoose.Schema({
    action: { type: String, required: true },
    module: { 
      type: String, 
      enum: ['user', 'parking', 'ride', 'payment', 'admin', 'system'], 
      required: true 
    },
    userId: mongoose.Schema.Types.ObjectId, // Can be null for system actions
    details: Object,
    ipAddress: String,
    userAgent: String,
    timestamp: { type: Date, default: Date.now }
  });
  module.exports = mongoose.model('SystemLog', SystemLogSchema);