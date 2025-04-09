const VehicleSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['car', 'bike', 'ev'], required: true },
    model: String,
    color: String,
    licensePlate: { type: String, required: true, unique: true },
    RFIDTag: String,
    isDefault: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }, { timestamps: true });
  module.exports = mongoose.model('Vehicle', VehicleSchema);