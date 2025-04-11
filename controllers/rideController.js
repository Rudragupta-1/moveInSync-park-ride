const RideProvider = require('../models/ride/RideProvider');
const RideVehicle = require('../models/ride/RideVehicle');
const Driver = require('../models/ride/Driver');
const RideBooking = require('../models/ride/RideBooking');
const RidePool = require('../models/ride/RidePool');
const ParkingStation = require('../models/parking/ParkingStation');
const mongoose = require('mongoose');
const { generateBookingReference } = require('../utils/helpers'); 

/**
 * Ride Provider Controllers
 */

exports.createProvider = async (req, res) => {
  try {
    const {
      name,
      type,
      contactInfo,
      fleetSize,
      operatingHours,
      servingStations,
      active,
      ratingAverage,
      totalRides
    } = req.body;

    const newProvider = new RideProvider({
      name,
      type,
      contactInfo,
      fleetSize,
      operatingHours,
      servingStations,
      active,
      ratingAverage,
      totalRides
    });

    const savedProvider = await newProvider.save();
    res.status(201).json({ success: true, data: savedProvider });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllProviders = async (req, res) => {
  try {
    const providers = await RideProvider.find({ active: true });
    res.status(200).json({ success: true, count: providers.length, data: providers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProviderById = async (req, res) => {
  try {
    const provider = await RideProvider.findById(req.params.id);
    if (!provider) {
      return res.status(404).json({ success: false, message: 'Provider not found' });
    }
    res.status(200).json({ success: true, data: provider });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProvidersByStation = async (req, res) => {
  try {
    const stationId = req.params.stationId;
    const providers = await RideProvider.find({ 
      servingStations: stationId,
      active: true
    });
    res.status(200).json({ success: true, count: providers.length, data: providers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProvidersByType = async (req, res) => {
  try {
    const type = req.params.type;
    const providers = await RideProvider.find({ 
      type, 
      active: true 
    });
    res.status(200).json({ success: true, count: providers.length, data: providers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Ride Vehicle Controllers
 */
exports.createVehicle = async (req, res) => {
  try {
    const {
      providerId,
      vehicleType,
      registrationNumber,
      capacity,
      currentLocation,
      driverId,
      status,
      features,
      isEV,
      currentBatteryLevel
    } = req.body;

    // Optional: Validate providerId or driverId existence here

    const newVehicle = new RideVehicle({
      providerId,
      vehicleType,
      registrationNumber,
      capacity,
      currentLocation,
      driverId,
      status,
      features,
      isEV,
      currentBatteryLevel
    });

    const savedVehicle = await newVehicle.save();
    res.status(201).json({ success: true, data: savedVehicle });
  } catch (error) {
    // Handle duplicate registration number error
    if (error.code === 11000 && error.keyPattern?.registrationNumber) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle with this registration number already exists'
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getVehiclesByProvider = async (req, res) => {
  try {
    const providerId = req.params.providerId;
    const vehicles = await RideVehicle.find({ 
      providerId,
      status: { $in: ['available', 'on-ride'] }
    });
    res.status(200).json({ success: true, count: vehicles.length, data: vehicles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAvailableVehiclesNearStation = async (req, res) => {
  try {
    const stationId = req.params.stationId;
    
    // Get station coordinates
    const station = await ParkingStation.findById(stationId);
    if (!station) {
      return res.status(404).json({ success: false, message: 'Station not found' });
    }

    const stationLat = station.location.coordinates.lat;
    const stationLng = station.location.coordinates.lng;
    
    // Find providers that serve this station
    const providers = await RideProvider.find({ servingStations: stationId, active: true });
    const providerIds = providers.map(provider => provider._id);
    
    // Find available vehicles from these providers within a certain distance
    const maxDistance = 5000; // 5km in meters
    const vehicles = await RideVehicle.find({
      providerId: { $in: providerIds },
      status: 'available',
      'currentLocation.lat': { $exists: true },
      'currentLocation.lng': { $exists: true }
    });
    
    // Calculate distance for each vehicle and filter by maxDistance
    const nearbyVehicles = vehicles.filter(vehicle => {
      if (!vehicle.currentLocation.lat || !vehicle.currentLocation.lng) return false;
      
      // Simple distance calculation (not perfect but works for demo)
      const distance = calculateDistance(
        stationLat, 
        stationLng, 
        vehicle.currentLocation.lat, 
        vehicle.currentLocation.lng
      );
      
      // Add distance to vehicle object for frontend use
      vehicle._doc.distance = distance;
      return distance <= maxDistance;
    });
    
    // Sort by distance
    nearbyVehicles.sort((a, b) => a._doc.distance - b._doc.distance);
    
    res.status(200).json({ 
      success: true, 
      count: nearbyVehicles.length, 
      data: nearbyVehicles 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
/**
 * Driver Controllers
 */
exports.getDriversByProvider = async (req, res) => {
  try {
    const providerId = req.params.providerId;
    const drivers = await Driver.find({ 
      providerId,
      status: { $in: ['active', 'on-ride'] }
    });
    res.status(200).json({ success: true, count: drivers.length, data: drivers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Ride Booking Controllers
 */
exports.createBooking = async (req, res) => {
  try {
    const { rideType, providerId, vehicleId, pickupLocation, dropLocation, scheduleTime, isShared } = req.body;

    // Validate vehicle
    const vehicle = await RideVehicle.findById(vehicleId);
    if (!vehicle || vehicle.status !== 'available') {
      return res.status(400).json({ success: false, message: 'Invalid or unavailable vehicle' });
    }

    // Validate provider using vehicle's providerId (from DB)
    const actualProvider = await RideProvider.findById(vehicle.providerId);
    if (!actualProvider || !actualProvider.active) {
      return res.status(400).json({ success: false, message: 'Vehicle linked to invalid or inactive provider' });
    }

    // Optional: check if request's providerId matches vehicle's actual one
    if (providerId && providerId !== vehicle.providerId.toString()) {
      return res.status(400).json({ success: false, message: 'Mismatch between provided providerId and vehicle\'s registered provider' });
    }

    // Create booking reference
    const bookingReference = `BOOK-${Date.now()}`;

    // Fare calculation logic (can be extended)
    const baseFare = 100;
    const totalFare = baseFare;

    // Create and save booking
    const booking = new RideBooking({
      userId: req.user.userId,
      bookingReference,
      rideType,
      providerId: vehicle.providerId, // Always trust vehicle's actual provider
      vehicleId,
      pickupLocation,
      dropLocation,
      scheduleTime,
      baseFare,
      totalFare,
      isShared
    });

    await booking.save();

    res.status(201).json({ success: true, data: booking, message: 'Booking created successfully' });

  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};


exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await RideBooking.find({ userId: req.user.userId })
      .populate('providerId', 'name type')
      .populate('vehicleId', 'vehicleType registrationNumber')
      .populate('driverId', 'name phone')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBookingById = async (req, res) => {
  try {
    const booking = await RideBooking.findById(req.params.id)
      .populate('providerId', 'name type contactInfo')
      .populate('vehicleId', 'vehicleType registrationNumber features')
      .populate('driverId', 'name phone profileImage');
      // Removed the ridePoolId populate that was causing the error

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.userId.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this booking' });
    }

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellationReason } = req.body;

    const booking = await RideBooking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Check user authorization
    if (booking.userId.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this booking' });
    }

    // Check if booking is already completed or cancelled
    if (['completed', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: 'Booking cannot be cancelled' });
    }

    // Calculate cancellation fee
    const now = new Date();
    const minutesToDeparture = (new Date(booking.scheduleTime) - now) / (1000 * 60);
    let cancellationFee = 0;

    if (minutesToDeparture < 30) {
      cancellationFee = booking.totalFare * 0.5;
    } else if (minutesToDeparture < 120) {
      cancellationFee = booking.totalFare * 0.2;
    }

    // Update booking
    booking.status = 'cancelled';
    booking.cancellationReason = cancellationReason;
    booking.cancellationFee = cancellationFee;
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking,
      cancellationFee,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


exports.rateRide = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, feedback } = req.body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const booking = await RideBooking.findById(id);
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Check if user authorized to rate
    if (booking.userId.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to rate this ride' });
    }

    // Check if booking can be rated
    // if (booking.status !== 'completed') {
    //   return res.status(400).json({ success: false, message: 'Can only rate completed rides' });
    // }

    // Check if already rated
    if (booking.userRating) {
      return res.status(400).json({ success: false, message: 'Ride already rated' });
    }

    // Update booking with rating
    booking.userRating = rating;
    booking.userFeedback = feedback;
    await booking.save();

    // Update driver's average rating
    if (booking.driverId) {
      const driver = await Driver.findById(booking.driverId);
      if (driver) {
        const newTotalRides = driver.totalRides + 1;
        const newRatingAverage = ((driver.ratingAverage * driver.totalRides) + rating) / newTotalRides;
        
        driver.totalRides = newTotalRides;
        driver.ratingAverage = newRatingAverage;
        await driver.save();
      }
    }

    // Update provider's average rating
    if (booking.providerId) {
      const provider = await RideProvider.findById(booking.providerId);
      if (provider) {
        const newTotalRides = provider.totalRides + 1;
        const newRatingAverage = ((provider.ratingAverage * provider.totalRides) + rating) / newTotalRides;
        
        provider.totalRides = newTotalRides;
        provider.ratingAverage = newRatingAverage;
        await provider.save();
      }
    }

    res.status(200).json({ 
      success: true, 
      data: booking,
      message: 'Ride rated successfully' 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Ride Pool Controllers
 */
exports.getAvailablePoolsFromStation = async (req, res) => {
  try {
    const { stationId } = req.params;
    
    // Get station coordinates
    const station = await ParkingStation.findById(stationId);
    if (!station) {
      return res.status(404).json({ success: false, message: 'Station not found' });
    }

    const stationLat = station.location.coordinates.lat;
    const stationLng = station.location.coordinates.lng;
    
    // Find pools that are forming and have the station as starting point
    const pools = await RidePool.find({
      status: 'forming',
      'startLocation.stationName': station.name,
      occupiedSeats: { $lt: '$capacity' } // Has available seats
    })
    .populate('providerId', 'name type')
    .populate('vehicleId', 'vehicleType capacity features')
    .populate('driverId', 'name ratingAverage');
    
    res.status(200).json({ 
      success: true, 
      count: pools.length, 
      data: pools 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.joinRidePool = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { poolId } = req.params;
    const { dropLocation } = req.body;
    
    if (!dropLocation || !dropLocation.coordinates) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'Drop location is required' });
    }

    const pool = await RidePool.findById(poolId)
      .populate('providerId')
      .populate('vehicleId')
      .session(session);
    
    if (!pool) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Ride pool not found' });
    }

    // Check if pool can be joined
    if (pool.status !== 'forming') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'This pool cannot be joined' });
    }

    if (pool.occupiedSeats >= pool.capacity) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'Pool is already full' });
    }

    // Calculate fare for this leg
    const fareDetails = await calculateRideFareInternal(
      pool.providerId._id,
      pool.startLocation.coordinates,
      dropLocation.coordinates,
      pool.providerId.type,
      true // this is a shared ride
    );

    if (!fareDetails.success) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: fareDetails.message });
    }

    // Create new booking
    const bookingReference = generateBookingReference();
    
    const booking = new RideBooking({
      userId: req.user.id,
      bookingReference,
      rideType: pool.providerId.type,
      providerId: pool.providerId._id,
      vehicleId: pool.vehicleId._id,
      driverId: pool.driverId,
      pickupLocation: {
        stationName: pool.startLocation.stationName,
        coordinates: pool.startLocation.coordinates
      },
      dropLocation,
      scheduleTime: pool.departureTime,
      estimatedDuration: fareDetails.estimatedDuration,
      estimatedDistance: fareDetails.estimatedDistance,
      baseFare: fareDetails.baseFare,
      distanceFare: fareDetails.distanceFare,
      timeFare: fareDetails.timeFare,
      surgeMultiplier: fareDetails.surgeMultiplier,
      totalFare: fareDetails.totalFare,
      isShared: true,
      ridePoolId: pool._id,
      status: pool.driverId ? 'driver-assigned' : 'scheduled'
    });

    await booking.save({ session });

    // Update pool
    pool.occupiedSeats += 1;
    pool.rideBookings.push(booking._id);
    
    // If pool is now full, update status
    if (pool.occupiedSeats >= pool.capacity) {
      pool.status = 'active';
    }
    
    await pool.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ 
      success: true, 
      data: booking,
      message: 'Successfully joined ride pool' 
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Pricing Controllers
 */
exports.getRidePricing = async (req, res) => {
  try {
    const { providerId } = req.params;
    
    const provider = await RideProvider.findById(providerId);
    if (!provider) {
      return res.status(404).json({ success: false, message: 'Provider not found' });
    }

    // Get pricing data based on provider type
    const pricingData = getPricingByProviderType(provider.type);

    res.status(200).json({ success: true, data: pricingData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.calculateRideFare = async (req, res) => {
  try {
    const { 
      providerId, 
      pickupLat, 
      pickupLng, 
      dropLat, 
      dropLng, 
      rideType, 
      isShared = false 
    } = req.query;

    if (!providerId || !pickupLat || !pickupLng || !dropLat || !dropLng || !rideType) {
      return res.status(400).json({ 
        success: false, 
        message: 'Provider ID, pickup coordinates, drop coordinates, and ride type are required' 
      });
    }

    const pickupCoords = { lat: parseFloat(pickupLat), lng: parseFloat(pickupLng) };
    const dropCoords = { lat: parseFloat(dropLat), lng: parseFloat(dropLng) };

    const result = await calculateRideFareInternal(
      providerId,
      pickupCoords,
      dropCoords,
      rideType,
      isShared === 'true'
    );
    
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    res.status(200).json({ 
      success: true, 
      data: {
        estimatedDistance: result.estimatedDistance,
        estimatedDuration: result.estimatedDuration,
        baseFare: result.baseFare,
        distanceFare: result.distanceFare,
        timeFare: result.timeFare,
        surgeMultiplier: result.surgeMultiplier,
        totalFare: result.totalFare
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Internal helper functions
 */

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
}

// Get pricing data based on provider type
function getPricingByProviderType(type) {
  // In a real app, this would likely come from a database
  const pricingTable = {
    'cab': {
      baseFare: 80,
      perKm: 15,
      perMinute: 2,
      minFare: 100,
      cancellationFee: 50
    },
    'shuttle': {
      baseFare: 50,
      perKm: 8,
      perMinute: 1,
      minFare: 70,
      cancellationFee: 30
    },
    'e-rickshaw': {
      baseFare: 30,
      perKm: 10,
      perMinute: 1,
      minFare: 50,
      cancellationFee: 20
    }
  };

  return pricingTable[type] || pricingTable['cab']; // Default to cab if type not found
}

// Calculate current surge multiplier based on time and demand
function calculateSurgeMultiplier() {
  const now = new Date();
  const hour = now.getHours();
  
  // Simple surge pricing model based on time of day
  // In a real app, this would consider current demand, weather, events, etc.
  if (hour >= 7 && hour <= 9) {
    // Morning rush hour: 1.5x
    return 1.5;
  } else if (hour >= 17 && hour <= 19) {
    // Evening rush hour: 1.5x
    return 1.5;
  } else if (hour >= 22 || hour <= 5) {
    // Late night: 1.2x
    return 1.2;
  }
  
  // Normal hours: 1.0x
  return 1.0;
}

// Internal function to calculate ride fare
async function calculateRideFareInternal(providerId, pickupCoords, dropCoords, rideType, isShared) {
  try {
    const provider = await RideProvider.findById(providerId);
    if (!provider) {
      return { success: false, message: 'Provider not found' };
    }

    if (provider.type !== rideType) {
      return { success: false, message: 'Invalid ride type for this provider' };
    }

    // Calculate distance and estimated duration
    const distanceInMeters = calculateDistance(
      pickupCoords.lat,
      pickupCoords.lng,
      dropCoords.lat,
      dropCoords.lng
    );
    
    const distanceInKm = distanceInMeters / 1000;
    
    // Estimate duration (simple model: 2 mins per km + 5 mins buffer)
    const durationInMinutes = Math.ceil((distanceInKm * 2) + 5);
    
    // Get pricing for this provider type
    const pricing = getPricingByProviderType(rideType);
    
    // Calculate fare components
    const baseFare = pricing.baseFare;
    const distanceFare = distanceInKm * pricing.perKm;
    const timeFare = durationInMinutes * pricing.perMinute;
    
    // Calculate surge multiplier
    const surgeMultiplier = calculateSurgeMultiplier();
    
    // Calculate sub-total
    let subTotal = baseFare + distanceFare + timeFare;
    
    // Apply minimum fare if needed
    subTotal = Math.max(subTotal, pricing.minFare);
    
    // Apply shared ride discount if applicable
    if (isShared) {
      subTotal *= 0.7; // 30% discount for shared rides
    }
    
    // Apply surge pricing
    const totalFare = Math.round(subTotal * surgeMultiplier);
    
    return {
      success: true,
      estimatedDistance: parseFloat(distanceInKm.toFixed(2)),
      estimatedDuration: durationInMinutes,
      baseFare,
      distanceFare: parseFloat(distanceFare.toFixed(2)),
      timeFare: parseFloat(timeFare.toFixed(2)),
      surgeMultiplier,
      totalFare
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
}