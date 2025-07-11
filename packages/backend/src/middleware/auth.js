const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'No token provided, authorization denied' 
      });
    }

    // Extract token from "Bearer TOKEN"
    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        message: 'No token provided, authorization denied' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        message: 'Token is not valid, user not found' 
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        message: 'Account has been deactivated' 
      });
    }

    // Update last active time
    user.lastActive = new Date();
    await user.save();

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Token is not valid' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token has expired' 
      });
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      message: 'Server error during authentication' 
    });
  }
};

// Middleware to check if user is admin
const adminAuth = async (req, res, next) => {
  try {
    // First run regular auth
    await auth(req, res, () => {});
    
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required' 
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Admin access required' 
      });
    }

    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(500).json({ 
      message: 'Server error during admin authentication' 
    });
  }
};

// Optional auth middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without user
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return next(); // Continue without user
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        user.lastActive = new Date();
        await user.save();
        req.user = user;
      }
    } catch (tokenError) {
      // Continue without user if token is invalid
      console.log('Optional auth token error:', tokenError.message);
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next(); // Continue even if there's an error
  }
};

// Middleware to check if user owns the resource or is admin
const ownerOrAdmin = (resourceIdParam = 'id', userIdField = 'userId') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          message: 'Authentication required' 
        });
      }

      // Admin can access everything
      if (req.user.role === 'admin') {
        return next();
      }

      const resourceId = req.params[resourceIdParam] || req.body[userIdField];
      
      // Check if user owns the resource
      if (resourceId && req.user._id.toString() === resourceId.toString()) {
        return next();
      }

      return res.status(403).json({ 
        message: 'Access denied - insufficient permissions' 
      });
    } catch (error) {
      console.error('Owner or admin middleware error:', error);
      res.status(500).json({ 
        message: 'Server error during authorization' 
      });
    }
  };
};

// Middleware to check if user is a member of a group
const groupMember = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required' 
      });
    }

    const groupId = req.params.groupId || req.body.groupId;
    
    if (!groupId) {
      return res.status(400).json({ 
        message: 'Group ID is required' 
      });
    }

    // Admin can access all groups
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user is a member of the group
    const Group = require('../models/Group');
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ 
        message: 'Group not found' 
      });
    }

    const isMember = group.members.some(member => 
      member.user.toString() === req.user._id.toString() && 
      member.status === 'active'
    );

    if (!isMember) {
      return res.status(403).json({ 
        message: 'Access denied - you are not a member of this group' 
      });
    }

    req.group = group;
    next();
  } catch (error) {
    console.error('Group member middleware error:', error);
    res.status(500).json({ 
      message: 'Server error during group authorization' 
    });
  }
};

// Rate limiting middleware for sensitive operations
const sensitiveOperation = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();
  
  return (req, res, next) => {
    const key = req.user ? req.user._id.toString() : req.ip;
    const now = Date.now();
    
    if (!attempts.has(key)) {
      attempts.set(key, []);
    }
    
    const userAttempts = attempts.get(key);
    
    // Remove old attempts outside the window
    const validAttempts = userAttempts.filter(attempt => 
      now - attempt < windowMs
    );
    
    if (validAttempts.length >= maxAttempts) {
      return res.status(429).json({
        message: 'Too many attempts. Please try again later.',
        retryAfter: Math.ceil((validAttempts[0] + windowMs - now) / 1000)
      });
    }
    
    validAttempts.push(now);
    attempts.set(key, validAttempts);
    
    next();
  };
};

module.exports = {
  auth,
  adminAuth,
  optionalAuth,
  ownerOrAdmin,
  groupMember,
  sensitiveOperation
};