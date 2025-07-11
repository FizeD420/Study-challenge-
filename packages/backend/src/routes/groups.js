const express = require('express');
const { body, validationResult } = require('express-validator');
const Group = require('../models/Group');
const Chat = require('../models/Chat');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { groupMember } = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/groups
// @desc    Get user's groups
// @access  Private
router.get('/', async (req, res, next) => {
  try {
    const groups = await Group.find({
      'members.user': req.user._id,
      'members.status': 'active',
      isActive: true
    })
    .populate('creator', 'fullName profilePicture')
    .populate('members.user', 'fullName profilePicture schoolOrCollege')
    .sort({ updatedAt: -1 });

    res.json({
      success: true,
      data: { groups }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/groups
// @desc    Create new group
// @access  Private
router.post('/', [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Group name must be between 2-100 characters'),
  body('subject').isIn(['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'English', 'History', 'Geography', 'Economics', 'Business Studies', 'Accounting', 'Other']).withMessage('Invalid subject'),
  body('chapter').trim().isLength({ min: 2, max: 200 }).withMessage('Chapter must be between 2-200 characters'),
  body('duration').isInt({ min: 2, max: 6 }).withMessage('Duration must be between 2-6 days')
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

    const { name, description, subject, chapter, duration } = req.body;

    const group = new Group({
      name,
      description,
      subject,
      chapter,
      creator: req.user._id,
      challenge: { duration },
      members: [{
        user: req.user._id,
        role: 'creator',
        status: 'active'
      }]
    });

    await group.save();

    // Create chat for the group
    const chat = new Chat({
      group: group._id,
      participants: [{
        user: req.user._id,
        role: 'admin'
      }]
    });
    await chat.save();

    group.chat = chat._id;
    await group.save();

    // Add group to user's groups
    req.user.groups.push(group._id);
    await req.user.save();

    // Populate and return
    await group.populate('creator', 'fullName profilePicture');
    await group.populate('members.user', 'fullName profilePicture');

    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      data: { group }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/groups/:id
// @desc    Get group details
// @access  Private
router.get('/:id', groupMember, async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('creator', 'fullName profilePicture schoolOrCollege')
      .populate('members.user', 'fullName profilePicture schoolOrCollege lastActive')
      .populate('chat');

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    res.json({
      success: true,
      data: { group }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/groups/:id/invite
// @desc    Invite users to group
// @access  Private
router.post('/:id/invite', groupMember, [
  body('userIds').isArray({ min: 1 }).withMessage('At least one user ID is required'),
  body('userIds.*').isMongoId().withMessage('Invalid user ID format')
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

    const { userIds } = req.body;
    const group = req.group;

    // Check if user is creator or admin
    const userMember = group.members.find(m => m.user.toString() === req.user._id.toString());
    if (userMember.role !== 'creator') {
      return res.status(403).json({
        success: false,
        message: 'Only group creator can invite members'
      });
    }

    const invitedUsers = [];
    const failedInvites = [];

    for (const userId of userIds) {
      try {
        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
          failedInvites.push({ userId, reason: 'User not found' });
          continue;
        }

        // Check if user is already a member
        const existingMember = group.members.find(m => m.user.toString() === userId);
        if (existingMember) {
          failedInvites.push({ userId, reason: 'Already a member' });
          continue;
        }

        // Check if invitation already exists
        const existingInvite = group.invitations.find(inv => 
          inv.user.toString() === userId && inv.status === 'pending'
        );
        if (existingInvite) {
          failedInvites.push({ userId, reason: 'Invitation already sent' });
          continue;
        }

        // Add invitation
        group.invitations.push({
          user: userId,
          invitedBy: req.user._id,
          status: 'pending'
        });

        // Create notification
        await Notification.createGroupInvite(userId, req.user._id, group._id, group.name);

        invitedUsers.push(userId);
      } catch (error) {
        failedInvites.push({ userId, reason: error.message });
      }
    }

    await group.save();

    res.json({
      success: true,
      message: `Invited ${invitedUsers.length} users successfully`,
      data: {
        invitedUsers,
        failedInvites
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/groups/:id/join
// @desc    Join group (accept invitation)
// @access  Private
router.post('/:id/join', async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Find invitation
    const invitation = group.invitations.find(inv => 
      inv.user.toString() === req.user._id.toString() && inv.status === 'pending'
    );

    if (!invitation) {
      return res.status(400).json({
        success: false,
        message: 'No pending invitation found'
      });
    }

    // Check if invitation is expired
    if (invitation.expiresAt < new Date()) {
      invitation.status = 'expired';
      await group.save();
      return res.status(400).json({
        success: false,
        message: 'Invitation has expired'
      });
    }

    // Add user to group
    await group.addMember(req.user._id);
    
    // Update invitation status
    invitation.status = 'accepted';

    // Add to user's groups
    if (!req.user.groups.includes(group._id)) {
      req.user.groups.push(group._id);
      await req.user.save();
    }

    // Add to chat
    if (group.chat) {
      const chat = await Chat.findById(group.chat);
      if (chat) {
        await chat.addParticipant(req.user._id);
      }
    }

    await group.save();

    res.json({
      success: true,
      message: 'Successfully joined the group'
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/groups/:id/start
// @desc    Start challenge
// @access  Private
router.post('/:id/start', groupMember, async (req, res, next) => {
  try {
    const group = req.group;

    // Check if user is creator
    const userMember = group.members.find(m => m.user.toString() === req.user._id.toString());
    if (userMember.role !== 'creator') {
      return res.status(403).json({
        success: false,
        message: 'Only group creator can start challenges'
      });
    }

    if (group.challenge.isStarted) {
      return res.status(400).json({
        success: false,
        message: 'Challenge has already started'
      });
    }

    // Start challenge
    await group.startChallenge();

    // Send notifications to all members
    for (const member of group.members) {
      if (member.status === 'active' && member.user.toString() !== req.user._id.toString()) {
        await Notification.createChallengeStart(member.user, group._id, group.name);
      }
    }

    res.json({
      success: true,
      message: 'Challenge started successfully',
      data: { 
        group: {
          _id: group._id,
          challenge: group.challenge,
          timeRemaining: group.timeRemaining
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/groups/:id/leave
// @desc    Leave group
// @access  Private
router.post('/:id/leave', groupMember, async (req, res, next) => {
  try {
    const group = req.group;

    // Check if user is creator
    const userMember = group.members.find(m => m.user.toString() === req.user._id.toString());
    if (userMember.role === 'creator') {
      return res.status(400).json({
        success: false,
        message: 'Group creator cannot leave the group. Transfer ownership or delete the group.'
      });
    }

    // Remove from group
    userMember.status = 'left';

    // Remove from user's groups
    req.user.groups = req.user.groups.filter(gId => !gId.equals(group._id));
    await req.user.save();

    // Remove from chat
    if (group.chat) {
      const chat = await Chat.findById(group.chat);
      if (chat) {
        await chat.removeParticipant(req.user._id);
      }
    }

    await group.save();

    res.json({
      success: true,
      message: 'Successfully left the group'
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/groups/:id
// @desc    Delete group
// @access  Private
router.delete('/:id', groupMember, async (req, res, next) => {
  try {
    const group = req.group;

    // Check if user is creator
    const userMember = group.members.find(m => m.user.toString() === req.user._id.toString());
    if (userMember.role !== 'creator') {
      return res.status(403).json({
        success: false,
        message: 'Only group creator can delete the group'
      });
    }

    // Soft delete
    group.isActive = false;
    await group.save();

    // Remove from all members' groups
    const memberIds = group.members.map(m => m.user);
    await User.updateMany(
      { _id: { $in: memberIds } },
      { $pull: { groups: group._id } }
    );

    res.json({
      success: true,
      message: 'Group deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;