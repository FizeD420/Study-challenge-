const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Notification = require('../models/Notification');
const router = express.Router();

// @route   GET /api/friends
// @desc    Get user's friends list
// @access  Private
router.get('/', async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('friends', 'fullName email profilePicture schoolOrCollege lastActive')
      .select('friends');

    res.json({
      success: true,
      data: { friends: user.friends }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/friends/requests
// @desc    Get friend requests (sent and received)
// @access  Private
router.get('/requests', async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('friendRequests.sent.to', 'fullName profilePicture schoolOrCollege')
      .populate('friendRequests.received.from', 'fullName profilePicture schoolOrCollege')
      .select('friendRequests');

    res.json({
      success: true,
      data: {
        sent: user.friendRequests.sent,
        received: user.friendRequests.received
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/friends/request
// @desc    Send friend request
// @access  Private
router.post('/request', [
  body('userId').isMongoId().withMessage('Valid user ID is required')
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

    const { userId } = req.body;

    // Can't send request to yourself
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send friend request to yourself'
      });
    }

    // Check if target user exists
    const targetUser = await User.findById(userId);
    if (!targetUser || !targetUser.isActive) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already friends
    if (req.user.friends.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'You are already friends'
      });
    }

    // Check if request already sent
    const existingRequest = req.user.friendRequests.sent.find(
      request => request.to.toString() === userId
    );
    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'Friend request already sent'
      });
    }

    // Check if already received request from this user
    const receivedRequest = req.user.friendRequests.received.find(
      request => request.from.toString() === userId
    );
    if (receivedRequest) {
      return res.status(400).json({
        success: false,
        message: 'This user has already sent you a friend request'
      });
    }

    // Add to current user's sent requests
    req.user.friendRequests.sent.push({
      to: userId,
      sentAt: new Date()
    });
    await req.user.save();

    // Add to target user's received requests
    targetUser.friendRequests.received.push({
      from: req.user._id,
      receivedAt: new Date()
    });
    await targetUser.save();

    // Create notification
    await Notification.createFriendRequest(userId, req.user._id, req.user.fullName);

    res.json({
      success: true,
      message: 'Friend request sent successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/friends/accept
// @desc    Accept friend request
// @access  Private
router.post('/accept', [
  body('userId').isMongoId().withMessage('Valid user ID is required')
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

    const { userId } = req.body;

    // Find the received request
    const requestIndex = req.user.friendRequests.received.findIndex(
      request => request.from.toString() === userId
    );

    if (requestIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Friend request not found'
      });
    }

    // Get the other user
    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Add to friends lists
    await req.user.addFriend(userId);
    await otherUser.addFriend(req.user._id);

    // Remove from friend requests
    req.user.friendRequests.received.splice(requestIndex, 1);
    await req.user.save();

    // Remove from other user's sent requests
    const sentRequestIndex = otherUser.friendRequests.sent.findIndex(
      request => request.to.toString() === req.user._id.toString()
    );
    if (sentRequestIndex !== -1) {
      otherUser.friendRequests.sent.splice(sentRequestIndex, 1);
      await otherUser.save();
    }

    // Create notification for the requester
    await Notification.createNotification({
      recipient: userId,
      sender: req.user._id,
      type: 'friend_request_accepted',
      title: 'Friend Request Accepted',
      message: `${req.user.fullName} accepted your friend request`,
      priority: 'medium'
    });

    res.json({
      success: true,
      message: 'Friend request accepted'
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/friends/decline
// @desc    Decline friend request
// @access  Private
router.post('/decline', [
  body('userId').isMongoId().withMessage('Valid user ID is required')
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

    const { userId } = req.body;

    // Find and remove the received request
    const requestIndex = req.user.friendRequests.received.findIndex(
      request => request.from.toString() === userId
    );

    if (requestIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Friend request not found'
      });
    }

    req.user.friendRequests.received.splice(requestIndex, 1);
    await req.user.save();

    // Remove from other user's sent requests
    const otherUser = await User.findById(userId);
    if (otherUser) {
      const sentRequestIndex = otherUser.friendRequests.sent.findIndex(
        request => request.to.toString() === req.user._id.toString()
      );
      if (sentRequestIndex !== -1) {
        otherUser.friendRequests.sent.splice(sentRequestIndex, 1);
        await otherUser.save();
      }
    }

    res.json({
      success: true,
      message: 'Friend request declined'
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/friends/:id
// @desc    Remove friend
// @access  Private
router.delete('/:id', async (req, res, next) => {
  try {
    const friendId = req.params.id;

    // Check if they are friends
    if (!req.user.friends.includes(friendId)) {
      return res.status(400).json({
        success: false,
        message: 'This user is not in your friends list'
      });
    }

    // Remove from both users' friends lists
    await req.user.removeFriend(friendId);

    const friend = await User.findById(friendId);
    if (friend) {
      await friend.removeFriend(req.user._id);
    }

    res.json({
      success: true,
      message: 'Friend removed successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/friends/cancel-request
// @desc    Cancel sent friend request
// @access  Private
router.post('/cancel-request', [
  body('userId').isMongoId().withMessage('Valid user ID is required')
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

    const { userId } = req.body;

    // Find and remove the sent request
    const requestIndex = req.user.friendRequests.sent.findIndex(
      request => request.to.toString() === userId
    );

    if (requestIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Friend request not found'
      });
    }

    req.user.friendRequests.sent.splice(requestIndex, 1);
    await req.user.save();

    // Remove from other user's received requests
    const otherUser = await User.findById(userId);
    if (otherUser) {
      const receivedRequestIndex = otherUser.friendRequests.received.findIndex(
        request => request.from.toString() === req.user._id.toString()
      );
      if (receivedRequestIndex !== -1) {
        otherUser.friendRequests.received.splice(receivedRequestIndex, 1);
        await otherUser.save();
      }
    }

    res.json({
      success: true,
      message: 'Friend request cancelled'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;