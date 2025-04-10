const Subscription = require('../models/payment/Subscription');
const User = require('../models/user/User');

const subscriptionController = {
  // Get all active subscription plans
  async getAllPlans(req, res) {
    try {
      const plans = await Subscription.find({ isActive: true });
      return res.status(200).json({ plans });
    } catch (error) {
      console.error('Get all plans error:', error);
      return res.status(500).json({ message: 'Server error while retrieving subscription plans' });
    }
  },

  // Get a specific plan by ID
  async getPlanById(req, res) {
    try {
      const { id } = req.params;
      const plan = await Subscription.findById(id);
      
      if (!plan) {
        return res.status(404).json({ message: 'Subscription plan not found' });
      }
      
      return res.status(200).json({ plan });
    } catch (error) {
      console.error('Get plan by ID error:', error);
      return res.status(500).json({ message: 'Server error while retrieving subscription plan' });
    }
  },

  // Get plans by type (parking, ride, combo)
  async getPlansByType(req, res) {
    try {
      const { type } = req.params;
      
      // Validate type
      if (!['parking', 'ride', 'combo'].includes(type)) {
        return res.status(400).json({ message: 'Invalid subscription type' });
      }
      
      const plans = await Subscription.find({ type, isActive: true });
      return res.status(200).json({ plans });
    } catch (error) {
      console.error('Get plans by type error:', error);
      return res.status(500).json({ message: 'Server error while retrieving subscription plans' });
    }
  },

  // Create a new subscription for a user
  async createSubscription(req, res) {
    try {
      const { planId } = req.body;
      const userId = req.user.userId;
      
      // Find the subscription plan
      const plan = await Subscription.findById(planId);
      if (!plan || !plan.isActive) {
        return res.status(404).json({ message: 'Subscription plan not found or inactive' });
      }
      
      // Find the user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Check if user already has an active subscription
      if (user.subscription && 
          user.subscription.plan && 
          user.subscription.status === 'active' &&
          user.subscription.endDate > Date.now()) {
        return res.status(400).json({ message: 'User already has an active subscription' });
      }
      
      // Calculate subscription dates
      const startDate = Date.now();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + plan.duration);
      
      // Update user subscription
      user.subscription = {
        plan: plan._id,
        startDate,
        endDate,
        autoRenew: false,
        status: 'active'
      };
      
      await user.save();
      
      // Return the subscription details
      return res.status(201).json({
        message: 'Subscription created successfully',
        subscription: {
          plan: {
            id: plan._id,
            name: plan.name,
            type: plan.type,
            benefits: plan.benefits
          },
          startDate,
          endDate,
          autoRenew: false,
          status: 'active'
        }
      });
    } catch (error) {
      console.error('Create subscription error:', error);
      return res.status(500).json({ message: 'Server error while creating subscription' });
    }
  },

  // Get the current user's subscription
  async getUserSubscription(req, res) {
    try {
      const userId = req.user.userId;
      
      const user = await User.findById(userId)
        .select('subscription')
        .populate('subscription.plan');
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      if (!user.subscription || !user.subscription.plan) {
        return res.status(404).json({ message: 'User has no active subscription' });
      }
      
      // Check if subscription has expired but status not updated
      if (user.subscription.endDate < Date.now() && user.subscription.status === 'active') {
        user.subscription.status = 'expired';
        await user.save();
      }
      
      return res.status(200).json({ subscription: user.subscription });
    } catch (error) {
      console.error('Get user subscription error:', error);
      return res.status(500).json({ message: 'Server error while retrieving user subscription' });
    }
  },

  // Cancel subscription
  async cancelSubscription(req, res) {
    try {
      const userId = req.user.userId;
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      if (!user.subscription || !user.subscription.plan) {
        return res.status(404).json({ message: 'User has no active subscription' });
      }
      
      // Update subscription status
      user.subscription.status = 'cancelled';
      user.subscription.autoRenew = false;
      
      await user.save();
      
      return res.status(200).json({ 
        message: 'Subscription cancelled successfully',
        subscription: user.subscription
      });
    } catch (error) {
      console.error('Cancel subscription error:', error);
      return res.status(500).json({ message: 'Server error while cancelling subscription' });
    }
  },

  // Renew subscription
  async renewSubscription(req, res) {
    try {
      const userId = req.user.userId;
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      if (!user.subscription || !user.subscription.plan) {
        return res.status(404).json({ message: 'No subscription to renew' });
      }
      
      // Get the subscription plan
      const plan = await Subscription.findById(user.subscription.plan);
      if (!plan || !plan.isActive) {
        return res.status(404).json({ 
          message: 'Subscription plan no longer available. Please choose a new plan.' 
        });
      }
      
      // Calculate new subscription dates
      const startDate = Date.now();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + plan.duration);
      
      // Update subscription
      user.subscription.startDate = startDate;
      user.subscription.endDate = endDate;
      user.subscription.status = 'active';
      
      await user.save();
      
      return res.status(200).json({ 
        message: 'Subscription renewed successfully',
        subscription: user.subscription
      });
    } catch (error) {
      console.error('Renew subscription error:', error);
      return res.status(500).json({ message: 'Server error while renewing subscription' });
    }
  },

  // Toggle auto-renew setting
  async toggleAutoRenew(req, res) {
    try {
      const userId = req.user.userId;
      const { autoRenew } = req.body;
      
      if (typeof autoRenew !== 'boolean') {
        return res.status(400).json({ message: 'autoRenew must be a boolean value' });
      }
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      if (!user.subscription || !user.subscription.plan) {
        return res.status(404).json({ message: 'User has no active subscription' });
      }
      
      // Update auto-renew setting
      user.subscription.autoRenew = autoRenew;
      
      await user.save();
      
      return res.status(200).json({ 
        message: `Auto-renew ${autoRenew ? 'enabled' : 'disabled'} successfully`,
        autoRenew: user.subscription.autoRenew
      });
    } catch (error) {
      console.error('Toggle auto-renew error:', error);
      return res.status(500).json({ message: 'Server error while updating auto-renew setting' });
    }
  }
};

module.exports = subscriptionController;