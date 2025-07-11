const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'system'],
    default: 'text'
  },
  fileUrl: {
    type: String,
    default: null
  },
  fileName: {
    type: String,
    default: null
  },
  fileSize: {
    type: Number,
    default: null
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date,
    default: null
  },
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: {
      type: String,
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat.messages',
    default: null
  }
}, {
  timestamps: true
});

const chatSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
    unique: true
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    lastSeen: {
      type: Date,
      default: Date.now
    },
    role: {
      type: String,
      enum: ['member', 'admin'],
      default: 'member'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  messages: [messageSchema],
  settings: {
    allowFileSharing: {
      type: Boolean,
      default: true
    },
    allowImageSharing: {
      type: Boolean,
      default: true
    },
    maxFileSize: {
      type: Number,
      default: 10485760 // 10MB
    },
    mutedUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  stats: {
    totalMessages: {
      type: Number,
      default: 0
    },
    totalParticipants: {
      type: Number,
      default: 0
    },
    lastActivity: {
      type: Date,
      default: Date.now
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
chatSchema.index({ group: 1 });
chatSchema.index({ 'participants.user': 1 });
chatSchema.index({ 'messages.sender': 1 });
chatSchema.index({ 'messages.createdAt': -1 });
chatSchema.index({ 'stats.lastActivity': -1 });

// Virtual for unread messages count per user
chatSchema.virtual('unreadCount').get(function() {
  // This would be calculated based on user's last seen time
  return 0; // Placeholder
});

// Virtual for latest message
chatSchema.virtual('latestMessage').get(function() {
  if (this.messages.length > 0) {
    return this.messages[this.messages.length - 1];
  }
  return null;
});

// Pre-save middleware to update stats
chatSchema.pre('save', function(next) {
  this.stats.totalMessages = this.messages.length;
  this.stats.totalParticipants = this.participants.filter(p => p.isActive).length;
  
  if (this.messages.length > 0) {
    this.stats.lastActivity = this.messages[this.messages.length - 1].createdAt;
  }
  
  next();
});

// Instance method to add participant
chatSchema.methods.addParticipant = async function(userId, role = 'member') {
  const existingParticipant = this.participants.find(p => 
    p.user.toString() === userId.toString()
  );
  
  if (existingParticipant) {
    if (!existingParticipant.isActive) {
      existingParticipant.isActive = true;
      existingParticipant.joinedAt = new Date();
    }
    return this;
  }
  
  this.participants.push({
    user: userId,
    role: role,
    isActive: true
  });
  
  await this.save();
  return this;
};

// Instance method to remove participant
chatSchema.methods.removeParticipant = async function(userId) {
  const participant = this.participants.find(p => 
    p.user.toString() === userId.toString()
  );
  
  if (participant) {
    participant.isActive = false;
    await this.save();
  }
  
  return this;
};

// Instance method to add message
chatSchema.methods.addMessage = async function(senderId, content, messageType = 'text', fileData = {}) {
  const message = {
    sender: senderId,
    content: content,
    messageType: messageType,
    fileUrl: fileData.url || null,
    fileName: fileData.name || null,
    fileSize: fileData.size || null
  };
  
  this.messages.push(message);
  
  // Update last seen for sender
  const senderParticipant = this.participants.find(p => 
    p.user.toString() === senderId.toString()
  );
  if (senderParticipant) {
    senderParticipant.lastSeen = new Date();
  }
  
  await this.save();
  return this.messages[this.messages.length - 1];
};

// Instance method to mark message as read
chatSchema.methods.markMessageAsRead = async function(messageId, userId) {
  const message = this.messages.id(messageId);
  
  if (message) {
    const existingRead = message.readBy.find(r => 
      r.user.toString() === userId.toString()
    );
    
    if (!existingRead) {
      message.readBy.push({
        user: userId,
        readAt: new Date()
      });
      
      await this.save();
    }
  }
  
  return this;
};

// Instance method to add reaction to message
chatSchema.methods.addReaction = async function(messageId, userId, emoji) {
  const message = this.messages.id(messageId);
  
  if (message) {
    // Remove existing reaction from this user
    message.reactions = message.reactions.filter(r => 
      r.user.toString() !== userId.toString()
    );
    
    // Add new reaction
    message.reactions.push({
      user: userId,
      emoji: emoji
    });
    
    await this.save();
  }
  
  return this;
};

// Instance method to get unread messages for user
chatSchema.methods.getUnreadMessagesForUser = function(userId) {
  const participant = this.participants.find(p => 
    p.user.toString() === userId.toString()
  );
  
  if (!participant) return [];
  
  return this.messages.filter(message => 
    message.createdAt > participant.lastSeen &&
    message.sender.toString() !== userId.toString()
  );
};

// Instance method to update last seen
chatSchema.methods.updateLastSeen = async function(userId) {
  const participant = this.participants.find(p => 
    p.user.toString() === userId.toString()
  );
  
  if (participant) {
    participant.lastSeen = new Date();
    await this.save();
  }
  
  return this;
};

module.exports = mongoose.model('Chat', chatSchema);