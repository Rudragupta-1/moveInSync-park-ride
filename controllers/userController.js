const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/user/User');

const userController = {
  // Authentication methods
  async register(req, res) {
    try {
      const { name, email, phone, password, profileImage } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const verificationToken = crypto.randomBytes(20).toString('hex');

      const newUser = new User({
        name,
        email,
        phone,
        passwordHash,
        profileImage,
        verificationToken,
        isVerified: false
      });

      await newUser.save();

      // Email sending removed
      return res.status(201).json({
        message: 'User registered successfully. Please verify your account using the provided token.',
        verificationToken  // 🔐 Send token manually if needed
      });
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({ message: 'Server error during registration' });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }

      if (!user.isVerified) {
        return res.status(401).json({ message: 'Please verify your account before logging in' });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }

      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.status(200).json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          profileImage: user.profileImage,
          loyaltyTier: user.loyaltyTier
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ message: 'Server error during login' });
    }
  },

  async verifyEmail(req, res) {
    try {
      const { token } = req.body;

      const user = await User.findOne({ verificationToken: token });
      if (!user) {
        return res.status(400).json({ message: 'Invalid verification token' });
      }

      user.isVerified = true;
      user.verificationToken = undefined;
      await user.save();

      return res.status(200).json({ message: 'Email verified successfully. You can now log in.' });
    } catch (error) {
      console.error('Email verification error:', error);
      return res.status(500).json({ message: 'Server error during email verification' });
    }
  },

  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const resetToken = crypto.randomBytes(20).toString('hex');

      user.passwordResetToken = resetToken;
      user.passwordResetExpires = Date.now() + 3600000;
      await user.save();

      // Email sending removed
      return res.status(200).json({ 
        message: 'Password reset token generated. Please use it to reset your password.',
        resetToken // ✅ You can display this token manually (for development)
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      return res.status(500).json({ message: 'Server error during password reset request' });
    }
  },

  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;

      const user = await User.findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({ message: 'Password reset token is invalid or has expired' });
      }

      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(newPassword, salt);

      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;

      await user.save();

      return res.status(200).json({ message: 'Password has been reset successfully' });
    } catch (error) {
      console.error('Reset password error:', error);
      return res.status(500).json({ message: 'Server error during password reset' });
    }
  },
  
  // User profile methods
  async getUserProfile(req, res) {
    try {
      const userId = req.user.userId;
      const user = await User.findById(userId).select('-passwordHash -verificationToken -passwordResetToken -passwordResetExpires');
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      return res.status(200).json({ user });
    } catch (error) {
      console.error('Get user profile error:', error);
      return res.status(500).json({ message: 'Server error while retrieving profile' });
    }
  },
  
  async updateUserProfile(req, res) {
    try {
      const { name, phone, metroCardId, digitalWalletId } = req.body;
      const userId = req.user.userId;
      
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { 
          name,
          phone,
          metroCardId,
          digitalWalletId,
          updatedAt: Date.now()
        },
        { new: true }
      ).select('-passwordHash -verificationToken -passwordResetToken -passwordResetExpires');
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      return res.status(200).json({ 
        message: 'Profile updated successfully',
        user: updatedUser
      });
    } catch (error) {
      console.error('Update user profile error:', error);
      return res.status(500).json({ message: 'Server error while updating profile' });
    }
  },
  
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.userId;
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Verify current password
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
      
      // Hash new password
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(newPassword, salt);
      user.updatedAt = Date.now();
      
      await user.save();
      
      return res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      return res.status(500).json({ message: 'Server error while changing password' });
    }
  },
  
  async updateProfileImage(req, res) {
    try {
      const { profileImage } = req.body;
      const userId = req.user.userId;
      
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { 
          profileImage,
          updatedAt: Date.now()
        },
        { new: true }
      ).select('-passwordHash -verificationToken -passwordResetToken -passwordResetExpires');
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      return res.status(200).json({ 
        message: 'Profile image updated successfully',
        profileImage: updatedUser.profileImage
      });
    } catch (error) {
      console.error('Update profile image error:', error);
      return res.status(500).json({ message: 'Server error while updating profile image' });
    }
  },
  
  // User preferences methods
  async getUserPreferences(req, res) {
    try {
      const userId = req.user.userId;
      
      const user = await User.findById(userId).select('preferences');
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      return res.status(200).json({ preferences: user.preferences });
    } catch (error) {
      console.error('Get user preferences error:', error);
      return res.status(500).json({ message: 'Server error while retrieving preferences' });
    }
  },
  
  async updateUserPreferences(req, res) {
    try {
      const { preferences } = req.body;
      const userId = req.user.userId;
      
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { 
          preferences,
          updatedAt: Date.now()
        },
        { new: true }
      ).select('preferences');
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      return res.status(200).json({ 
        message: 'Preferences updated successfully',
        preferences: updatedUser.preferences
      });
    } catch (error) {
      console.error('Update user preferences error:', error);
      return res.status(500).json({ message: 'Server error while updating preferences' });
    }
  },
  
  async addFavoriteStation(req, res) {
    try {
      const { stationId } = req.body;
      const userId = req.user.userId;
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Check if station is already a favorite
      if (user.preferences.favoriteStations.includes(stationId)) {
        return res.status(400).json({ message: 'Station is already in favorites' });
      }
      
      // Add to favorites
      user.preferences.favoriteStations.push(stationId);
      user.updatedAt = Date.now();
      
      await user.save();
      
      return res.status(200).json({ 
        message: 'Station added to favorites',
        favoriteStations: user.preferences.favoriteStations
      });
    } catch (error) {
      console.error('Add favorite station error:', error);
      return res.status(500).json({ message: 'Server error while adding favorite station' });
    }
  },
  
  async removeFavoriteStation(req, res) {
    try {
      const { stationId } = req.params;
      const userId = req.user.userId;
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Remove from favorites
      user.preferences.favoriteStations = user.preferences.favoriteStations.filter(
        station => station !== stationId
      );
      user.updatedAt = Date.now();
      
      await user.save();
      
      return res.status(200).json({ 
        message: 'Station removed from favorites',
        favoriteStations: user.preferences.favoriteStations
      });
    } catch (error) {
      console.error('Remove favorite station error:', error);
      return res.status(500).json({ message: 'Server error while removing favorite station' });
    }
  },
  
  async addFavoriteRoute(req, res) {
    try {
      const { from, to } = req.body;
      const userId = req.user.userId;
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Check if route already exists
      const existingRouteIndex = user.preferences.favoriteRoutes.findIndex(
        route => route.from === from && route.to === to
      );
      
      if (existingRouteIndex !== -1) {
        // Increment frequency for existing route
        user.preferences.favoriteRoutes[existingRouteIndex].frequency += 1;
      } else {
        // Add new route
        user.preferences.favoriteRoutes.push({
          from,
          to,
          frequency: 1
        });
      }
      
      user.updatedAt = Date.now();
      await user.save();
      
      return res.status(200).json({ 
        message: 'Route added to favorites',
        favoriteRoutes: user.preferences.favoriteRoutes
      });
    } catch (error) {
      console.error('Add favorite route error:', error);
      return res.status(500).json({ message: 'Server error while adding favorite route' });
    }
  },
  
  async removeFavoriteRoute(req, res) {
    try {
      const { routeId } = req.params;
      const userId = req.user.userId;
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Remove route
      user.preferences.favoriteRoutes = user.preferences.favoriteRoutes.filter(
        route => route._id.toString() !== routeId
      );
      
      user.updatedAt = Date.now();
      await user.save();
      
      return res.status(200).json({ 
        message: 'Route removed from favorites',
        favoriteRoutes: user.preferences.favoriteRoutes
      });
    } catch (error) {
      console.error('Remove favorite route error:', error);
      return res.status(500).json({ message: 'Server error while removing favorite route' });
    }
  },
  
  // Payment method methods
  async getPaymentMethods(req, res) {
    try {
      const userId = req.user.userId;
      
      const user = await User.findById(userId).select('paymentMethods');
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      return res.status(200).json({ paymentMethods: user.paymentMethods });
    } catch (error) {
      console.error('Get payment methods error:', error);
      return res.status(500).json({ message: 'Server error while retrieving payment methods' });
    }
  },
  
  async addPaymentMethod(req, res) {
    try {
      const { type, token } = req.body;
      const userId = req.user.userId;
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Check if this is the first payment method
      const isDefault = user.paymentMethods.length === 0;
      
      // Add payment method
      user.paymentMethods.push({
        type,
        token,
        isDefault,
        lastUsed: isDefault ? Date.now() : null
      });
      
      user.updatedAt = Date.now();
      await user.save();
      
      return res.status(201).json({ 
        message: 'Payment method added successfully',
        paymentMethods: user.paymentMethods
      });
    } catch (error) {
      console.error('Add payment method error:', error);
      return res.status(500).json({ message: 'Server error while adding payment method' });
    }
  },
  
  async updatePaymentMethod(req, res) {
    try {
      const { methodId } = req.params;
      const { type, token } = req.body;
      const userId = req.user.userId;
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Find and update payment method
      const paymentMethod = user.paymentMethods.id(methodId);
      if (!paymentMethod) {
        return res.status(404).json({ message: 'Payment method not found' });
      }
      
      paymentMethod.type = type || paymentMethod.type;
      paymentMethod.token = token || paymentMethod.token;
      
      user.updatedAt = Date.now();
      await user.save();
      
      return res.status(200).json({ 
        message: 'Payment method updated successfully',
        paymentMethods: user.paymentMethods
      });
    } catch (error) {
      console.error('Update payment method error:', error);
      return res.status(500).json({ message: 'Server error while updating payment method' });
    }
  },
  
  async deletePaymentMethod(req, res) {
    try {
      const { methodId } = req.params;
      const userId = req.user.userId;
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Find payment method
      const paymentMethod = user.paymentMethods.id(methodId);
      if (!paymentMethod) {
        return res.status(404).json({ message: 'Payment method not found' });
      }
      
      // Check if this is the default method
      const isDefault = paymentMethod.isDefault;
      
      // Remove payment method
      user.paymentMethods.pull(methodId);
      
      // If the deleted method was default, set a new default if available
      if (isDefault && user.paymentMethods.length > 0) {
        user.paymentMethods[0].isDefault = true;
      }
      
      user.updatedAt = Date.now();
      await user.save();
      
      return res.status(200).json({ 
        message: 'Payment method deleted successfully',
        paymentMethods: user.paymentMethods
      });
    } catch (error) {
      console.error('Delete payment method error:', error);
      return res.status(500).json({ message: 'Server error while deleting payment method' });
    }
  },
  
  async setDefaultPaymentMethod(req, res) {
    try {
      const { methodId } = req.params;
      const userId = req.user.userId;
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Find payment method
      const paymentMethod = user.paymentMethods.id(methodId);
      if (!paymentMethod) {
        return res.status(404).json({ message: 'Payment method not found' });
      }
      
      // Update default status for all payment methods
      user.paymentMethods.forEach(method => {
        method.isDefault = method._id.toString() === methodId;
      });
      
      // Update last used date for new default
      paymentMethod.lastUsed = Date.now();
      
      user.updatedAt = Date.now();
      await user.save();
      
      return res.status(200).json({ 
        message: 'Default payment method updated',
        paymentMethods: user.paymentMethods
      });
    } catch (error) {
      console.error('Set default payment method error:', error);
      return res.status(500).json({ message: 'Server error while setting default payment method' });
    }
  },
  
  // Commute history methods
  async getCommuteHistory(req, res) {
    try {
      const userId = req.user.userId;
      const { limit = 10, page = 1 } = req.query;
      
      const user = await User.findById(userId)
        .select('commuteHistory')
        .lean();
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Sort by date descending and paginate
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      
      const sortedHistory = user.commuteHistory.sort((a, b) => b.date - a.date);
      const paginatedHistory = sortedHistory.slice(startIndex, endIndex);
      
      return res.status(200).json({ 
        commuteHistory: paginatedHistory,
        pagination: {
          total: user.commuteHistory.length,
          page: parseInt(page),
          pages: Math.ceil(user.commuteHistory.length / limit)
        }
      });
    } catch (error) {
      console.error('Get commute history error:', error);
      return res.status(500).json({ message: 'Server error while retrieving commute history' });
    }
  },
  
  // Loyalty methods
  async getLoyaltyInfo(req, res) {
    try {
      const userId = req.user.userId;
      
      const user = await User.findById(userId)
        .select('loyaltyPoints loyaltyTier')
        .lean();
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Get tier benefits
      const tierBenefits = {
        bronze: {
          discountRate: 0,
          freeRides: 0,
          specialOffers: false
        },
        silver: {
          discountRate: 5,
          freeRides: 1,
          specialOffers: false
        },
        gold: {
          discountRate: 10,
          freeRides: 3,
          specialOffers: true
        },
        platinum: {
          discountRate: 15,
          freeRides: 5,
          specialOffers: true
        }
      };
      
      // Calculate points needed for next tier
      const pointsNeeded = {
        bronze: 100, // Points needed to reach silver
        silver: 300, // Points needed to reach gold
        gold: 500,   // Points needed to reach platinum
        platinum: 0  // Already at highest tier
      };
      
      return res.status(200).json({ 
        loyalty: {
          points: user.loyaltyPoints,
          tier: user.loyaltyTier,
          benefits: tierBenefits[user.loyaltyTier],
          nextTier: user.loyaltyTier !== 'platinum' ? 
            { 
              name: user.loyaltyTier === 'bronze' ? 'silver' : 
                    user.loyaltyTier === 'silver' ? 'gold' : 'platinum',
              pointsNeeded: pointsNeeded[user.loyaltyTier] - user.loyaltyPoints > 0 ? 
                pointsNeeded[user.loyaltyTier] - user.loyaltyPoints : 0
            } : null
        }
      });
    } catch (error) {
      console.error('Get loyalty info error:', error);
      return res.status(500).json({ message: 'Server error while retrieving loyalty information' });
    }
  }
};

module.exports = userController;