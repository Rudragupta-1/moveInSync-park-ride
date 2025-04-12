const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit'); 

// Import routes
const userRoutes = require('./routes/userRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const parkingRoutes = require('./routes/parkingRoutes');
const rideRoutes = require('./routes/rideRoutes');
// const paymentRoutes = require('./routes/paymentRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const metroRoutes = require('./routes/metroRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const allocationRoutes = require('./routes/allocationRoutes'); // Hungarian algorithm routes

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Rate Limiting Middleware
// const apiLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, 
//   max: 100, 
//   standardHeaders: true,
//   legacyHeaders: false,
//   message: {
//     success: false,
//     message: 'Too many requests from this IP, please try again after 15 minutes'
//   }
// });
// app.use('/api', apiLimiter); 

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/users', userRoutes); // Tested
app.use('/api/vehicles', vehicleRoutes); // Tested
app.use('/api/parking', parkingRoutes);// Tested
app.use('/api/rides', rideRoutes);// Tested
app.use('/api/metro', metroRoutes); // Tested
app.use('/api/allocation', allocationRoutes); // Hungarian algorithm allocation routes
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/notifications', notificationRoutes);
// app.use('/api/payments', paymentRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
