const { Vehicle } = require('../models/user/Vehicle');

// Add a new vehicle
exports.addVehicle = async (req, res) => {
  try {
    const { type, model, color, licensePlate, isDefault } = req.body;
    const userId = req.userId;

    // Check if license plate is already registered
    const existingVehicle = await Vehicle.findOne({ licensePlate });
    if (existingVehicle) {
      return res.status(400).json({
        success: false,
        message: 'License plate already registered'
      });
    }

    // If this is the default vehicle, set other vehicles to non-default
    if (isDefault) {
      await Vehicle.updateMany(
        { userId },
        { $set: { isDefault: false } }
      );
    }

    // Create new vehicle
    const vehicle = new Vehicle({
      userId,
      type,
      model,
      color,
      licensePlate,
      isDefault: isDefault || false
    });

    await vehicle.save();

    res.status(201).json({
      success: true,
      message: 'Vehicle added successfully',
      vehicle
    });
  } catch (err) {
    console.error('Add vehicle error:', err);
    res.status(500).json({
      success: false,
      message: 'Error adding vehicle',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Get all vehicles for current user
exports.getUserVehicles = async (req, res) => {
  try {
    const userId = req.userId;

    const vehicles = await Vehicle.find({ userId });

    res.status(200).json({
      success: true,
      count: vehicles.length,
      vehicles
    });
  } catch (err) {
    console.error('Get vehicles error:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching vehicles',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Get vehicle by ID
exports.getVehicleById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const vehicle = await Vehicle.findOne({ _id: id, userId });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    res.status(200).json({
      success: true,
      vehicle
    });
  } catch (err) {
    console.error('Get vehicle error:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching vehicle',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Update vehicle
exports.updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, model, color, licensePlate, isDefault } = req.body;
    const userId = req.userId;

    // Find vehicle
    const vehicle = await Vehicle.findOne({ _id: id, userId });
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Check if license plate is changed and already exists
    if (licensePlate && licensePlate !== vehicle.licensePlate) {
      const existingVehicle = await Vehicle.findOne({ licensePlate });
      if (existingVehicle) {
        return res.status(400).json({
          success: false,
          message: 'License plate already registered'
        });
      }
    }

    // If setting as default, update other vehicles
    if (isDefault) {
      await Vehicle.updateMany(
        { userId, _id: { $ne: id } },
        { $set: { isDefault: false } }
      );
    }

    // Update vehicle
    if (type) vehicle.type = type;
    if (model) vehicle.model = model;
    if (color) vehicle.color = color;
    if (licensePlate) vehicle.licensePlate = licensePlate;
    if (isDefault !== undefined) vehicle.isDefault = isDefault;

    await vehicle.save();

    res.status(200).json({
      success: true,
      message: 'Vehicle updated successfully',
      vehicle
    });
  } catch (err) {
    console.error('Update vehicle error:', err);
    res.status(500).json({
      success: false,
      message: 'Error updating vehicle',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Delete vehicle
exports.deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Find and delete vehicle
    const vehicle = await Vehicle.findOneAndDelete({ _id: id, userId });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // If deleted vehicle was default, set another vehicle as default
    if (vehicle.isDefault) {
      const anotherVehicle = await Vehicle.findOne({ userId });
      if (anotherVehicle) {
        anotherVehicle.isDefault = true;
        await anotherVehicle.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Vehicle deleted successfully'
    });
  } catch (err) {
    console.error('Delete vehicle error:', err);
    res.status(500).json({
      success: false,
      message: 'Error deleting vehicle',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Set vehicle as default
exports.setDefaultVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Find vehicle
    const vehicle = await Vehicle.findOne({ _id: id, userId });
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Update all user vehicles to non-default
    await Vehicle.updateMany(
      { userId },
      { $set: { isDefault: false } }
    );

    // Set selected vehicle as default
    vehicle.isDefault = true;
    await vehicle.save();

    res.status(200).json({
      success: true,
      message: 'Default vehicle updated successfully',
      vehicle
    });
  } catch (err) {
    console.error('Set default vehicle error:', err);
    res.status(500).json({
      success: false,
      message: 'Error setting default vehicle',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Add RFID tag to vehicle
exports.addRFIDTag = async (req, res) => {
  try {
    const { id } = req.params;
    const { rfidTag } = req.body;
    const userId = req.userId;

    // Find vehicle
    const vehicle = await Vehicle.findOne({ _id: id, userId });
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Check if RFID is already assigned to another vehicle
    const existingVehicle = await Vehicle.findOne({ RFIDTag: rfidTag });
    if (existingVehicle && existingVehicle._id.toString() !== id) {
      return res.status(400).json({
        success: false,
        message: 'RFID tag already assigned to another vehicle'
      });
    }

    // Update vehicle
    vehicle.RFIDTag = rfidTag;
    await vehicle.save();

    res.status(200).json({
      success: true,
      message: 'RFID tag added successfully',
      vehicle
    });
  } catch (err) {
    console.error('Add RFID tag error:', err);
    res.status(500).json({
      success: false,
      message: 'Error adding RFID tag',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};