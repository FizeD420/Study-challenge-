import { Platform, PermissionsAndroid } from 'react-native';
import PushNotification from 'react-native-push-notification';
import messaging from '@react-native-firebase/messaging';
import { showMessage } from 'react-native-flash-message';

// Initialize the app with necessary configurations
export const initializeApp = async () => {
  try {
    // Request permissions
    await requestPermissions();
    
    // Initialize push notifications
    await initializePushNotifications();
    
    console.log('App initialized successfully');
  } catch (error) {
    console.error('App initialization error:', error);
  }
};

// Request necessary permissions
const requestPermissions = async () => {
  if (Platform.OS === 'android') {
    try {
      // Camera permission
      const cameraPermission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'Study Challenge Hub needs camera access to capture exam answers',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );

      // Storage permission
      const storagePermission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Storage Permission',
          message: 'Study Challenge Hub needs storage access to save exam photos',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );

      // Notification permission (Android 13+)
      if (Platform.Version >= 33) {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: 'Notification Permission',
            message: 'Study Challenge Hub needs notification access to keep you updated',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
      }

      console.log('Android permissions requested');
    } catch (error) {
      console.error('Permission request error:', error);
    }
  }
};

// Initialize push notifications
const initializePushNotifications = async () => {
  try {
    // Request Firebase messaging permission
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Push notification permission granted');
      
      // Get FCM token
      const fcmToken = await messaging().getToken();
      if (fcmToken) {
        console.log('FCM Token:', fcmToken);
        // TODO: Send token to backend
      }
    } else {
      console.log('Push notification permission denied');
    }

    // Configure local notifications
    PushNotification.configure({
      // Called when token is generated
      onRegister: function (token) {
        console.log('Local notification token:', token);
      },

      // Called when a remote or local notification is opened or received
      onNotification: function (notification) {
        console.log('Notification received:', notification);
        
        if (notification.userInteraction) {
          // User tapped on notification
          handleNotificationTap(notification);
        }
      },

      // Android specific settings
      popInitialNotification: true,
      requestPermissions: Platform.OS === 'ios',
    });

    // Create notification channels for Android
    if (Platform.OS === 'android') {
      PushNotification.createChannel(
        {
          channelId: 'default-channel',
          channelName: 'Default Channel',
          channelDescription: 'A default channel for notifications',
          soundName: 'default',
          importance: 4,
          vibrate: true,
        },
        (created) => console.log(`Default channel created: ${created}`)
      );

      PushNotification.createChannel(
        {
          channelId: 'challenge-channel',
          channelName: 'Challenge Notifications',
          channelDescription: 'Notifications for study challenges and timers',
          soundName: 'default',
          importance: 4,
          vibrate: true,
        },
        (created) => console.log(`Challenge channel created: ${created}`)
      );

      PushNotification.createChannel(
        {
          channelId: 'chat-channel',
          channelName: 'Chat Messages',
          channelDescription: 'Notifications for chat messages',
          soundName: 'default',
          importance: 3,
          vibrate: true,
        },
        (created) => console.log(`Chat channel created: ${created}`)
      );
    }

    // Handle background messages
    messaging().onMessage(async (remoteMessage) => {
      console.log('Foreground message:', remoteMessage);
      
      // Show local notification when app is in foreground
      showLocalNotification({
        title: remoteMessage.notification?.title || 'Study Challenge Hub',
        message: remoteMessage.notification?.body || 'You have a new notification',
        data: remoteMessage.data,
      });
    });

    // Handle notification when app is in background/killed
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('Background notification opened:', remoteMessage);
      handleNotificationTap(remoteMessage);
    });

    // Check if app was opened from notification when killed
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('App opened from killed state:', remoteMessage);
          handleNotificationTap(remoteMessage);
        }
      });

  } catch (error) {
    console.error('Push notification initialization error:', error);
  }
};

// Show local notification
export const showLocalNotification = ({ title, message, data = {} }) => {
  PushNotification.localNotification({
    title,
    message,
    channelId: data.type === 'chat' ? 'chat-channel' : 
               data.type === 'challenge' ? 'challenge-channel' : 
               'default-channel',
    userInfo: data,
    importance: 'high',
    priority: 'high',
    vibrate: true,
    playSound: true,
    soundName: 'default',
  });
};

// Handle notification tap
const handleNotificationTap = (notification) => {
  const data = notification.data || {};
  
  switch (data.type) {
    case 'friend_request':
      // Navigate to friend requests screen
      console.log('Navigate to friend requests');
      break;
      
    case 'group_invitation':
      // Navigate to group details
      console.log('Navigate to group:', data.groupId);
      break;
      
    case 'challenge_reminder':
      // Navigate to group challenge
      console.log('Navigate to challenge:', data.groupId);
      break;
      
    case 'exam_deadline':
      // Navigate to exam screen
      console.log('Navigate to exam:', data.examId);
      break;
      
    case 'chat_message':
      // Navigate to group chat
      console.log('Navigate to chat:', data.groupId);
      break;
      
    case 'results_published':
      // Navigate to results screen
      console.log('Navigate to results:', data.examId);
      break;
      
    default:
      // Navigate to notifications screen
      console.log('Navigate to notifications');
      break;
  }
};

// Schedule local notification
export const scheduleLocalNotification = ({ 
  title, 
  message, 
  date, 
  data = {},
  id 
}) => {
  PushNotification.localNotificationSchedule({
    id: id || Date.now().toString(),
    title,
    message,
    date,
    channelId: data.type === 'challenge' ? 'challenge-channel' : 'default-channel',
    userInfo: data,
    importance: 'high',
    priority: 'high',
    vibrate: true,
    playSound: true,
    soundName: 'default',
  });
};

// Cancel scheduled notification
export const cancelLocalNotification = (id) => {
  PushNotification.cancelLocalNotifications({ id });
};

// Clear all notifications
export const clearAllNotifications = () => {
  PushNotification.cancelAllLocalNotifications();
  PushNotification.removeAllDeliveredNotifications();
};

// Show app update notification
export const showAppUpdateNotification = () => {
  showMessage({
    message: 'A new version is available',
    description: 'Update Study Challenge Hub to get the latest features',
    type: 'info',
    duration: 5000,
    icon: 'auto',
  });
};

// Handle network connectivity changes
export const handleNetworkChange = (isConnected) => {
  if (!isConnected) {
    showMessage({
      message: 'No internet connection',
      description: 'Some features may not work properly',
      type: 'warning',
      duration: 3000,
    });
  } else {
    showMessage({
      message: 'Connection restored',
      type: 'success',
      duration: 2000,
    });
  }
};

export default {
  initializeApp,
  showLocalNotification,
  scheduleLocalNotification,
  cancelLocalNotification,
  clearAllNotifications,
  showAppUpdateNotification,
  handleNetworkChange,
};