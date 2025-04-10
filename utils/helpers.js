/**
 * Utility functions for booking operations
 */

const qrcode = require('qrcode');

/**
 * Generates a unique booking reference
 * @param {number} length - The length of the booking reference
 * @returns {string} - A unique booking reference
 */
const generateBookingReference = (length = 8) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  const charactersLength = characters.length;
  
  // Get current timestamp to make it more unique
  const timestamp = new Date().getTime().toString().slice(-4);
  
  // Generate random characters
  for (let i = 0; i < length - 4; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  
  // Append timestamp to make it unique
  return result + timestamp;
};

/**
 * Generates a QR code for a booking
 * @param {string} data - The data to encode in the QR code
 * @returns {Promise<string>} - A promise that resolves to the QR code data URL
 */
const generateQRCode = async (data) => {
  try {
    // Generate QR code as data URL
    return await qrcode.toDataURL(data);
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

module.exports = {
  generateBookingReference,
  generateQRCode
};