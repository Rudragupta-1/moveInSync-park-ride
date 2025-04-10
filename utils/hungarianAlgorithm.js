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

  vehicles.forEach(vehicle => {
    const vehicleCosts = [];

    parkingSpots.forEach(spot => {
      let cost = 0;

      // Distance-based cost
      if (spot.coordinates && vehicle.currentLocation) {
        const distance = Math.sqrt(
          Math.pow(spot.coordinates.x - vehicle.currentLocation.x, 2) +
          Math.pow(spot.coordinates.y - vehicle.currentLocation.y, 2)
        );
        cost += distance;
      }

      // Allocation strategy adjustment
      switch (station.allocationStrategy) {
        case 'nearest':
          // Handled by distance
          break;

        case 'balanced':
          cost += Math.random() * 10;
          break;

        case 'user-preference': {
          const preferences = vehicle.preferences;
          if (preferences) {
            if (preferences.preferNearExit && spot.distanceToExit) {
              cost += spot.distanceToExit * 2;
            }
            if (preferences.preferNearElevator && spot.distanceToElevator) {
              cost += spot.distanceToElevator * 2;
            }
            if (preferences.maxWalkingDistance && spot.distanceToExit > preferences.maxWalkingDistance) {
              cost += 1000;
            }
          }
          cost -= spot.preferenceScore || 0;
          break;
        }

        case 'energy-efficient':
          if (spot.distanceToExit) {
            cost += spot.distanceToExit * 0.5;
          }
          break;
      }

      // Category mismatch penalty
      if (vehicle.category && spot.category && vehicle.category !== spot.category) {
        cost += 500;
      }

      vehicleCosts.push(cost);
    });

    costMatrix.push(vehicleCosts);
  });

  return costMatrix;
};

/**
 * Pad matrix to be square by adding dummy rows/columns with high cost
 * @param {Array} matrix - The cost matrix
 * @returns {Array} Padded square matrix
 */
const padMatrix = (matrix) => {
  const rowCount = matrix.length;
  const colCount = matrix[0]?.length || 0;
  const size = Math.max(rowCount, colCount);
  const paddedMatrix = [];

  for (let i = 0; i < size; i++) {
    const row = [];
    for (let j = 0; j < size; j++) {
      if (i < rowCount && j < colCount) {
        row.push(matrix[i][j]);
      } else {
        row.push(10000); // High dummy cost
      }
    }
    paddedMatrix.push(row);
  }

  return paddedMatrix;
};

/**
 * Allocate vehicles to parking spots using Hungarian algorithm
 * @param {Array} vehicles - Array of vehicle objects
 * @param {Array} parkingSpots - Array of parking spot objects
 * @param {Object} station - The parking station object
 * @returns {Array} Optimal allocation pairs [{ vehicle, parkingSpot, cost }, ...]
 */
const allocateVehiclesToSpots = (vehicles, parkingSpots, station) => {
  const costMatrix = generateCostMatrix(vehicles, parkingSpots, station);

  if (costMatrix.length === 0 || (costMatrix.length > 0 && costMatrix[0].length === 0)) {
    return [];
  }

  const paddedMatrix = padMatrix(costMatrix);
  const assignments = munkres(paddedMatrix);

  return assignments
    .filter(([vehicleIndex, spotIndex]) =>
      vehicleIndex < vehicles.length && spotIndex < parkingSpots.length
    )
    .map(([vehicleIndex, spotIndex]) => ({
      vehicle: vehicles[vehicleIndex],
      parkingSpot: parkingSpots[spotIndex],
      cost: costMatrix[vehicleIndex][spotIndex]
    }));
};

module.exports = {
  allocateVehiclesToSpots,
  generateCostMatrix
};
