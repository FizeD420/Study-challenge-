import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import { showLocalNotification } from '../utils/appInitializer';
import { API_CONFIG } from '../services/api';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated, tokens } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  const socketRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated && user && tokens?.accessToken) {
      connectSocket();
    } else {
      disconnectSocket();
    }

    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, user, tokens]);

  const connectSocket = () => {
    if (socketRef.current?.connected) {
      return;
    }

    try {
      socketRef.current = io(API_CONFIG.BASE_URL.replace('/api', ''), {
        auth: {
          token: tokens?.accessToken,
        },
        transports: ['websocket'],
        timeout: 20000,
        forceNew: true,
      });

      socketRef.current.on('connect', () => {
        console.log('Socket connected:', socketRef.current.id);
        setIsConnected(true);
        
        // Join user room for personal notifications
        if (user?._id) {
          socketRef.current.emit('join-user-room', user._id);
        }
      });

      socketRef.current.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setIsConnected(false);
        setOnlineUsers({});
        setTypingUsers({});
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
      });

      // Handle online users updates
      socketRef.current.on('users-online', (users) => {
        setOnlineUsers(users);
      });

      // Handle user status changes
      socketRef.current.on('user-status-change', ({ userId, status }) => {
        setOnlineUsers(prev => ({
          ...prev,
          [userId]: status,
        }));
      });

      // Handle typing indicators
      socketRef.current.on('user-typing', ({ userId, groupId, isTyping }) => {
        setTypingUsers(prev => ({
          ...prev,
          [groupId]: {
            ...prev[groupId],
            [userId]: isTyping,
          },
        }));
      });

      // Handle challenge timer updates
      socketRef.current.on('challenge-timer-update', (data) => {
        console.log('Timer update received:', data);
        // This will be handled by individual screens
      });

      // Handle new chat messages
      socketRef.current.on('new-message', (message) => {
        console.log('New message received:', message);
        
        // Show notification if app is in foreground and not in chat screen
        showLocalNotification({
          title: `${message.sender.fullName} in ${message.groupName}`,
          message: message.content,
          data: {
            type: 'chat_message',
            groupId: message.groupId,
            messageId: message._id,
          },
        });
      });

      // Handle friend request notifications
      socketRef.current.on('friend-request', (data) => {
        console.log('Friend request received:', data);
        
        showLocalNotification({
          title: 'New Friend Request',
          message: `${data.sender.fullName} wants to be your friend`,
          data: {
            type: 'friend_request',
            userId: data.sender._id,
          },
        });
      });

      // Handle group invitation notifications
      socketRef.current.on('group-invitation', (data) => {
        console.log('Group invitation received:', data);
        
        showLocalNotification({
          title: 'Group Invitation',
          message: `You've been invited to join ${data.group.name}`,
          data: {
            type: 'group_invitation',
            groupId: data.group._id,
          },
        });
      });

      // Handle exam deadline notifications
      socketRef.current.on('exam-deadline-reminder', (data) => {
        console.log('Exam deadline reminder:', data);
        
        showLocalNotification({
          title: 'Exam Deadline Approaching',
          message: `Don't forget to submit your answers for ${data.group.name}`,
          data: {
            type: 'exam_deadline',
            groupId: data.group._id,
            examId: data.exam._id,
          },
        });
      });

      // Handle results published notifications
      socketRef.current.on('results-published', (data) => {
        console.log('Results published:', data);
        
        showLocalNotification({
          title: 'Exam Results Published',
          message: `Results are available for ${data.group.name}`,
          data: {
            type: 'results_published',
            groupId: data.group._id,
            examId: data.exam._id,
          },
        });
      });

      // Handle challenge reminders
      socketRef.current.on('challenge-reminder', (data) => {
        console.log('Challenge reminder:', data);
        
        showLocalNotification({
          title: 'Challenge Reminder',
          message: `${data.timeRemaining} left in ${data.group.name}`,
          data: {
            type: 'challenge_reminder',
            groupId: data.group._id,
          },
        });
      });

    } catch (error) {
      console.error('Socket connection error:', error);
    }
  };

  const disconnectSocket = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setOnlineUsers({});
      setTypingUsers({});
    }
  };

  // Socket event emitters
  const joinGroup = (groupId) => {
    if (socketRef.current) {
      socketRef.current.emit('join-group', groupId);
      console.log('Joined group:', groupId);
    }
  };

  const leaveGroup = (groupId) => {
    if (socketRef.current) {
      socketRef.current.emit('leave-group', groupId);
      console.log('Left group:', groupId);
    }
  };

  const sendMessage = (messageData) => {
    if (socketRef.current) {
      socketRef.current.emit('send-message', messageData);
    }
  };

  const markMessageAsRead = (messageId, groupId) => {
    if (socketRef.current) {
      socketRef.current.emit('mark-message-read', { messageId, groupId });
    }
  };

  const startTyping = (groupId) => {
    if (socketRef.current) {
      socketRef.current.emit('typing-start', { groupId, userId: user?._id });
    }
  };

  const stopTyping = (groupId) => {
    if (socketRef.current) {
      socketRef.current.emit('typing-stop', { groupId, userId: user?._id });
    }
  };

  const updateUserStatus = (status) => {
    if (socketRef.current) {
      socketRef.current.emit('update-status', status);
    }
  };

  const reactToMessage = (messageId, reaction) => {
    if (socketRef.current) {
      socketRef.current.emit('message-reaction', { messageId, reaction });
    }
  };

  // Socket event listeners
  const addEventListener = (event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  };

  const removeEventListener = (event, callback) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  };

  const value = {
    // Connection state
    isConnected,
    socket: socketRef.current,
    
    // User state
    onlineUsers,
    typingUsers,
    
    // Group management
    joinGroup,
    leaveGroup,
    
    // Chat functionality
    sendMessage,
    markMessageAsRead,
    startTyping,
    stopTyping,
    reactToMessage,
    
    // User status
    updateUserStatus,
    
    // Event management
    addEventListener,
    removeEventListener,
    
    // Connection management
    connectSocket,
    disconnectSocket,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;