const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Group = require('../models/Group');
const Chat = require('../models/Chat');
const Notification = require('../models/Notification');

// Store connected users
const connectedUsers = new Map();

// Authenticate socket connection
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      return next(new Error('User not found or inactive'));
    }

    socket.userId = user._id.toString();
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
};

const socketHandlers = (io, socket) => {
  console.log(`🔌 User connected: ${socket.userId}`);
  
  // Store user connection
  connectedUsers.set(socket.userId, socket.id);
  
  // Join user to their personal room for notifications
  socket.join(`user_${socket.userId}`);
  
  // Join user to their group rooms
  socket.user.groups.forEach(groupId => {
    socket.join(`group_${groupId}`);
  });

  // Handle joining a group room
  socket.on('join_group', async (data) => {
    try {
      const { groupId } = data;
      
      // Verify user is member of the group
      const group = await Group.findById(groupId);
      if (!group) {
        return socket.emit('error', { message: 'Group not found' });
      }
      
      const isMember = group.members.some(member => 
        member.user.toString() === socket.userId && member.status === 'active'
      );
      
      if (!isMember) {
        return socket.emit('error', { message: 'Not a member of this group' });
      }
      
      socket.join(`group_${groupId}`);
      socket.emit('joined_group', { groupId });
      
      console.log(`👥 User ${socket.userId} joined group ${groupId}`);
    } catch (error) {
      console.error('Error joining group:', error);
      socket.emit('error', { message: 'Failed to join group' });
    }
  });

  // Handle leaving a group room
  socket.on('leave_group', (data) => {
    const { groupId } = data;
    socket.leave(`group_${groupId}`);
    socket.emit('left_group', { groupId });
    console.log(`👥 User ${socket.userId} left group ${groupId}`);
  });

  // Handle sending a message in group chat
  socket.on('send_message', async (data) => {
    try {
      const { groupId, content, messageType = 'text', fileData = {} } = data;
      
      // Verify user is member of the group
      const group = await Group.findById(groupId).populate('chat');
      if (!group) {
        return socket.emit('error', { message: 'Group not found' });
      }
      
      const isMember = group.members.some(member => 
        member.user.toString() === socket.userId && member.status === 'active'
      );
      
      if (!isMember) {
        return socket.emit('error', { message: 'Not a member of this group' });
      }
      
      // Get or create chat
      let chat = group.chat;
      if (!chat) {
        chat = new Chat({
          group: groupId,
          participants: group.members.map(member => ({
            user: member.user,
            role: member.role === 'creator' ? 'admin' : 'member'
          }))
        });
        await chat.save();
        
        group.chat = chat._id;
        await group.save();
      }
      
      // Add message to chat
      const message = await chat.addMessage(socket.userId, content, messageType, fileData);
      
      // Populate sender information
      await message.populate('sender', 'fullName profilePicture');
      
      // Emit message to all group members
      io.to(`group_${groupId}`).emit('new_message', {
        groupId,
        message: {
          _id: message._id,
          sender: message.sender,
          content: message.content,
          messageType: message.messageType,
          fileUrl: message.fileUrl,
          fileName: message.fileName,
          createdAt: message.createdAt,
          reactions: message.reactions,
          readBy: message.readBy
        }
      });
      
      console.log(`💬 Message sent in group ${groupId} by user ${socket.userId}`);
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle message reactions
  socket.on('add_reaction', async (data) => {
    try {
      const { groupId, messageId, emoji } = data;
      
      const group = await Group.findById(groupId).populate('chat');
      if (!group || !group.chat) {
        return socket.emit('error', { message: 'Chat not found' });
      }
      
      await group.chat.addReaction(messageId, socket.userId, emoji);
      
      // Emit reaction update to all group members
      io.to(`group_${groupId}`).emit('message_reaction', {
        groupId,
        messageId,
        userId: socket.userId,
        emoji
      });
      
    } catch (error) {
      console.error('Error adding reaction:', error);
      socket.emit('error', { message: 'Failed to add reaction' });
    }
  });

  // Handle marking messages as read
  socket.on('mark_messages_read', async (data) => {
    try {
      const { groupId, messageIds } = data;
      
      const group = await Group.findById(groupId).populate('chat');
      if (!group || !group.chat) {
        return socket.emit('error', { message: 'Chat not found' });
      }
      
      // Mark messages as read
      for (const messageId of messageIds) {
        await group.chat.markMessageAsRead(messageId, socket.userId);
      }
      
      // Update last seen
      await group.chat.updateLastSeen(socket.userId);
      
      // Emit read status to group members
      socket.to(`group_${groupId}`).emit('messages_read', {
        groupId,
        userId: socket.userId,
        messageIds
      });
      
    } catch (error) {
      console.error('Error marking messages as read:', error);
      socket.emit('error', { message: 'Failed to mark messages as read' });
    }
  });

  // Handle typing indicators
  socket.on('typing_start', (data) => {
    const { groupId } = data;
    socket.to(`group_${groupId}`).emit('user_typing', {
      groupId,
      userId: socket.userId,
      userName: socket.user.fullName
    });
  });

  socket.on('typing_stop', (data) => {
    const { groupId } = data;
    socket.to(`group_${groupId}`).emit('user_stopped_typing', {
      groupId,
      userId: socket.userId
    });
  });

  // Handle challenge timer updates
  socket.on('request_timer_update', async (data) => {
    try {
      const { groupId } = data;
      
      const group = await Group.findById(groupId);
      if (!group) {
        return socket.emit('error', { message: 'Group not found' });
      }
      
      // Send current timer status
      socket.emit('timer_update', {
        groupId,
        timeRemaining: group.timeRemaining,
        challengeProgress: group.challengeProgress,
        status: group.challenge.status,
        isStarted: group.challenge.isStarted,
        examStarted: group.challenge.examStarted
      });
      
    } catch (error) {
      console.error('Error getting timer update:', error);
      socket.emit('error', { message: 'Failed to get timer update' });
    }
  });

  // Handle notification acknowledgment
  socket.on('notification_read', async (data) => {
    try {
      const { notificationIds } = data;
      
      await Notification.markAsRead(socket.userId, notificationIds);
      
      socket.emit('notifications_marked_read', { notificationIds });
      
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      socket.emit('error', { message: 'Failed to mark notifications as read' });
    }
  });

  // Handle requesting unread notifications count
  socket.on('get_unread_count', async () => {
    try {
      const unreadCount = await Notification.getUnreadCount(socket.userId);
      socket.emit('unread_count', { count: unreadCount });
    } catch (error) {
      console.error('Error getting unread count:', error);
      socket.emit('error', { message: 'Failed to get unread count' });
    }
  });

  // Handle user status updates
  socket.on('update_status', async (data) => {
    try {
      const { status } = data; // 'online', 'away', 'busy', 'offline'
      
      // Update user's status in database if needed
      socket.user.lastActive = new Date();
      await socket.user.save();
      
      // Broadcast status to user's groups
      socket.user.groups.forEach(groupId => {
        socket.to(`group_${groupId}`).emit('user_status_update', {
          userId: socket.userId,
          status: status,
          lastActive: socket.user.lastActive
        });
      });
      
    } catch (error) {
      console.error('Error updating status:', error);
      socket.emit('error', { message: 'Failed to update status' });
    }
  });

  // Handle disconnect
  socket.on('disconnect', async () => {
    try {
      console.log(`👋 User disconnected: ${socket.userId}`);
      
      // Remove from connected users
      connectedUsers.delete(socket.userId);
      
      // Update last active time
      if (socket.user) {
        socket.user.lastActive = new Date();
        await socket.user.save();
        
        // Broadcast offline status to user's groups
        socket.user.groups.forEach(groupId => {
          socket.to(`group_${groupId}`).emit('user_status_update', {
            userId: socket.userId,
            status: 'offline',
            lastActive: socket.user.lastActive
          });
        });
      }
    } catch (error) {
      console.error('Error during disconnect:', error);
    }
  });

  // Handle connection errors
  socket.on('error', (error) => {
    console.error('Socket error:', error);
    socket.emit('error', { message: 'Connection error occurred' });
  });
};

// Utility functions for emitting events from other parts of the application

// Send notification to specific user
const sendNotificationToUser = (io, userId, notification) => {
  io.to(`user_${userId}`).emit('new_notification', notification);
};

// Send message to group
const sendMessageToGroup = (io, groupId, message) => {
  io.to(`group_${groupId}`).emit('new_message', message);
};

// Broadcast timer update to group
const broadcastTimerUpdate = (io, groupId, timerData) => {
  io.to(`group_${groupId}`).emit('timer_update', timerData);
};

// Broadcast challenge status update
const broadcastChallengeUpdate = (io, groupId, challengeData) => {
  io.to(`group_${groupId}`).emit('challenge_update', challengeData);
};

// Send exam notification to group
const sendExamNotification = (io, groupId, examData) => {
  io.to(`group_${groupId}`).emit('exam_notification', examData);
};

// Get online users count for a group
const getOnlineUsersInGroup = (groupId) => {
  // This would need to be implemented with proper room tracking
  return Array.from(connectedUsers.keys());
};

// Check if user is online
const isUserOnline = (userId) => {
  return connectedUsers.has(userId);
};

module.exports = {
  socketHandlers,
  authenticateSocket,
  sendNotificationToUser,
  sendMessageToGroup,
  broadcastTimerUpdate,
  broadcastChallengeUpdate,
  sendExamNotification,
  getOnlineUsersInGroup,
  isUserOnline
};