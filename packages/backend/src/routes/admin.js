const express = require('express');
const { body, validationResult } = require('express-validator');
const { adminAuth } = require('../middleware/auth');
const Group = require('../models/Group');
const User = require('../models/User');
const Notification = require('../models/Notification');
const router = express.Router();

// All admin routes require admin authentication
router.use(adminAuth);

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard stats
// @access  Admin
router.get('/dashboard', async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments({ isActive: true });
    const totalGroups = await Group.countDocuments({ isActive: true });
    const activeGroups = await Group.countDocuments({ 
      'challenge.status': 'active',
      isActive: true 
    });
    const pendingSubmissions = await Group.aggregate([
      { $match: { isActive: true } },
      { $unwind: '$submissions' },
      { $match: { 'submissions.marks': null } },
      { $count: 'pendingSubmissions' }
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalGroups,
          activeGroups,
          pendingSubmissions: pendingSubmissions[0]?.pendingSubmissions || 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/admin/users
// @desc    Get all users (with pagination)
// @access  Admin
router.get('/users', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query = {
        $or: [
          { fullName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const users = await User.find(query)
      .select('fullName email schoolOrCollege isActive role stats createdAt lastActive')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/admin/users/:id/status
// @desc    Update user status (activate/deactivate)
// @access  Admin
router.put('/users/:id/status', [
  body('isActive').isBoolean().withMessage('isActive must be a boolean')
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

    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('fullName email isActive');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/admin/groups
// @desc    Get all groups (with pagination)
// @access  Admin
router.get('/groups', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, subject } = req.query;
    const skip = (page - 1) * limit;

    let query = { isActive: true };
    if (status) query['challenge.status'] = status;
    if (subject) query.subject = subject;

    const groups = await Group.find(query)
      .populate('creator', 'fullName email')
      .populate('members.user', 'fullName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Group.countDocuments(query);

    res.json({
      success: true,
      data: {
        groups,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/admin/submissions
// @desc    Get pending submissions for grading
// @access  Admin
router.get('/submissions', async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const groups = await Group.find({
      'submissions.marks': null,
      isActive: true
    })
    .populate('creator', 'fullName')
    .populate('submissions.user', 'fullName email profilePicture')
    .sort({ 'submissions.submittedAt': -1 })
    .skip(skip)
    .limit(parseInt(limit));

    // Extract pending submissions
    const pendingSubmissions = [];
    groups.forEach(group => {
      group.submissions.forEach(submission => {
        if (submission.marks === null) {
          pendingSubmissions.push({
            ...submission.toObject(),
            group: {
              _id: group._id,
              name: group.name,
              subject: group.subject,
              chapter: group.chapter,
              exam: group.exam
            }
          });
        }
      });
    });

    res.json({
      success: true,
      data: { submissions: pendingSubmissions }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/admin/submissions/:groupId/:userId/grade
// @desc    Grade a submission
// @access  Admin
router.post('/submissions/:groupId/:userId/grade', [
  body('marks').isNumeric().withMessage('Marks must be a number'),
  body('feedback').optional().isString().withMessage('Feedback must be a string')
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

    const { groupId, userId } = req.params;
    const { marks, feedback = '' } = req.body;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Grade the submission
    await group.gradeSubmission(userId, marks, feedback, req.user._id);

    // Send notification to user
    const user = await User.findById(userId);
    if (user) {
      await Notification.createMarksPublished(userId, groupId, group.name, marks);
      // Update user stats
      await user.updateStats({ marks });
    }

    res.json({
      success: true,
      message: 'Submission graded successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/admin/upload-exam
// @desc    Upload exam paper for a group
// @access  Admin
router.post('/upload-exam', [
  body('groupId').isMongoId().withMessage('Valid group ID is required'),
  body('paperUrl').isURL().withMessage('Valid paper URL is required'),
  body('maxMarks').optional().isNumeric().withMessage('Max marks must be a number'),
  body('duration').optional().isNumeric().withMessage('Duration must be a number'),
  body('instructions').optional().isString().withMessage('Instructions must be a string')
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

    const { groupId, paperUrl, maxMarks, duration, instructions } = req.body;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Update exam details
    group.exam.paperUrl = paperUrl;
    group.exam.paperUploadedAt = new Date();
    if (maxMarks) group.exam.maxMarks = maxMarks;
    if (duration) group.exam.duration = duration;
    if (instructions) group.exam.instructions = instructions;

    await group.save();

    res.json({
      success: true,
      message: 'Exam paper uploaded successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;