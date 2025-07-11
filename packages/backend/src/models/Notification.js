const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // System notifications won't have a sender
  },
  type: {
    type: String,
    required: true,
    enum: [
      'group_invite',
      'friend_request',
      'friend_request_accepted',
      'challenge_start',
      'challenge_reminder',
      'exam_time',
      'exam_reminder',
      'submission_deadline',
      'marks_published',
      'group_message',
      'system_announcement',
      'account_verification',
      'password_reset'
    ]
  },
  title: {
    type: String,
    required: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  message: {
    type: String,
    required: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  data: {
    // Additional data based on notification type
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      default: null
    },
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      default: null
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    friendRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    actionUrl: {
      type: String,
      default: null
    },
    actionType: {
      type: String,
      enum: ['accept', 'decline', 'view', 'join', 'start_exam', 'submit', 'none'],
      default: 'none'
    }
  },
  status: {
    type: String,
    enum: ['unread', 'read', 'dismissed'],
    default: 'unread'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  isPushSent: {
    type: Boolean,
    default: false
  },
  pushSentAt: {
    type: Date,
    default: null
  },
  isEmailSent: {
    type: Boolean,
    default: false
  },
  emailSentAt: {
    type: Date,
    default: null
  },
  scheduledFor: {
    type: Date,
    default: null // For scheduled notifications
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Default expiry: 30 days from creation
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
  },
  metadata: {
    // Extra metadata for analytics or debugging
    source: {
      type: String,
      default: 'system'
    },
    category: {
      type: String,
      default: 'general'
    },
    tags: [String]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
notificationSchema.index({ recipient: 1, status: 1 });
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ scheduledFor: 1 });
notificationSchema.index({ expiresAt: 1 });
notificationSchema.index({ priority: 1, createdAt: -1 });

// Virtual for whether notification is expired
notificationSchema.virtual('isExpired').get(function() {
  return this.expiresAt && new Date() > this.expiresAt;
});

// Virtual for time since creation
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
});

// Pre-save middleware to set read timestamp
notificationSchema.pre('save', function(next) {
  if (this.isModified('isRead') && this.isRead && !this.readAt) {
    this.readAt = new Date();
    this.status = 'read';
  }
  next();
});

// Static method to create notification
notificationSchema.statics.createNotification = async function(data) {
  const notification = new this(data);
  await notification.save();
  return notification;
};

// Static method to mark notifications as read
notificationSchema.statics.markAsRead = async function(recipientId, notificationIds = []) {
  const query = { recipient: recipientId };
  
  if (notificationIds.length > 0) {
    query._id = { $in: notificationIds };
  }
  
  return await this.updateMany(query, {
    isRead: true,
    readAt: new Date(),
    status: 'read'
  });
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({
    recipient: userId,
    isRead: false,
    expiresAt: { $gt: new Date() }
  });
};

// Static method to clean expired notifications
notificationSchema.statics.cleanExpiredNotifications = async function() {
  return await this.deleteMany({
    expiresAt: { $lt: new Date() }
  });
};

// Instance method to mark as read
notificationSchema.methods.markAsRead = async function() {
  this.isRead = true;
  this.readAt = new Date();
  this.status = 'read';
  await this.save();
  return this;
};

// Instance method to mark as dismissed
notificationSchema.methods.dismiss = async function() {
  this.status = 'dismissed';
  await this.save();
  return this;
};

// Instance method to get formatted notification for push
notificationSchema.methods.getPushPayload = function() {
  return {
    title: this.title,
    body: this.message,
    data: {
      notificationId: this._id.toString(),
      type: this.type,
      ...this.data
    },
    priority: this.priority === 'urgent' ? 'high' : 'normal'
  };
};

// Helper method to create specific notification types
notificationSchema.statics.createGroupInvite = async function(recipientId, senderId, groupId, groupName) {
  return await this.createNotification({
    recipient: recipientId,
    sender: senderId,
    type: 'group_invite',
    title: 'Group Invitation',
    message: `You've been invited to join "${groupName}" study group`,
    data: {
      groupId: groupId,
      actionType: 'accept'
    },
    priority: 'high'
  });
};

notificationSchema.statics.createFriendRequest = async function(recipientId, senderId, senderName) {
  return await this.createNotification({
    recipient: recipientId,
    sender: senderId,
    type: 'friend_request',
    title: 'New Friend Request',
    message: `${senderName} wants to be your friend`,
    data: {
      actionType: 'accept'
    },
    priority: 'medium'
  });
};

notificationSchema.statics.createChallengeStart = async function(recipientId, groupId, groupName) {
  return await this.createNotification({
    recipient: recipientId,
    type: 'challenge_start',
    title: 'Challenge Started!',
    message: `The study challenge for "${groupName}" has begun`,
    data: {
      groupId: groupId,
      actionType: 'view'
    },
    priority: 'high'
  });
};

notificationSchema.statics.createExamNotification = async function(recipientId, groupId, groupName, examTime) {
  return await this.createNotification({
    recipient: recipientId,
    type: 'exam_time',
    title: 'Exam Time!',
    message: `The exam for "${groupName}" is now available`,
    data: {
      groupId: groupId,
      actionType: 'start_exam'
    },
    priority: 'urgent',
    scheduledFor: examTime
  });
};

notificationSchema.statics.createMarksPublished = async function(recipientId, groupId, groupName, marks) {
  return await this.createNotification({
    recipient: recipientId,
    type: 'marks_published',
    title: 'Results Published!',
    message: `Your exam results for "${groupName}" are now available. You scored ${marks} marks!`,
    data: {
      groupId: groupId,
      actionType: 'view'
    },
    priority: 'high'
  });
};

module.exports = mongoose.model('Notification', notificationSchema);