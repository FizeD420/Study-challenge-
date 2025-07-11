const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const Group = require('../models/Group');
const { groupMember } = require('../middleware/auth');
const router = express.Router();

// Configure multer for image uploads
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// @route   GET /api/exams/:groupId
// @desc    Get exam details for group
// @access  Private
router.get('/:groupId', groupMember, async (req, res, next) => {
  try {
    const group = req.group;
    
    res.json({
      success: true,
      data: {
        exam: group.exam,
        challenge: group.challenge,
        userSubmission: group.submissions.find(s => 
          s.user.toString() === req.user._id.toString()
        )
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/exams/:groupId/submit
// @desc    Submit exam answers (photo upload)
// @access  Private
router.post('/:groupId/submit', groupMember, upload.array('answerSheets', 10), async (req, res, next) => {
  try {
    const group = req.group;
    
    if (!group.challenge.examStarted) {
      return res.status(400).json({
        success: false,
        message: 'Exam has not started yet'
      });
    }

    // Check if already submitted
    const existingSubmission = group.submissions.find(s => 
      s.user.toString() === req.user._id.toString()
    );
    
    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted this exam'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one answer sheet image is required'
      });
    }

    // TODO: Upload images to Cloudinary
    const imageUrls = req.files.map(file => `/uploads/${file.filename}`);

    // Submit exam
    await group.submitExam(req.user._id, imageUrls);

    res.json({
      success: true,
      message: 'Exam submitted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/exams/:groupId/results
// @desc    Get exam results
// @access  Private
router.get('/:groupId/results', groupMember, async (req, res, next) => {
  try {
    const group = req.group;
    
    const userSubmission = group.submissions.find(s => 
      s.user.toString() === req.user._id.toString()
    );

    if (!userSubmission) {
      return res.status(404).json({
        success: false,
        message: 'No submission found'
      });
    }

    // Only return results if graded
    if (userSubmission.marks === null) {
      return res.status(400).json({
        success: false,
        message: 'Results not available yet'
      });
    }

    res.json({
      success: true,
      data: {
        marks: userSubmission.marks,
        maxMarks: group.exam.maxMarks,
        feedback: userSubmission.feedback,
        gradedAt: userSubmission.gradedAt,
        groupStats: group.stats
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;