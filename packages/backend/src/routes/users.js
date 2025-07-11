const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const router = express.Router();

// @route   GET /api/users/search
// @desc    Search users by name or email
// @access  Private
router.get('/search', async (req, res, next) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const users = await User.find({
      $and: [
        { _id: { $ne: req.user._id } }, // Exclude current user
        { isActive: true },
        {
          $or: [
            { fullName: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } }
          ]
        }
      ]
    })
    .select('fullName email profilePicture schoolOrCollege')
    .limit(parseInt(limit));

    res.json({
      success: true,
      data: { users }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/users/profile/:id
// @desc    Get user profile
// @access  Private
router.get('/profile/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('fullName email profilePicture schoolOrCollege stats preferences.privacy lastActive');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Filter based on privacy settings
    const profile = {
      _id: user._id,
      fullName: user.fullName,
      profilePicture: user.profilePicture,
      lastActive: user.lastActive,
      stats: user.stats
    };

    // Only show email if privacy allows or if it's the user themselves
    if (user.preferences.privacy.showEmail || req.user._id.toString() === user._id.toString()) {
      profile.email = user.email;
    }

    // Only show school if privacy allows
    if (user.preferences.privacy.showSchool) {
      profile.schoolOrCollege = user.schoolOrCollege;
    }

    res.json({
      success: true,
      data: { user: profile }
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  body('fullName').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Full name must be between 2-100 characters'),
  body('schoolOrCollege').optional().trim().isLength({ min: 2, max: 200 }).withMessage('School/College must be between 2-200 characters'),
  body('profilePicture').optional().isURL().withMessage('Profile picture must be a valid URL')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { fullName, schoolOrCollege, profilePicture } = req.body;
    
    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (schoolOrCollege) updateData.schoolOrCollege = schoolOrCollege;
    if (profilePicture) updateData.profilePicture = profilePicture;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/users/preferences
// @desc    Update user preferences
// @access  Private
router.put('/preferences', [
  body('notifications').optional().isObject().withMessage('Notifications must be an object'),
  body('privacy').optional().isObject().withMessage('Privacy must be an object')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { notifications, privacy } = req.body;
    
    const updateData = {};
    if (notifications) updateData['preferences.notifications'] = { ...req.user.preferences.notifications, ...notifications };
    if (privacy) updateData['preferences.privacy'] = { ...req.user.preferences.privacy, ...privacy };

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: { preferences: user.preferences }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/users/device-token
// @desc    Add/update device token for push notifications
// @access  Private
router.post('/device-token', [
  body('token').notEmpty().withMessage('Device token is required'),
  body('platform').isIn(['ios', 'android', 'web']).withMessage('Platform must be ios, android, or web')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { token, platform } = req.body;
    
    // Remove existing token if it exists
    req.user.deviceTokens = req.user.deviceTokens.filter(dt => dt.token !== token);
    
    // Add new token
    req.user.deviceTokens.push({
      token,
      platform,
      addedAt: new Date()
    });

    // Keep only the 5 most recent tokens per user
    if (req.user.deviceTokens.length > 5) {
      req.user.deviceTokens = req.user.deviceTokens.slice(-5);
    }

    await req.user.save();

    res.json({
      success: true,
      message: 'Device token updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/users/device-token
// @desc    Remove device token
// @access  Private
router.delete('/device-token', [
  body('token').notEmpty().withMessage('Device token is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { token } = req.body;
    
    req.user.deviceTokens = req.user.deviceTokens.filter(dt => dt.token !== token);
    await req.user.save();

    res.json({
      success: true,
      message: 'Device token removed successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select('stats')
      .populate('groups', 'name subject challenge.status');

    res.json({
      success: true,
      data: { 
        stats: user.stats,
        groups: user.groups
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;