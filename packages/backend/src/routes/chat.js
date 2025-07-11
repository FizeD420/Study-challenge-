const express = require('express');
const { body, validationResult } = require('express-validator');
const Chat = require('../models/Chat');
const { groupMember } = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/chat/:groupId/messages
// @desc    Get chat messages for a group
// @access  Private
router.get('/:groupId/messages', groupMember, async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const chat = await Chat.findOne({ group: req.params.groupId })
      .populate('messages.sender', 'fullName profilePicture')
      .populate('participants.user', 'fullName profilePicture lastActive');

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    // Get paginated messages (reverse order for latest first)
    const messages = chat.messages
      .slice()
      .reverse()
      .slice(skip, skip + parseInt(limit))
      .reverse();

    res.json({
      success: true,
      data: {
        messages,
        participants: chat.participants,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: chat.messages.length,
          hasMore: skip + parseInt(limit) < chat.messages.length
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/chat/:groupId/read
// @desc    Mark messages as read
// @access  Private
router.put('/:groupId/read', groupMember, [
  body('messageIds').optional().isArray().withMessage('Message IDs must be an array')
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

    const { messageIds } = req.body;

    const chat = await Chat.findOne({ group: req.params.groupId });
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    if (messageIds && messageIds.length > 0) {
      // Mark specific messages as read
      for (const messageId of messageIds) {
        await chat.markMessageAsRead(messageId, req.user._id);
      }
    }

    // Update last seen
    await chat.updateLastSeen(req.user._id);

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/chat/:groupId/unread
// @desc    Get unread messages count
// @access  Private
router.get('/:groupId/unread', groupMember, async (req, res, next) => {
  try {
    const chat = await Chat.findOne({ group: req.params.groupId });
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    const unreadMessages = chat.getUnreadMessagesForUser(req.user._id);

    res.json({
      success: true,
      data: {
        unreadCount: unreadMessages.length,
        unreadMessages: unreadMessages.slice(-10) // Last 10 unread messages
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;