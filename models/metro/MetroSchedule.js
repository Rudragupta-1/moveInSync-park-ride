const MetroScheduleSchema = new mongoose.Schema({
    stationId: { type: mongoose.Schema.Types.ObjectId, ref: 'MetroStation', required: true },
    lineName: { type: String, required: true },
    direction: { type: String, required: true }, // e.g., "Northbound", "Eastbound"
    dayType: { type: String, enum: ['weekday', 'saturday', 'sunday', 'holiday'], required: true },
    departureTimes: [String], // Array of departure times in 24h format
    frequency: {
      peakHours: Number, // in minutes
      offPeakHours: Number // in minutes
    },
    isActive: { type: Boolean, default: true }
  }, { timestamps: true });
  module.exports = mongoose.model('MetroSchedule', MetroScheduleSchema);