// // controllers/allocationController.js
// const ParkingSpot = require('../models/parking/ParkingSpot');
// const ParkingStation = require('../models/parking/ParkingStation');
// const User = require('../models/user/User');
// const Vehicle = require('../models/user/Vehicle');
// const { allocateVehiclesToSpots } = require('../utils/hungarianAlgorithm');

// /**
//  * Allocate vehicles to parking spots for a given station
//  * @param {Object} req - Request object
//  * @param {Object} res - Response object 
//  */
// exports.allocateVehiclesToStation = async (req, res) => {
//   try {
//     const { stationId } = req.params;
//     const { vehicleIds } = req.body;
    
//     if (!stationId) {
//       return res.status(400).json({ success: false, message: 'Station ID is required' });
//     }
    
//     if (!vehicleIds || !Array.isArray(vehicleIds) || vehicleIds.length === 0) {
//       return res.status(400).json({ success: false, message: 'Vehicle IDs array is required' });
//     }

//     // Get the station details
//     const station = await ParkingStation.findById(stationId);
//     if (!station) {
//       return res.status(404).json({ success: false, message: 'Parking station not found' });
//     }
    
//     // Get available parking spots in the station
//     const availableSpots = await ParkingSpot.find({
//       stationId,
//       isOccupied: false,
//       isReserved: false
//     });
    
//     if (availableSpots.length === 0) {
//       return res.status(404).json({ success: false, message: 'No available parking spots found' });
//     }
    
//     // Get vehicle details with user preferences
//     const vehicles = await Vehicle.find({
//       _id: { $in: vehicleIds }
//     }).populate({
//       path: 'userId',
//       model: 'User',
//       select: 'preferences'
//     });
    
//     if (vehicles.length === 0) {
//       return res.status(404).json({ success: false, message: 'No vehicles found' });
//     }
    
//     // If more vehicles than spots, handle error
//     if (vehicles.length > availableSpots.length) {
//       return res.status(400).json({
//         success: false,
//         message: `Not enough parking spots. Requested: ${vehicles.length}, Available: ${availableSpots.length}`
//       });
//     }
    
//     // Use Hungarian algorithm to allocate vehicles to spots
//     const allocations = allocateVehiclesToSpots(vehicles, availableSpots, station);
    
//     // Process and return the allocation results
//     const allocationDetails = allocations.map(allocation => {
//       return {
//         vehicleId: allocation.vehicle._id,
//         registrationNumber: allocation.vehicle.registrationNumber,
//         parkingSpotId: allocation.parkingSpot._id,
//         level: allocation.parkingSpot.level,
//         slotNumber: allocation.parkingSpot.slotNumber,
//         cost: allocation.cost
//       };
//     });
    
//     res.status(200).json({
//       success: true,
//       message: 'Vehicles allocated successfully',
//       allocations: allocationDetails
//     });
    
//   } catch (error) {
//     console.error('Error in allocation:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error processing allocation',
//       error: error.message
//     });
//   }
// };

// /**
//  * Reserve spots based on allocation
//  * @param {Object} req - Request object
//  * @param {Object} res - Response object
//  */
// exports.reserveAllocatedSpots = async (req, res) => {
//   try {
//     const { allocations } = req.body;
    
//     if (!allocations || !Array.isArray(allocations) || allocations.length === 0) {
//       return res.status(400).json({ success: false, message: 'Allocations array is required' });
//     }
    
//     const reservationResults = [];
    
//     // Process each allocation
//     for (const allocation of allocations) {
//       const { vehicleId, parkingSpotId } = allocation;
      
//       // Update parking spot
//       const updatedSpot = await ParkingSpot.findByIdAndUpdate(
//         parkingSpotId,
//         {
//           isReserved: true,
//           currentVehicleId: vehicleId,
//           lastUpdated: new Date()
//         },
//         { new: true }
//       );
      
//       reservationResults.push({
//         vehicleId,
//         parkingSpotId,
//         success: !!updatedSpot,
//         details: updatedSpot ? {
//           level: updatedSpot.level,
//           slotNumber: updatedSpot.slotNumber
//         } : 'Failed to update spot'
//       });
//     }
    
//     // Update station available spots count
//     const stationId = req.body.stationId;
//     if (stationId) {
//       const station = await ParkingStation.findById(stationId);
//       if (station) {
//         station.availableSpots = Math.max(0, station.availableSpots - allocations.length);
//         await station.save();
//       }
//     }
    
//     res.status(200).json({
//       success: true,
//       message: 'Spots reserved based on allocation',
//       reservations: reservationResults
//     });
    
//   } catch (error) {
//     console.error('Error in reserving spots:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error reserving spots',
//       error: error.message
//     });
//   }
// };

// /**
//  * Generate and retrieve the cost matrix for a station
//  * @param {Object} req - Request object
//  * @param {Object} res - Response object
//  */
// exports.getCostMatrix = async (req, res) => {
//   try {
//     const { stationId } = req.params;
//     const { vehicleIds } = req.body;
    
//     if (!stationId) {
//       return res.status(400).json({ success: false, message: 'Station ID is required' });
//     }
    
//     if (!vehicleIds || !Array.isArray(vehicleIds)) {
//       return res.status(400).json({ success: false, message: 'Vehicle IDs array is required' });
//     }
    
//     // Get the station details
//     const station = await ParkingStation.findById(stationId);
//     if (!station) {
//       return res.status(404).json({ success: false, message: 'Parking station not found' });
//     }
    
//     // Get available parking spots in the station
//     const availableSpots = await ParkingSpot.find({
//       stationId,
//       isOccupied: false,
//       isReserved: false
//     });
    
//     // Get vehicle details
//     const vehicles = await Vehicle.find({
//       _id: { $in: vehicleIds }
//     }).populate({
//       path: 'userId',
//       model: 'User',
//       select: 'preferences'
//     });
    
//     // Import the helper function
//     const { generateCostMatrix } = require('../utils/hungarianAlgorithm');
    
//     // Generate cost matrix
//     const costMatrix = generateCostMatrix(vehicles, availableSpots, station);
    
//     // Create a more detailed response
//     const formattedResponse = {
//       station: {
//         id: station._id,
//         name: station.name,
//         allocationStrategy: station.allocationStrategy
//       },
//       vehicles: vehicles.map(v => ({
//         id: v._id,
//         registrationNumber: v.registrationNumber || 'Unknown',
//         category: v.category || 'standard'
//       })),
//       parkingSpots: availableSpots.map(spot => ({
//         id: spot._id,
//         level: spot.level,
//         slotNumber: spot.slotNumber,
//         category: spot.category
//       })),
//       costMatrix: costMatrix
//     };
    
//     // Update the station's costMatrix data
//     await ParkingStation.findByIdAndUpdate(stationId, {
//       'costMatrix.lastUpdated': new Date()
//     });
    
//     res.status(200).json({
//       success: true,
//       message: 'Cost matrix generated successfully',
//       data: formattedResponse
//     });
    
//   } catch (error) {
//     console.error('Error generating cost matrix:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error generating cost matrix',
//       error: error.message
//     });
//   }
// };