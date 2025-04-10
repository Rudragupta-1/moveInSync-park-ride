const Notification = require('../models/system/Notification');
const User = require('../models/user/User');

const notificationController = {
  // Get all notifications for the user
  async getUserNotifications(req, res) {
    try {
      const userId = req.user.userId;
      const { limit = 20, page = 1 } = req.query;
      
      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      const notifications = await Notification.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
      
      const total = await Notification.countDocuments({ userId });
      
      return res.status(200).json({
        notifications,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get user notifications error:', error);
      return res.status(500).json({ message: 'Server error while retrieving notifications' });
    }
  },
  
  // Get only unread notifications
  async getUnreadNotifications(req, res) {
    try {
      const userId = req.user.userId;
      
      const notifications = await Notification.find({ 
        userId, 
        isRead: false 
      }).sort({ createdAt: -1 });
      
      const count = notifications.length;
      
      return res.status(200).json({
        notifications,
        count
      });
    } catch (error) {
      console.error('Get unread notifications error:', error);
      return res.status(500).json({ message: 'Server error while retrieving unread notifications' });
    }
  },
  
  // Mark a notification as read
  async markAsRead(req, res) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      
      const notification = await Notification.findOne({ 
        _id: id,
        userId
      });
      
      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }
      
      notification.isRead = true;
      await notification.save();
      
      return res.status(200).json({ 
        message: 'Notification marked as read',
        notification
      });
    } catch (error) {
      console.error('Mark as read error:', error);
      return res.status(500).json({ message: 'Server error while marking notification as read' });
    }
  },
  
  // Mark all notifications as read
  async markAllAsRead(req, res) {
    try {
      const userId = req.user.userId;
      
      const result = await Notification.updateMany(
        { userId, isRead: false },
        { isRead: true }
      );
      
      return res.status(200).json({ 
        message: 'All notifications marked as read',
        count: result.modifiedCount
      });
    } catch (error) {
      console.error('Mark all as read error:', error);
      return res.status(500).json({ message: 'Server error while marking all notifications as read' });
    }
  },
  
  // Update notification preferences in user profile
  async updateNotificationPreferences(req, res) {
    try {
      const userId = req.user.userId;
      const { email, sms, push } = req.body;
      
      // Validate input
      if (typeof email !== 'boolean' && email !== undefined ||
          typeof sms !== 'boolean' && sms !== undefined ||
          typeof push !== 'boolean' && push !== undefined) {
        return res.status(400).json({ message: 'Invalid notification preferences format' });
      }
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Ensure preferences object and notificationPreferences exist
      if (!user.preferences) {
        user.preferences = {};
      }
      
      if (!user.preferences.notificationPreferences) {
        user.preferences.notificationPreferences = {
          email: true,
          sms: true,
          push: true
        };
      }
      
      // Update preferences
      if (email !== undefined) {
        user.preferences.notificationPreferences.email = email;
      }
      
      if (sms !== undefined) {
        user.preferences.notificationPreferences.sms = sms;
      }
      
      if (push !== undefined) {
        user.preferences.notificationPreferences.push = push;
      }
      
      await user.save();
      
      return res.status(200).json({ 
        message: 'Notification preferences updated successfully',
        preferences: user.preferences.notificationPreferences
      });
    } catch (error) {
      console.error('Update notification preferences error:', error);
      return res.status(500).json({ message: 'Server error while updating notification preferences' });
    }
  }
};

module.exports = notificationController;