const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Group name is required'],
    trim: true,
    maxlength: [100, 'Group name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    enum: [
      'Mathematics',
      'Physics',
      'Chemistry',
      'Biology',
      'Computer Science',
      'English',
      'History',
      'Geography',
      'Economics',
      'Business Studies',
      'Accounting',
      'Other'
    ]
  },
  chapter: {
    type: String,
    required: [true, 'Chapter/Topic is required'],
    trim: true,
    maxlength: [200, 'Chapter name cannot exceed 200 characters']
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    role: {
      type: String,
      enum: ['creator', 'member'],
      default: 'member'
    },
    status: {
      type: String,
      enum: ['active', 'left', 'removed'],
      default: 'active'
    }
  }],
  invitations: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    invitedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'expired'],
      default: 'pending'
    },
    expiresAt: {
      type: Date,
      default: function() {
        return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      }
    }
  }],
  challenge: {
    duration: {
      type: Number,
      required: [true, 'Challenge duration is required'],
      min: [2, 'Minimum challenge duration is 2 days'],
      max: [6, 'Maximum challenge duration is 6 days']
    },
    startTime: {
      type: Date,
      default: null
    },
    endTime: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'completed', 'cancelled'],
      default: 'pending'
    },
    isStarted: {
      type: Boolean,
      default: false
    },
    examStarted: {
      type: Boolean,
      default: false
    },
    examEndTime: {
      type: Date,
      default: null
    }
  },
  exam: {
    paperUrl: {
      type: String,
      default: null
    },
    paperUploadedAt: {
      type: Date,
      default: null
    },
    maxMarks: {
      type: Number,
      default: 100
    },
    duration: {
      type: Number, // in minutes
      default: 180 // 3 hours
    },
    instructions: {
      type: String,
      default: ''
    }
  },
  submissions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    answerSheets: [{
      imageUrl: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],
    submittedAt: {
      type: Date,
      default: Date.now
    },
    marks: {
      type: Number,
      default: null
    },
    feedback: {
      type: String,
      default: ''
    },
    gradedAt: {
      type: Date,
      default: null
    },
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  }],
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat'
  },
  settings: {
    isPrivate: {
      type: Boolean,
      default: true
    },
    allowLateSubmissions: {
      type: Boolean,
      default: false
    },
    showLeaderboard: {
      type: Boolean,
      default: true
    },
    maxMembers: {
      type: Number,
      default: 10,
      min: 2,
      max: 20
    }
  },
  stats: {
    totalSubmissions: {
      type: Number,
      default: 0
    },
    averageMarks: {
      type: Number,
      default: 0
    },
    highestMarks: {
      type: Number,
      default: 0
    },
    completionRate: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
groupSchema.index({ creator: 1 });
groupSchema.index({ 'members.user': 1 });
groupSchema.index({ subject: 1 });
groupSchema.index({ 'challenge.status': 1 });
groupSchema.index({ createdAt: -1 });

// Virtual for active members count
groupSchema.virtual('activeMembersCount').get(function() {
  return this.members.filter(member => member.status === 'active').length;
});

// Virtual for pending invitations count
groupSchema.virtual('pendingInvitationsCount').get(function() {
  return this.invitations.filter(inv => inv.status === 'pending').length;
});

// Virtual for time remaining in challenge
groupSchema.virtual('timeRemaining').get(function() {
  if (!this.challenge.isStarted || this.challenge.status === 'completed') {
    return 0;
  }
  
  const now = new Date();
  const endTime = this.challenge.endTime;
  
  if (now >= endTime) {
    return 0;
  }
  
  return Math.max(0, endTime.getTime() - now.getTime());
});

// Virtual for challenge progress percentage
groupSchema.virtual('challengeProgress').get(function() {
  if (!this.challenge.isStarted) return 0;
  
  const total = this.challenge.endTime.getTime() - this.challenge.startTime.getTime();
  const elapsed = Date.now() - this.challenge.startTime.getTime();
  
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
});

// Pre-save middleware to calculate end time
groupSchema.pre('save', function(next) {
  if (this.challenge.startTime && !this.challenge.endTime) {
    const durationInMs = this.challenge.duration * 24 * 60 * 60 * 1000; // Convert days to milliseconds
    this.challenge.endTime = new Date(this.challenge.startTime.getTime() + durationInMs);
  }
  next();
});

// Instance method to start challenge
groupSchema.methods.startChallenge = async function() {
  if (this.challenge.isStarted) {
    throw new Error('Challenge has already started');
  }
  
  this.challenge.isStarted = true;
  this.challenge.status = 'active';
  this.challenge.startTime = new Date();
  
  // Calculate end time
  const durationInMs = this.challenge.duration * 24 * 60 * 60 * 1000;
  this.challenge.endTime = new Date(this.challenge.startTime.getTime() + durationInMs);
  
  await this.save();
  return this;
};

// Instance method to add member
groupSchema.methods.addMember = async function(userId, role = 'member') {
  const existingMember = this.members.find(m => m.user.toString() === userId.toString());
  
  if (existingMember) {
    if (existingMember.status === 'left' || existingMember.status === 'removed') {
      existingMember.status = 'active';
      existingMember.joinedAt = new Date();
    }
    return this;
  }
  
  if (this.activeMembersCount >= this.settings.maxMembers) {
    throw new Error('Group has reached maximum member limit');
  }
  
  this.members.push({
    user: userId,
    role: role,
    status: 'active'
  });
  
  await this.save();
  return this;
};

// Instance method to remove member
groupSchema.methods.removeMember = async function(userId) {
  const memberIndex = this.members.findIndex(m => 
    m.user.toString() === userId.toString() && m.status === 'active'
  );
  
  if (memberIndex === -1) {
    throw new Error('Member not found in group');
  }
  
  if (this.members[memberIndex].role === 'creator') {
    throw new Error('Cannot remove group creator');
  }
  
  this.members[memberIndex].status = 'removed';
  await this.save();
  return this;
};

// Instance method to submit exam
groupSchema.methods.submitExam = async function(userId, answerSheets) {
  const existingSubmission = this.submissions.find(s => 
    s.user.toString() === userId.toString()
  );
  
  if (existingSubmission) {
    throw new Error('User has already submitted the exam');
  }
  
  this.submissions.push({
    user: userId,
    answerSheets: answerSheets.map(url => ({ imageUrl: url }))
  });
  
  this.stats.totalSubmissions += 1;
  await this.save();
  return this;
};

// Instance method to grade submission
groupSchema.methods.gradeSubmission = async function(userId, marks, feedback = '', gradedBy) {
  const submission = this.submissions.find(s => 
    s.user.toString() === userId.toString()
  );
  
  if (!submission) {
    throw new Error('Submission not found');
  }
  
  submission.marks = marks;
  submission.feedback = feedback;
  submission.gradedAt = new Date();
  submission.gradedBy = gradedBy;
  
  // Update group stats
  this.updateStats();
  await this.save();
  return this;
};

// Instance method to update stats
groupSchema.methods.updateStats = function() {
  const gradedSubmissions = this.submissions.filter(s => s.marks !== null);
  
  if (gradedSubmissions.length > 0) {
    const totalMarks = gradedSubmissions.reduce((sum, s) => sum + s.marks, 0);
    this.stats.averageMarks = totalMarks / gradedSubmissions.length;
    this.stats.highestMarks = Math.max(...gradedSubmissions.map(s => s.marks));
  }
  
  this.stats.completionRate = (this.stats.totalSubmissions / this.activeMembersCount) * 100;
};

module.exports = mongoose.model('Group', groupSchema);