const ParkingStation = require('../models/parking/ParkingStation');
const ParkingSpot = require('../models/parking/ParkingSpot');
const ParkingBooking = require('../models/parking/ParkingBooking');
const Vehicle = require('../models/user/Vehicle'); // Assuming this exists
const mongoose = require('mongoose');
const { generateBookingReference, generateQRCode } = require('../utils/helpers'); // Assuming these utility functions exist

/**
 * Parking Station Controllers
 */
exports.addParkingStation = async (req, res) => {
  try {
    const {
      name,
      location, // { address, city, state, zipCode, coordinates: { lat, lng } }
      totalSpots,
      availableSpots,
      levels,
      allocationStrategy,
      costMatrix,
      operatingHours,
      facilities,
      nearbyMetroStations,
      imageUrls,
      contactInfo
    } = req.body;

    // Basic validation
    if (
      !name ||
      !location ||
      !location.coordinates ||
      location.coordinates.lat == null ||
      location.coordinates.lng == null ||
      totalSpots == null
    ) {
      return res.status(400).json({
        success: false,
        message: 'Required fields are missing: name, location.coordinates.lat/lng, totalSpots'
      });
    }

    const newStation = new ParkingStation({
      name,
      location,
      totalSpots,
      availableSpots: availableSpots ?? totalSpots,
      levels,
      allocationStrategy,
      costMatrix,
      operatingHours,
      facilities,
      nearbyMetroStations,
      imageUrls,
      contactInfo,
      isActive: true
    });

    await newStation.save();

    res.status(201).json({
      success: true,
      message: 'Parking station added successfully',
      data: newStation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getAllStations = async (req, res) => {
  try {
    const stations = await ParkingStation.find({ isActive: true });
    res.status(200).json({ success: true, count: stations.length, data: stations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getStationById = async (req, res) => {
  try {
    const station = await ParkingStation.findById(req.params.id);
    if (!station) {
      return res.status(404).json({ success: false, message: 'Station not found' });
    }
    res.status(200).json({ success: true, data: station });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getStationsNearMetro = async (req, res) => {
  try {
    const metroId = req.params.metroId;
    const stations = await ParkingStation.find({
      'nearbyMetroStations.name': metroId,
      isActive: true
    });
    res.status(200).json({ success: true, count: stations.length, data: stations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getStationsNearLocation = async (req, res) => {
  try {
    const { lat, lng, radius = 5000 } = req.query; // radius in meters, default 5km

    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'Latitude and longitude are required' });
    }

    // Find stations within the specified radius
    const stations = await ParkingStation.find({
      isActive: true,
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radius
        }
      }
    });

    res.status(200).json({ success: true, count: stations.length, data: stations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Parking Spot Controllers
 */
// In parkingController.js
exports.addParkingSpot = async (req, res) => {
  try {
    const {
      stationId,
      level,
      slotNumber,
      category,
      coordinates,
      distanceToExit,
      distanceToElevator,
      preferenceScore,
      sensorId
    } = req.body;

    // Basic validation
    if (!stationId || !level || !slotNumber) {
      return res.status(400).json({
        success: false,
        message: 'stationId, level, and slotNumber are required fields.'
      });
    }

    const newSpot = new ParkingSpot({
      stationId,
      level,
      slotNumber,
      category,
      coordinates,
      distanceToExit,
      distanceToElevator,
      preferenceScore,
      sensorId,
    });

    await newSpot.save();

    res.status(201).json({
      success: true,
      message: 'Parking spot added successfully',
      data: newSpot
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getSpotsByStation = async (req, res) => {
  try {
    const stationId = req.params.stationId;
    const spots = await ParkingSpot.find({ stationId });
    res.status(200).json({ success: true, count: spots.length, data: spots });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAvailableSpotsByStation = async (req, res) => {
  try {
    const stationId = req.params.stationId;
    const spots = await ParkingSpot.find({ 
      stationId, 
      isOccupied: false, 
      isReserved: false 
    });
    res.status(200).json({ success: true, count: spots.length, data: spots });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSpotsByCategory = async (req, res) => {
  try {
    const { stationId, category } = req.params;
    const spots = await ParkingSpot.find({ stationId, category });
    res.status(200).json({ success: true, count: spots.length, data: spots });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Parking Booking Controllers
 */
exports.createBooking = async (req, res) => {
  try {
    const {
      stationId,
      parkingSpotId,
      vehicleId,
      startTime,
      endTime,
      bookingType,
      baseAmount,
      discountAmount,
      totalAmount
    } = req.body;

    // Basic validation
    if (!stationId || !parkingSpotId || !vehicleId || !startTime || !endTime || !bookingType) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    // Check if spot is available
    const parkingSpot = await ParkingSpot.findById(parkingSpotId);
    if (!parkingSpot || parkingSpot.isOccupied || parkingSpot.isReserved) {
      return res.status(400).json({ 
        success: false, 
        message: 'Parking spot is not available' 
      });
    }

    // Simple booking reference using timestamp
    const bookingReference = `BK-${Date.now()}`;

    // Create booking
    const newBooking = new ParkingBooking({
      userId: req.user.userId, // Assuming auth middleware sets req.user
      stationId,
      parkingSpotId,
      vehicleId,
      bookingReference,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      bookingType,
      status: 'booked',
      baseAmount,
      discountAmount: discountAmount || 0,
      totalAmount,
      paymentStatus: 'pending'
    });

    await newBooking.save();

    // Update parking spot status
    parkingSpot.isReserved = true;
    await parkingSpot.save();

    return res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: newBooking
    });

  } catch (error) {
    console.error('Error creating booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await ParkingBooking.find({ userId: req.user.userId })
      .populate('stationId', 'name location')
      .populate('parkingSpotId', 'level slotNumber category')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBookingById = async (req, res) => {
  try {
    const booking = await ParkingBooking.findById(req.params.id)
      .populate('stationId', 'name location operatingHours contactInfo')
      .populate('parkingSpotId', 'level slotNumber category')
      .populate('vehicleId', 'make model licensePlate');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Check if the booking belongs to the current user
    if (booking.userId.toString() !== req.user.userId ) {
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
    // const { cancellationReason } = req.body;
    const cancellationReason = req.body?.cancellationReason || '';

    const booking = await ParkingBooking.findById(id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.userId.toString() !== req.user.userId ) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this booking' });
    }

    const now = new Date();
    const startTime = new Date(booking.startTime);

    if (booking.status === 'checked-in' || now >= startTime) {
      return res.status(400).json({ success: false, message: 'Cannot cancel booking at this time' });
    }

    booking.status = 'cancelled';
    booking.cancellationReason = cancellationReason;

    const hoursLeft = (startTime - now) / (1000 * 60 * 60);

    if (hoursLeft >= 24) {
      booking.refundDetails = {
        amount: booking.totalAmount,
        reason: 'Full refund',
        status: 'processing',
        refundedAt: now
      };
      booking.paymentStatus = 'refunded';
    } else if (hoursLeft >= 6) {
      booking.refundDetails = {
        amount: booking.totalAmount * 0.7,
        reason: 'Partial refund',
        status: 'processing',
        refundedAt: now
      };
      booking.paymentStatus = 'partial-refund';
    } else {
      booking.refundDetails = {
        amount: 0,
        reason: 'No refund',
        status: 'completed',
        refundedAt: now
      };
    }

    await booking.save();

    // Free the spot
    const spot = await ParkingSpot.findById(booking.parkingSpotId);
    if (spot) {
      spot.isReserved = false;
      spot.currentBookingId = null;
      await spot.save();
    }

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};


exports.extendBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const  newEndTime  = req.body?.newEndTime || '';

    if (!newEndTime) {
      return res.status(400).json({ success: false, message: 'New end time is required' });
    }

    const booking = await ParkingBooking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.userId.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to extend this booking' });
    }
    console.log(booking.status);
    if (booking.status!=='booked') {
      return res.status(400).json({ success: false, message: 'Cannot extend booking in current state' });
    }

    const originalEndTime = new Date(booking.endTime);
    const newEndTimeDate = new Date(newEndTime);

    if (newEndTimeDate <= originalEndTime) {
      return res.status(400).json({ success: false, message: 'New end time must be later than current end time' });
    }

    const additionalPricing = await calculateParkingFeeInternal(
      booking.stationId, 
      originalEndTime, 
      newEndTimeDate, 
      booking.bookingType
    );

    if (!additionalPricing.success) {
      return res.status(400).json({ success: false, message: additionalPricing.message });
    }

    // Update booking
    booking.extensionHistory.push({
      originalEndTime,
      newEndTime: newEndTimeDate,
      additionalAmount: additionalPricing.totalAmount,
      extensionTime: new Date()
    });

    booking.endTime = newEndTimeDate;
    booking.status = 'extended';
    booking.totalAmount += additionalPricing.totalAmount;

    await booking.save();

    res.status(200).json({ 
      success: true, 
      data: booking,
      additionalCharge: additionalPricing.totalAmount,
      message: 'Booking extended successfully'
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.checkInBooking = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    
    const booking = await ParkingBooking.findById(id).session(session);
    
    if (!booking) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Check if user is authorized
    if (booking.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ success: false, message: 'Not authorized for this action' });
    }

    // Check if booking can be checked in
    if (booking.status !== 'booked' && booking.status !== 'extended') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'Booking cannot be checked in at current state' });
    }

    const currentTime = new Date();
    const startTime = new Date(booking.startTime);
    const endTime = new Date(booking.endTime);

    // Check if within valid time range
    if (currentTime > endTime) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'Booking has expired' });
    }

    // Update booking status
    booking.status = 'checked-in';
    booking.checkInTime = currentTime;
    await booking.save({ session });

    // Update parking spot status
    const spot = await ParkingSpot.findById(booking.parkingSpotId).session(session);
    if (spot) {
      spot.isReserved = false;
      spot.isOccupied = true;
      spot.currentVehicleId = booking.vehicleId;
      await spot.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ 
      success: true, 
      data: booking,
      message: 'Check-in successful' 
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.checkOutBooking = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    
    const booking = await ParkingBooking.findById(id).session(session);
    
    if (!booking) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Check if user is authorized
    if (booking.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ success: false, message: 'Not authorized for this action' });
    }

    // Check if booking can be checked out
    if (booking.status !== 'checked-in') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'Booking is not checked in' });
    }

    const currentTime = new Date();
    const endTime = new Date(booking.endTime);

    // Calculate additional fees if checking out late
    let additionalFees = 0;
    if (currentTime > endTime) {
      // Add late checkout fee logic here
      const hoursLate = Math.ceil((currentTime - endTime) / (1000 * 60 * 60));
      additionalFees = hoursLate * 10; // Example: $10 per hour late
    }

    // Update booking status
    booking.status = 'checked-out';
    booking.checkOutTime = currentTime;
    if (additionalFees > 0) {
      booking.totalAmount += additionalFees;
    }
    await booking.save({ session });

    // Update parking spot status
    const spot = await ParkingSpot.findById(booking.parkingSpotId).session(session);
    if (spot) {
      spot.isOccupied = false;
      spot.currentVehicleId = null;
      spot.currentBookingId = null;
      await spot.save({ session });
    }

    // Update station available spots
    const station = await ParkingStation.findById(booking.stationId).session(session);
    if (station) {
      station.availableSpots += 1;
      await station.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ 
      success: true, 
      data: booking,
      additionalFees,
      message: additionalFees > 0 
        ? `Check-out successful with $${additionalFees} late fee` 
        : 'Check-out successful' 
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
exports.getParkingPricing = async (req, res) => {
  try {
    const { stationId } = req.params;
    
    const station = await ParkingStation.findById(stationId);
    if (!station) {
      return res.status(404).json({ success: false, message: 'Station not found' });
    }

    // Get pricing data - in a real app, this would be from a pricing table or service
    const pricingData = {
      standard: {
        hourly: 5,
        daily: 30,
        monthly: 500
      },
      compact: {
        hourly: 4,
        daily: 25,
        monthly: 450
      },
      disabled: {
        hourly: 3,
        daily: 20,
        monthly: 400
      },
      'ev-charging': {
        hourly: 8,
        daily: 40,
        monthly: 600
      },
      vip: {
        hourly: 10,
        daily: 50,
        monthly: 800
      }
    };

    res.status(200).json({ success: true, data: pricingData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.calculateParkingFee = async (req, res) => {
  try {
    const { stationId } = req.params;
    const { startTime, endTime, spotCategory = 'standard', bookingType } = req.query;

    if (!startTime || !endTime || !bookingType) {
      return res.status(400).json({ 
        success: false, 
        message: 'Start time, end time, and booking type are required' 
      });
    }

    const result = await calculateParkingFeeInternal(stationId, startTime, endTime, bookingType, spotCategory);
    
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    res.status(200).json({ 
      success: true, 
      data: {
        baseAmount: result.baseAmount,
        discountAmount: result.discountAmount,
        totalAmount: result.totalAmount,
        duration: result.duration,
        unitPrice: result.unitPrice
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Internal helper function for calculating parking fees
 */
async function calculateParkingFeeInternal(stationId, startTime, endTime, bookingType, spotCategory = 'standard') {
  try {
    const station = await ParkingStation.findById(stationId);
    if (!station) {
      return { success: false, message: 'Station not found' };
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return { success: false, message: 'End time must be after start time' };
    }

    // Basic pricing data - in a real app, this would come from a database
    const pricingTable = {
      standard: {
        hourly: 5,
        daily: 30,
        monthly: 500
      },
      compact: {
        hourly: 4,
        daily: 25,
        monthly: 450
      },
      disabled: {
        hourly: 3,
        daily: 20,
        monthly: 400
      },
      'ev-charging': {
        hourly: 8,
        daily: 40,
        monthly: 600
      },
      vip: {
        hourly: 10,
        daily: 50,
        monthly: 800
      }
    };

    if (!pricingTable[spotCategory]) {
      return { success: false, message: 'Invalid spot category' };
    }

    if (!pricingTable[spotCategory][bookingType]) {
      return { success: false, message: 'Invalid booking type' };
    }

    let duration, baseAmount, unitPrice;

    switch (bookingType) {
      case 'hourly':
        // Calculate duration in hours, rounded up
        duration = Math.ceil((end - start) / (1000 * 60 * 60));
        unitPrice = pricingTable[spotCategory].hourly;
        baseAmount = duration * unitPrice;
        break;
      
      case 'daily':
        // Calculate duration in days, rounded up
        duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        unitPrice = pricingTable[spotCategory].daily;
        baseAmount = duration * unitPrice;
        break;
      
      case 'monthly':
        // Calculate duration in months (approximated as 30 days)
        duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24 * 30));
        unitPrice = pricingTable[spotCategory].monthly;
        baseAmount = duration * unitPrice;
        break;
      
      default:
        return { success: false, message: 'Invalid booking type' };
    }

    // Apply time-based discounts (just an example)
    let discountAmount = 0;
    const startHour = start.getHours();
    
    // Off-peak discount (10% discount during night hours 10 PM - 6 AM)
    if (startHour >= 22 || startHour < 6) {
      discountAmount = baseAmount * 0.1;
    }

    // Calculate total amount
    const totalAmount = baseAmount - discountAmount;

    return {
      success: true,
      baseAmount,
      discountAmount,
      totalAmount,
      duration,
      unitPrice
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
}