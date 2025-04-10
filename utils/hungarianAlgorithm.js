// utils/hungarianAlgorithm.js
const munkres = require('munkres-js');

/**
 * Generate a cost matrix for Hungarian algorithm based on vehicles and spots
 * @param {Array} vehicles - Array of vehicle objects with preferences
 * @param {Array} parkingSpots - Array of available parking spots
 * @param {Object} station - The parking station object
 * @returns {Array} Cost matrix for the Hungarian algorithm
 */
const generateCostMatrix = (vehicles, parkingSpots, station) => {
  const costMatrix = [];
  
  // For each vehicle, calculate the cost to park in each spot
  vehicles.forEach(vehicle => {
    const vehicleCosts = [];
    
    parkingSpots.forEach(spot => {
      let cost = 0;
      
      // Base cost is distance to spot
      if (spot.coordinates && vehicle.currentLocation) {
        const distance = Math.sqrt(
          Math.pow(spot.coordinates.x - vehicle.currentLocation.x, 2) + 
          Math.pow(spot.coordinates.y - vehicle.currentLocation.y, 2)
        );
        cost += distance;
      }

      // Adjust based on station allocation strategy
      switch(station.allocationStrategy) {
        case 'nearest':
          // Already handled by distance calculation
          break;
        case 'balanced':
          // Add randomization factor to distribute vehicles evenly
          cost += Math.random() * 10;
          break;
        case 'user-preference':
          // Check user parking preferences
          const user = vehicle.userId;
          if (user && user.preferences) {
            if (user.preferences.preferNearExit && spot.distanceToExit) {
              cost += spot.distanceToExit * 2;
            }
            if (user.preferences.preferNearElevator && spot.distanceToElevator) {
              cost += spot.distanceToElevator * 2;
            }
            if (user.preferences.maxWalkingDistance && spot.distanceToExit > user.preferences.maxWalkingDistance) {
              cost += 1000; // Large penalty for exceeding max walking distance
            }
          }
          // Subtract preference score to prioritize premium spots for preferred users
          cost -= spot.preferenceScore;
          break;
        case 'energy-efficient':
          // Prioritize spots that require less movement
          if (spot.distanceToExit) {
            cost += spot.distanceToExit * 0.5;
          }
          break;
      }
      
      // Add category matching cost
      if (vehicle.category && spot.category) {
        if (vehicle.category !== spot.category) {
          // Penalty for mismatched categories (e.g. standard car in disabled spot)
          cost += 500;
        }
      }
      
      vehicleCosts.push(cost);
    });
    
    costMatrix.push(vehicleCosts);
  });
  
  return costMatrix;
};

/**
 * Allocate vehicles to parking spots using Hungarian algorithm
 * @param {Array} vehicles - Array of vehicle objects
 * @param {Array} parkingSpots - Array of parking spot objects
 * @param {Object} station - The parking station object
 * @returns {Array} Optimal allocation pairs [[vehicleIndex, spotIndex], ...]
 */
const allocateVehiclesToSpots = (vehicles, parkingSpots, station) => {
  // Generate cost matrix
  const costMatrix = generateCostMatrix(vehicles, parkingSpots, station);
  
  // If no vehicles or spots, return empty allocation
  if (costMatrix.length === 0 || (costMatrix.length > 0 && costMatrix[0].length === 0)) {
    return [];
  }
  
  // Use munkres algorithm to solve assignment problem
  const assignments = munkres(costMatrix);
  
  // Map indexes to actual vehicle and spot objects
  return assignments.map(([vehicleIndex, spotIndex]) => ({
    vehicle: vehicles[vehicleIndex],
    parkingSpot: parkingSpots[spotIndex],
    cost: costMatrix[vehicleIndex][spotIndex]
  }));
};

module.exports = {
  allocateVehiclesToSpots,
  generateCostMatrix
};