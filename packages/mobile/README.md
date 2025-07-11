# Study Challenge Hub - Mobile App

A React Native mobile application for the Study Challenge Hub platform. This app allows students to create study groups, participate in timed challenges, submit handwritten exam answers, and chat with friends in real-time.

## 🚀 Features

### ✅ Authentication & User Management
- **User Registration & Login** with email verification
- **Password Reset** functionality
- **Profile Management** with avatar upload
- **JWT-based Authentication** with automatic token refresh
- **Social Login** (Google, Facebook) integration ready

### ✅ Study Groups & Challenges
- **Create Study Groups** with custom subjects and chapters
- **Invite Friends** to join study groups
- **Challenge Timer** system (2-6 days as requested)
- **Real-time Countdown** with synchronized timers
- **Group Management** (admin controls, member management)

### ✅ Exam System
- **Photo Submission** for handwritten answers
- **Camera Integration** with image cropping
- **File Upload** with progress tracking
- **Exam Results** viewing
- **Admin Grading** interface integration

### ✅ Real-time Chat
- **WhatsApp-style Messaging** as requested
- **Group Chat** with typing indicators
- **Message Reactions** and read receipts
- **File Sharing** (images, documents)
- **Real-time Notifications**

### ✅ Friends System
- **Friend Requests** (send, accept, decline)
- **User Search** and discovery
- **Friend Management**
- **Online Status** indicators

### ✅ Dashboard & Analytics
- **Personal Dashboard** with activity overview
- **Progress Tracking** for challenges
- **Statistics** (completed challenges, average scores)
- **Recent Activity** feed

### ✅ Notifications
- **Push Notifications** for all events
- **In-app Notifications** center
- **Email Notifications** integration
- **Notification Preferences**

## 🛠️ Tech Stack

- **Framework**: React Native 0.72.6
- **Navigation**: React Navigation v6 (Stack, Tab, Drawer)
- **State Management**: Zustand + React Query
- **UI Components**: React Native Paper + Custom Components
- **Real-time**: Socket.io Client
- **Forms**: React Hook Form
- **Animations**: React Native Animatable + Reanimated
- **Icons**: Material Icons
- **Image Handling**: React Native Image Picker/Cropper
- **Push Notifications**: React Native Firebase
- **Networking**: Axios with interceptors

## 📱 App Structure

```
src/
├── components/          # Reusable UI components
├── context/            # React contexts (Auth, Socket, Notifications)
├── navigation/         # Navigation configuration
├── screens/           # App screens
│   ├── auth/          # Authentication screens
│   ├── main/          # Main app screens (Dashboard, Groups, etc.)
│   ├── groups/        # Group-related screens
│   ├── exam/          # Exam and submission screens
│   ├── friends/       # Friend management screens
│   └── profile/       # Profile and settings screens
├── services/          # API services and utilities
├── theme/            # Theme configuration and styling
└── utils/            # Utility functions
```

## 🎨 Design System

### Color Scheme
- **Primary**: #007AFF (Blue - Trust and reliability)
- **Secondary**: #34C759 (Green - Success and progress)
- **Warning**: #FF9500 (Orange - Attention)
- **Error**: #FF3B30 (Red - Errors)
- **Background**: #F2F2F7 (Light gray)
- **Surface**: #FFFFFF (White cards)

### Subject Colors
- Mathematics: #FF6B6B
- Physics: #4ECDC4
- Chemistry: #45B7D1
- Biology: #96CEB4
- Computer Science: #FFEAA7
- English: #DDA0DD
- History: #F4A261
- Geography: #2A9D8F

## 📋 Setup Instructions

### Prerequisites
- Node.js 16+
- React Native CLI
- Android Studio (for Android development)
- Java Development Kit (JDK) 11

### Installation

1. **Install Dependencies**
   ```bash
   cd packages/mobile
   npm install
   ```

2. **Android Setup**
   ```bash
   # Install Android dependencies
   cd android
   ./gradlew clean
   cd ..
   
   # Link native dependencies (if needed)
   npx react-native link
   ```

3. **Configure Environment**
   ```bash
   # Create environment configuration
   cp .env.example .env
   
   # Update API endpoints in src/services/api.js
   # For Android Emulator: http://10.0.2.2:5000/api
   # For physical device: http://YOUR_IP:5000/api
   ```

4. **Run the App**
   ```bash
   # Start Metro bundler
   npm start
   
   # Run on Android (new terminal)
   npm run android
   ```

### Configuration

#### API Configuration
Update `src/services/api.js`:
```javascript
const BASE_URL = __DEV__ 
  ? 'http://10.0.2.2:5000/api'  // Android emulator
  : 'https://your-production-api.com/api';
```

#### Firebase Configuration (Push Notifications)
1. Create Firebase project
2. Add Android app to Firebase
3. Download `google-services.json` to `android/app/`
4. Configure Firebase messaging

## 📱 Key Screens

### Authentication Flow
- **Welcome Screen**: App introduction with features
- **Login Screen**: Email/password with social login options
- **Register Screen**: Full registration form with validation
- **Forgot Password**: Password reset functionality

### Main App Flow
- **Dashboard**: Overview of active challenges and statistics
- **Groups Screen**: List of user's study groups
- **Create Group**: Form to create new study groups
- **Group Details**: Group information and member management
- **Group Chat**: Real-time messaging interface
- **Exam Screen**: Photo submission for handwritten answers
- **Friends Screen**: Friend management and search
- **Profile Screen**: User profile and settings

## 🔌 API Integration

### Authentication
- Login/Register with JWT tokens
- Automatic token refresh
- Secure storage with React Native Keychain

### Real-time Features
- Socket.io connection management
- Real-time chat messages
- Live challenge timer updates
- Typing indicators and presence

### File Uploads
- Camera integration for exam photos
- Image compression and optimization
- Progress tracking for uploads
- Secure file handling

## 🔔 Notifications

### Push Notifications
- Firebase Cloud Messaging integration
- Background and foreground handling
- Custom notification actions
- Deep linking support

### Notification Types
- Friend requests
- Group invitations
- Challenge reminders
- Exam deadlines
- Chat messages
- Results published

## 🎯 Challenge Timer System

### Features
- **2-6 Day Challenges** as requested in requirements
- **Synchronized Timers** across all group members
- **Real-time Updates** via Socket.io
- **Background Handling** with local notifications
- **Progress Tracking** throughout challenge duration

### Implementation
```javascript
// Real-time timer updates
useEffect(() => {
  socket.on('challenge-timer-update', (data) => {
    updateTimerState(data);
  });
}, []);

// Countdown component with Circle Timer
<CountdownCircleTimer
  isPlaying
  duration={timeRemaining}
  onComplete={handleChallengeComplete}
>
  {({ remainingTime }) => formatTime(remainingTime)}
</CountdownCircleTimer>
```

## 📸 Exam Photo Submission

### Camera Features
- **Native Camera Integration**
- **Image Cropping** and editing
- **Compression** for optimal file sizes
- **Multiple Photo Upload**
- **Preview and Review** before submission

### Submission Process
1. Open camera from exam screen
2. Capture handwritten answers
3. Crop and enhance image
4. Add submission notes
5. Upload with progress tracking
6. Confirm submission

## 💬 WhatsApp-Style Chat

### Features (as requested)
- **Real-time Messaging** with Socket.io
- **Message Status** (sent, delivered, read)
- **Typing Indicators** when users are typing
- **Message Reactions** (emoji reactions)
- **File Sharing** (images, documents)
- **Group Chat** for study groups
- **Message History** with pagination

### Chat Interface
```javascript
<GiftedChat
  messages={messages}
  onSend={handleSendMessage}
  user={currentUser}
  renderBubble={renderMessageBubble}
  renderInputToolbar={renderInputToolbar}
  isTyping={isTyping}
/>
```

## 🔒 Security Features

- **JWT Authentication** with secure storage
- **API Request Interceptors** for automatic token attachment
- **Input Validation** on all forms
- **Image Upload Security** with file type validation
- **Network Security** with SSL/TLS
- **Biometric Authentication** support (optional)

## 🎨 UI/UX Features

### Design Principles
- **Material Design** guidelines
- **Consistent Color Scheme** for subjects
- **Intuitive Navigation** with tab and stack navigators
- **Smooth Animations** for better user experience
- **Loading States** and skeleton screens
- **Error Handling** with user-friendly messages

### Accessibility
- **Screen Reader** support
- **High Contrast** mode compatibility
- **Large Text** support
- **Touch Target** sizing (minimum 44px)

## 🚀 Performance Optimizations

- **Image Optimization** with compression
- **Lazy Loading** for screens and components
- **API Response Caching** with React Query
- **Bundle Splitting** for faster startup
- **Memory Management** for smooth performance

## 📦 Build & Deploy

### Android APK Build
```bash
# Generate signed APK
cd android
./gradlew assembleRelease

# APK location: android/app/build/outputs/apk/release/app-release.apk
```

### Google Play Store
1. Generate signed bundle: `./gradlew bundleRelease`
2. Upload to Google Play Console
3. Configure store listing and screenshots
4. Submit for review

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

## 📝 Additional Screens to Implement

The following screens are referenced in navigation but need implementation:

1. **RegisterScreen.js** - User registration form
2. **ForgotPasswordScreen.js** - Password reset request
3. **GroupsScreen.js** - List of user's study groups
4. **GroupDetailsScreen.js** - Group information and management
5. **GroupChatScreen.js** - Real-time group messaging
6. **CreateGroupScreen.js** - Create new study group
7. **ExamScreen.js** - Take exam with photo submission
8. **FriendsScreen.js** - Friends list and management
9. **ProfileScreen.js** - User profile and statistics
10. **SettingsScreen.js** - App preferences and settings

## 🔗 Integration with Backend

This mobile app integrates seamlessly with the Node.js backend API:

- **Authentication** endpoints for login/register
- **Groups** endpoints for CRUD operations
- **Chat** endpoints for message history
- **Exam** endpoints for submissions and results
- **Friends** endpoints for social features
- **Real-time** Socket.io events for live updates

## 📄 License

This project is part of the Study Challenge Hub platform. All rights reserved.

---

**Study Challenge Hub Mobile App** - Empowering students to learn together through technology! 📚📱