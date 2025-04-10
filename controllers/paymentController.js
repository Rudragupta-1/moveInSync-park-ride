// const Payment = require('../models/payment');
// const User = require('../models/user/User');
// const crypto = require('crypto');
// // This would be your payment gateway integration 
// const paymentGateway = require('../services/paymentGateway');

// const paymentController = {
//   // Initiate a new payment transaction
//   async initiatePayment(req, res) {
//     try {
//       const userId = req.user.userId;
//       const { bookingType, bookingId, amount, paymentMethod } = req.body;
      
//       // Validate input
//       if (!bookingType || !bookingId || !amount || !paymentMethod) {
//         return res.status(400).json({ message: 'Missing required payment information' });
//       }
      
//       // Generate unique transaction ID
//       const transactionId = `TXN${Date.now()}${crypto.randomBytes(4).toString('hex')}`;
      
//       // Handle loyalty points payment differently
//       if (paymentMethod === 'loyalty_points') {
//         const user = await User.findById(userId);
//         if (!user) {
//           return res.status(404).json({ message: 'User not found' });
//         }
        
//         // Check if user has enough points
//         // Assuming 1 point = ₹1 for simplicity
//         if (user.loyaltyPoints < amount) {
//           return res.status(400).json({ 
//             message: 'Insufficient loyalty points', 
//             available: user.loyaltyPoints 
//           });
//         }
        
//         // Create payment record
//         const payment = new Payment({
//           userId,
//           bookingType,
//           bookingId,
//           transactionId,
//           amount,
//           paymentMethod: 'loyalty_points',
//           status: 'completed',
//           paymentGatewayResponse: { method: 'loyalty_points' }
//         });
        
//         await payment.save();
        
//         // Deduct points from user
//         user.loyaltyPoints -= amount;
//         await user.save();
        
//         return res.status(200).json({
//           message: 'Payment completed successfully using loyalty points',
//           transactionId,
//           status: 'completed',
//           paymentId: payment._id
//         });
//       }
      
//       // For other payment methods, initiate payment with gateway
//       const paymentIntent = await paymentGateway.createPaymentIntent({
//         amount,
//         currency: 'inr',
//         paymentMethod,
//         description: `Payment for ${bookingType} booking #${bookingId}`
//       });
      
//       // Create payment record
//       const payment = new Payment({
//         userId,
//         bookingType,
//         bookingId,
//         transactionId,
//         amount,
//         paymentMethod,
//         status: 'initiated',
//         paymentGatewayResponse: paymentIntent
//       });
      
//       await payment.save();
      
//       return res.status(200).json({
//         message: 'Payment initiated successfully',
//         transactionId,
//         clientSecret: paymentIntent.clientSecret,
//         paymentId: payment._id
//       });
//     } catch (error) {
//       console.error('Initiate payment error:', error);
//       return res.status(500).json({ message: 'Server error while initiating payment' });
//     }
//   },
  
//   // Verify payment status after frontend completes payment
//   async verifyPayment(req, res) {
//     try {
//       const userId = req.user.userId;
//       const { transactionId, paymentIntentId } = req.body;
      
//       // Find payment record
//       const payment = await Payment.findOne({ transactionId, userId });
//       if (!payment) {
//         return res.status(404).json({ message: 'Payment not found' });
//       }
      
//       // Check payment status with gateway
//       const paymentDetails = await paymentGateway.retrievePayment(paymentIntentId);
      
//       // Update payment record
//       payment.status = paymentDetails.status === 'succeeded' ? 'completed' : 
//                        paymentDetails.status === 'failed' ? 'failed' : 'processing';
      
//       if (payment.status === 'failed') {
//         payment.failureReason = paymentDetails.failureMessage || 'Payment failed at gateway';
//       }
      
//       // Update gateway response
//       payment.paymentGatewayResponse = {
//         ...payment.paymentGatewayResponse,
//         verificationResponse: paymentDetails
//       };
      
//       await payment.save();
      
//       // If payment completed successfully, add loyalty points to user (except for loyalty point payments)
//       if (payment.status === 'completed' && payment.paymentMethod !== 'loyalty_points') {
//         const pointsEarned = Math.floor(payment.amount * 0.1); // 10% of amount as points
        
//         const user = await User.findById(userId);
//         if (user) {
//           user.loyaltyPoints += pointsEarned;
          
//           // Check if user should be upgraded to next tier
//           if (user.loyaltyPoints >= 500 && user.loyaltyTier !== 'platinum') {
//             user.loyaltyTier = 'platinum';
//           } else if (user.loyaltyPoints >= 300 && user.loyaltyTier !== 'platinum' && user.loyaltyTier !== 'gold') {
//             user.loyaltyTier = 'gold';
//           } else if (user.loyaltyPoints >= 100 && user.loyaltyTier === 'bronze') {
//             user.loyaltyTier = 'silver';
//           }
          
//           await user.save();
//         }
//       }
      
//       return res.status(200).json({
//         status: payment.status,
//         message: payment.status === 'completed' ? 
//                 'Payment completed successfully' : 
//                 payment.status === 'failed' ? 
//                 `Payment failed: ${payment.failureReason}` : 
//                 'Payment is being processed'
//       });
//     } catch (error) {
//       console.error('Verify payment error:', error);
//       return res.status(500).json({ message: 'Server error while verifying payment' });
//     }
//   },
  
//   // Get payment history for the user
//   async getPaymentHistory(req, res) {
//     try {
//       const userId = req.user.userId;
//       const { limit = 10, page = 1, bookingType, status } = req.query;
      
//       // Build query
//       const query = { userId };
      
//       if (bookingType) {
//         query.bookingType = bookingType;
//       }
      
//       if (status) {
//         query.status = status;
//       }
      
//       // Calculate pagination
//       const skip = (parseInt(page) - 1) * parseInt(limit);
      
//       // Fetch payments
//       const payments = await Payment.find(query)
//         .select('-paymentGatewayResponse') // Exclude potentially large response data
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(parseInt(limit));
      
//       // Get total count
//       const total = await Payment.countDocuments(query);
      
//       return res.status(200).json({
//         payments,
//         pagination: {
//           total,
//           page: parseInt(page),
//           pages: Math.ceil(total / parseInt(limit))
//         }
//       });
//     } catch (error) {
//       console.error('Get payment history error:', error);
//       return res.status(500).json({ message: 'Server error while retrieving payment history' });
//     }
//   },
  
//   // Get details for a specific payment
//   async getPaymentById(req, res) {
//     try {
//       const userId = req.user.userId;
//       const { id } = req.params;
      
//       const payment = await Payment.findOne({ _id: id, userId });
//       if (!payment) {
//         return res.status(404).json({ message: 'Payment not found' });
//       }
      
//       // Remove sensitive gateway details
//       const sanitizedPayment = payment.toObject();
//       if (sanitizedPayment.paymentGatewayResponse) {
//         delete sanitizedPayment.paymentGatewayResponse.credentials;
//         // Keep only necessary gateway response info
//         sanitizedPayment.paymentGatewayResponse = {
//           status: sanitizedPayment.paymentGatewayResponse.status,
//           method: sanitizedPayment.paymentGatewayResponse.method,
//           timestamp: sanitizedPayment.paymentGatewayResponse.timestamp
//         };
//       }
      
//       return res.status(200).json({ payment: sanitizedPayment });
//     } catch (error) {
//       console.error('Get payment by ID error:', error);
//       return res.status(500).json({ message: 'Server error while retrieving payment details' });
//     }
//   },
  
//   // Request a refund for a payment
//   async requestRefund(req, res) {
//     try {
//       const userId = req.user.userId;
//       const { id } = req.params;
//       const { reason, amount } = req.body;
      
//       // Validate input
//       if (!reason) {
//         return res.status(400).json({ message: 'Refund reason is required' });
//       }
      
//       // Find the payment
//       const payment = await Payment.findOne({ _id: id, userId });
//       if (!payment) {
//         return res.status(404).json({ message: 'Payment not found' });
//       }
      
//       // Check if payment is eligible for refund
//       if (payment.status !== 'completed') {
//         return res.status(400).json({ 
//           message: `Payment cannot be refunded. Current status: ${payment.status}` 
//         });
//       }
      
//       if (payment.status === 'refunded') {
//         return res.status(400).json({ message: 'This payment has already been refunded' });
//       }
      
//       // Determine refund amount
//       const refundAmount = amount && amount <= payment.amount ? amount : payment.amount;
      
//       // Process refund with payment gateway
//       let refundResult;
      
//       if (payment.paymentMethod === 'loyalty_points') {
//         // For loyalty points, just add points back to user
//         const user = await User.findById(userId);
//         if (user) {
//           user.loyaltyPoints += refundAmount;
//           await user.save();
//         }
        
//         refundResult = {
//           refundId: `REFUND${Date.now()}`,
//           status: 'succeeded'
//         };
//       } else {
//         // For other payment methods, process through gateway
//         refundResult = await paymentGateway.createRefund({
//           paymentIntent: payment.paymentGatewayResponse.id,
//           amount: refundAmount
//         });
//       }
      
//       // Update payment record
//       payment.status = 'refunded';
//       payment.refundDetails = {
//         amount: refundAmount,
//         reason,
//         refundId: refundResult.refundId,
//         refundedAt: new Date()
//       };
      
//       await payment.save();
      
//       return res.status(200).json({
//         message: 'Refund processed successfully',
//         refundId: refundResult.refundId,
//         amount: refundAmount
//       });
//     } catch (error) {
//       console.error('Request refund error:', error);
//       return res.status(500).json({ message: 'Server error while processing refund request' });
//     }
//   },
  
//   // Check status of a refund
//   async getRefundStatus(req, res) {
//     try {
//       const userId = req.user.userId;
//       const { id } = req.params;
      
//       const payment = await Payment.findOne({ _id: id, userId });
//       if (!payment) {
//         return res.status(404).json({ message: 'Payment not found' });
//       }
      
//       if (!payment.refundDetails || !payment.refundDetails.refundId) {
//         return res.status(404).json({ message: 'No refund has been requested for this payment' });
//       }
      
//       // For loyalty point refunds, we already know the status
//       if (payment.paymentMethod === 'loyalty_points') {
//         return res.status(200).json({
//           refundId: payment.refundDetails.refundId,
//           status: 'completed',
//           amount: payment.refundDetails.amount,
//           processedAt: payment.refundDetails.refundedAt
//         });
//       }
      
//       // For other methods, check with payment gateway
//       const refundStatus = await paymentGateway.retrieveRefund(payment.refundDetails.refundId);
      
//       return res.status(200).json({
//         refundId: payment.refundDetails.refundId,
//         status: refundStatus.status,
//         amount: payment.refundDetails.amount,
//         processedAt: refundStatus.created ? new Date(refundStatus.created * 1000) : payment.refundDetails.refundedAt
//       });
//     } catch (error) {
//       console.error('Get refund status error:', error);
//       return res.status(500).json({ message: 'Server error while retrieving refund status' });
//     }
//   },
  
//   // Redeem loyalty points for a booking
//   async redeemLoyaltyPoints(req, res) {
//     try {
//       const userId = req.user.userId;
//       const { bookingType, bookingId, points } = req.body;
      
//       // Validate input
//       if (!bookingType || !bookingId || !points || points <= 0) {
//         return res.status(400).json({ message: 'Invalid redemption request' });
//       }
      
//       const user = await User.findById(userId);
//       if (!user) {
//         return res.status(404).json({ message: 'User not found' });
//       }
      
//       // Check if user has enough points
//       if (user.loyaltyPoints < points) {
//         return res.status(400).json({ 
//           message: 'Insufficient loyalty points', 
//           available: user.loyaltyPoints 
//         });
//       }
      
//       // Generate transaction ID
//       const transactionId = `LPR${Date.now()}${crypto.randomBytes(2).toString('hex')}`;
      
//       // Create payment record
//       const payment = new Payment({
//         userId,
//         bookingType,
//         bookingId,
//         transactionId,
//         amount: points, // Amount is in points
//         paymentMethod: 'loyalty_points',
//         status: 'completed',
//         paymentGatewayResponse: { method: 'loyalty_points' }
//       });
      
//       await payment.save();
      
//       // Deduct points from user
//       user.loyaltyPoints -= points;
//       await user.save();
      
//       return res.status(200).json({
//         message: `Successfully redeemed ${points} loyalty points`,
//         transactionId,
//         remainingPoints: user.loyaltyPoints
//       });
//     } catch (error) {
//       console.error('Redeem loyalty points error:', error);
//       return res.status(500).json({ message: 'Server error while redeeming loyalty points' });
//     }
//   },
  
//   // Get history of earned loyalty points
//   async getEarnedPointsHistory(req, res) {
//     try {
//       const userId = req.user.userId;
//       const { limit = 10, page = 1 } = req.query;
      
//       // Calculate pagination
//       const skip = (parseInt(page) - 1) * parseInt(limit);
      
//       // Get payments that earned points (non-loyalty point payments)
//       const payments = await Payment.find({ 
//         userId, 
//         status: 'completed',
//         paymentMethod: { $ne: 'loyalty_points' }
//       })
//         .select('amount bookingType bookingId createdAt')
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(parseInt(limit));
      
//       // Calculate points earned for each payment (10% of amount)
//       const pointsHistory = payments.map(payment => ({
//         paymentId: payment._id,
//         bookingType: payment.bookingType,
//         bookingId: payment.bookingId,
//         amount: payment.amount,
//         pointsEarned: Math.floor(payment.amount * 0.1),
//         earnedAt: payment.createdAt
//       }));
      
//       // Get total count
//       const total = await Payment.countDocuments({ 
//         userId, 
//         status: 'completed',
//         paymentMethod: { $ne: 'loyalty_points' }
//       });
      
//       return res.status(200).json({
//         pointsHistory,
//         pagination: {
//           total,
//           page: parseInt(page),
//           pages: Math.ceil(total / parseInt(limit))
//         }
//       });
//     } catch (error) {
//       console.error('Get earned points history error:', error);
//       return res.status(500).json({ message: 'Server error while retrieving points history' });
//     }
//   }
// };

// module.exports = paymentController;