import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import { useAuth } from './AuthContext';
import authService from '../services/authService';

const NotificationContext = createContext();

// Initial state
const initialState = {
  notifications: [],
  unreadCount: 0,
  pushToken: null,
  permissions: {
    notifications: false,
    alert: false,
    badge: false,
    sound: false,
  },
  preferences: {
    friendRequests: true,
    groupInvitations: true,
    challengeReminders: true,
    examDeadlines: true,
    chatMessages: true,
    resultsPublished: true,
    emailNotifications: true,
  },
  isLoading: false,
};

// Action types
const NOTIFICATION_ACTIONS = {
  SET_NOTIFICATIONS: 'SET_NOTIFICATIONS',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  MARK_AS_READ: 'MARK_AS_READ',
  MARK_ALL_AS_READ: 'MARK_ALL_AS_READ',
  DELETE_NOTIFICATION: 'DELETE_NOTIFICATION',
  SET_PUSH_TOKEN: 'SET_PUSH_TOKEN',
  SET_PERMISSIONS: 'SET_PERMISSIONS',
  SET_PREFERENCES: 'SET_PREFERENCES',
  SET_LOADING: 'SET_LOADING',
  UPDATE_UNREAD_COUNT: 'UPDATE_UNREAD_COUNT',
};

// Reducer function
const notificationReducer = (state, action) => {
  switch (action.type) {
    case NOTIFICATION_ACTIONS.SET_NOTIFICATIONS:
      return {
        ...state,
        notifications: action.payload,
        unreadCount: action.payload.filter(n => !n.isRead).length,
      };

    case NOTIFICATION_ACTIONS.ADD_NOTIFICATION:
      const newNotifications = [action.payload, ...state.notifications];
      return {
        ...state,
        notifications: newNotifications,
        unreadCount: newNotifications.filter(n => !n.isRead).length,
      };

    case NOTIFICATION_ACTIONS.MARK_AS_READ:
      const updatedNotifications = state.notifications.map(notification =>
        notification._id === action.payload
          ? { ...notification, isRead: true }
          : notification
      );
      return {
        ...state,
        notifications: updatedNotifications,
        unreadCount: updatedNotifications.filter(n => !n.isRead).length,
      };

    case NOTIFICATION_ACTIONS.MARK_ALL_AS_READ:
      const allReadNotifications = state.notifications.map(notification => ({
        ...notification,
        isRead: true,
      }));
      return {
        ...state,
        notifications: allReadNotifications,
        unreadCount: 0,
      };

    case NOTIFICATION_ACTIONS.DELETE_NOTIFICATION:
      const filteredNotifications = state.notifications.filter(
        notification => notification._id !== action.payload
      );
      return {
        ...state,
        notifications: filteredNotifications,
        unreadCount: filteredNotifications.filter(n => !n.isRead).length,
      };

    case NOTIFICATION_ACTIONS.SET_PUSH_TOKEN:
      return {
        ...state,
        pushToken: action.payload,
      };

    case NOTIFICATION_ACTIONS.SET_PERMISSIONS:
      return {
        ...state,
        permissions: action.payload,
      };

    case NOTIFICATION_ACTIONS.SET_PREFERENCES:
      return {
        ...state,
        preferences: { ...state.preferences, ...action.payload },
      };

    case NOTIFICATION_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    case NOTIFICATION_ACTIONS.UPDATE_UNREAD_COUNT:
      return {
        ...state,
        unreadCount: action.payload,
      };

    default:
      return state;
  }
};

export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      initializeNotifications();
      loadNotificationPreferences();
    }
  }, [isAuthenticated, user]);

  const initializeNotifications = async () => {
    try {
      // Check notification permissions
      const authStatus = await messaging().hasPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      dispatch({
        type: NOTIFICATION_ACTIONS.SET_PERMISSIONS,
        payload: {
          notifications: enabled,
          alert: enabled,
          badge: enabled,
          sound: enabled,
        },
      });

      if (enabled) {
        // Get FCM token
        const token = await messaging().getToken();
        if (token) {
          dispatch({
            type: NOTIFICATION_ACTIONS.SET_PUSH_TOKEN,
            payload: token,
          });

          // Send token to backend
          await authService.addDeviceToken(token, 'android');
        }

        // Handle token refresh
        messaging().onTokenRefresh(async (newToken) => {
          dispatch({
            type: NOTIFICATION_ACTIONS.SET_PUSH_TOKEN,
            payload: newToken,
          });
          await authService.addDeviceToken(newToken, 'android');
        });
      }

      // Load notifications from backend
      await loadNotifications();
    } catch (error) {
      console.error('Notification initialization error:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      dispatch({ type: NOTIFICATION_ACTIONS.SET_LOADING, payload: true });
      
      // TODO: Implement API call to get notifications
      // const response = await notificationService.getNotifications();
      // dispatch({
      //   type: NOTIFICATION_ACTIONS.SET_NOTIFICATIONS,
      //   payload: response.data.notifications,
      // });

      // Mock data for now
      const mockNotifications = [
        {
          _id: '1',
          type: 'friend_request',
          title: 'New Friend Request',
          message: 'John Doe wants to be your friend',
          isRead: false,
          createdAt: new Date().toISOString(),
          data: { userId: 'user123' },
        },
        {
          _id: '2',
          type: 'group_invitation',
          title: 'Group Invitation',
          message: 'You\'ve been invited to join Physics Study Group',
          isRead: true,
          createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          data: { groupId: 'group123' },
        },
      ];

      dispatch({
        type: NOTIFICATION_ACTIONS.SET_NOTIFICATIONS,
        payload: mockNotifications,
      });
    } catch (error) {
      console.error('Load notifications error:', error);
    } finally {
      dispatch({ type: NOTIFICATION_ACTIONS.SET_LOADING, payload: false });
    }
  };

  const loadNotificationPreferences = async () => {
    try {
      const savedPreferences = await AsyncStorage.getItem('notificationPreferences');
      if (savedPreferences) {
        const preferences = JSON.parse(savedPreferences);
        dispatch({
          type: NOTIFICATION_ACTIONS.SET_PREFERENCES,
          payload: preferences,
        });
      }
    } catch (error) {
      console.error('Load notification preferences error:', error);
    }
  };

  const saveNotificationPreferences = async (preferences) => {
    try {
      await AsyncStorage.setItem('notificationPreferences', JSON.stringify(preferences));
      dispatch({
        type: NOTIFICATION_ACTIONS.SET_PREFERENCES,
        payload: preferences,
      });

      // TODO: Send preferences to backend
      // await authService.updatePreferences({ notifications: preferences });
    } catch (error) {
      console.error('Save notification preferences error:', error);
    }
  };

  const requestNotificationPermission = async () => {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      dispatch({
        type: NOTIFICATION_ACTIONS.SET_PERMISSIONS,
        payload: {
          notifications: enabled,
          alert: enabled,
          badge: enabled,
          sound: enabled,
        },
      });

      if (enabled) {
        const token = await messaging().getToken();
        if (token) {
          dispatch({
            type: NOTIFICATION_ACTIONS.SET_PUSH_TOKEN,
            payload: token,
          });
          await authService.addDeviceToken(token, 'android');
        }
      }

      return enabled;
    } catch (error) {
      console.error('Request notification permission error:', error);
      return false;
    }
  };

  const addNotification = (notification) => {
    dispatch({
      type: NOTIFICATION_ACTIONS.ADD_NOTIFICATION,
      payload: {
        _id: Date.now().toString(),
        ...notification,
        isRead: false,
        createdAt: new Date().toISOString(),
      },
    });
  };

  const markAsRead = async (notificationId) => {
    try {
      dispatch({
        type: NOTIFICATION_ACTIONS.MARK_AS_READ,
        payload: notificationId,
      });

      // TODO: Send to backend
      // await notificationService.markAsRead(notificationId);
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      dispatch({
        type: NOTIFICATION_ACTIONS.MARK_ALL_AS_READ,
      });

      // TODO: Send to backend
      // await notificationService.markAllAsRead();
    } catch (error) {
      console.error('Mark all as read error:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      dispatch({
        type: NOTIFICATION_ACTIONS.DELETE_NOTIFICATION,
        payload: notificationId,
      });

      // TODO: Send to backend
      // await notificationService.deleteNotification(notificationId);
    } catch (error) {
      console.error('Delete notification error:', error);
    }
  };

  const clearAllNotifications = async () => {
    try {
      dispatch({
        type: NOTIFICATION_ACTIONS.SET_NOTIFICATIONS,
        payload: [],
      });

      // TODO: Send to backend
      // await notificationService.clearAll();
    } catch (error) {
      console.error('Clear all notifications error:', error);
    }
  };

  const getNotificationsByType = (type) => {
    return state.notifications.filter(notification => notification.type === type);
  };

  const getUnreadNotifications = () => {
    return state.notifications.filter(notification => !notification.isRead);
  };

  const shouldShowNotification = (type) => {
    return state.preferences[type] !== false;
  };

  const value = {
    // State
    ...state,
    
    // Actions
    loadNotifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    
    // Permissions
    requestNotificationPermission,
    
    // Preferences
    saveNotificationPreferences,
    
    // Utilities
    getNotificationsByType,
    getUnreadNotifications,
    shouldShowNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;