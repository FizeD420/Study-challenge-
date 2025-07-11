const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: [100, 'Full name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  schoolOrCollege: {
    type: String,
    required: [true, 'School/College name is required'],
    trim: true,
    maxlength: [200, 'School/College name cannot exceed 200 characters']
  },
  profilePicture: {
    type: String, // URL to the image
    default: null
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    default: null,
    select: false
  },
  emailVerificationExpires: {
    type: Date,
    default: null,
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  friendRequests: {
    sent: [{
      to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      sentAt: {
        type: Date,
        default: Date.now
      }
    }],
    received: [{
      from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      receivedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  groups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  }],
  stats: {
    totalChallenges: {
      type: Number,
      default: 0
    },
    completedChallenges: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0
    },
    totalMarks: {
      type: Number,
      default: 0
    },
    totalExams: {
      type: Number,
      default: 0
    }
  },
  preferences: {
    notifications: {
      groupInvites: {
        type: Boolean,
        default: true
      },
      challengeStart: {
        type: Boolean,
        default: true
      },
      examTime: {
        type: Boolean,
        default: true
      },
      marksPublished: {
        type: Boolean,
        default: true
      },
      friendRequests: {
        type: Boolean,
        default: true
      }
    },
    privacy: {
      showEmail: {
        type: Boolean,
        default: false
      },
      showSchool: {
        type: Boolean,
        default: true
      }
    }
  },
  deviceTokens: [{
    token: String,
    platform: {
      type: String,
      enum: ['ios', 'android', 'web']
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ fullName: 'text', email: 'text' });
userSchema.index({ 'friends': 1 });
userSchema.index({ 'groups': 1 });

// Virtual for user's full profile URL
userSchema.virtual('profileUrl').get(function() {
  return this.profilePicture ? this.profilePicture : null;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const hashedPassword = await bcrypt.hash(this.password, 12);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to generate email verification token
userSchema.methods.generateEmailVerificationToken = function() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  
  this.emailVerificationToken = token;
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  return token;
};

// Instance method to add friend
userSchema.methods.addFriend = async function(friendId) {
  if (!this.friends.includes(friendId)) {
    this.friends.push(friendId);
    await this.save();
  }
};

// Instance method to remove friend
userSchema.methods.removeFriend = async function(friendId) {
  this.friends = this.friends.filter(id => !id.equals(friendId));
  await this.save();
};

// Instance method to update stats
userSchema.methods.updateStats = async function(examResult) {
  this.stats.totalExams += 1;
  this.stats.totalMarks += examResult.marks;
  this.stats.averageScore = this.stats.totalMarks / this.stats.totalExams;
  await this.save();
};

module.exports = mongoose.model('User', userSchema);