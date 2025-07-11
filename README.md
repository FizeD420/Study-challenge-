# 📱 Study Challenge Hub

> A productivity-focused educational app where users can form private study groups, set challenge durations, select chapters or subjects, and take real-world written exams with peer interaction and accountability.

## ✨ Features

### 🧑‍🤝‍🧑 Group Management
- **Create Study Groups**: Any registered user can create study challenge groups
- **Subject & Chapter Selection**: Choose from various subjects and specific topics
- **Challenge Duration**: Set challenges from 2-6 days
- **Member Management**: Invite friends, manage group members, and control group settings
- **Private Groups**: Secure, invite-only study groups

### ⏱️ Challenge Timer System
- **Real-time Countdown**: Live timer showing remaining challenge time
- **Automatic Progression**: Seamless transition from study phase to exam phase
- **Progress Tracking**: Visual progress bars and milestone notifications
- **Synchronized Experience**: All group members see the same timer

### 📝 Real-World Exam System
- **Admin-Managed Papers**: Admins upload exam questions for different subjects
- **Photo Submission**: Students submit handwritten answers via photo uploads
- **Manual Grading**: Admin panel for reviewing and grading submissions
- **Results Publishing**: Automatic score distribution to group members

### 💬 Real-time Communication
- **Group Chat**: WhatsApp-style messaging for each study group
- **File Sharing**: Share images, documents, and study materials
- **Message Reactions**: React to messages with emojis
- **Typing Indicators**: See when group members are typing
- **Read Receipts**: Track message delivery and read status

### 🔐 User Management
- **Secure Registration**: Email verification and secure authentication
- **Profile Management**: Upload profile pictures, manage school/college info
- **Friend System**: Send/accept friend requests, build study networks
- **Privacy Controls**: Control what information is visible to others

### 🔔 Smart Notifications
- **Push Notifications**: Real-time alerts for all important events
- **Email Notifications**: Backup email alerts for critical updates
- **Customizable Settings**: Control which notifications you receive
- **Priority System**: Different priority levels for different events

### 👨‍💼 Admin Panel
- **Exam Management**: Upload and manage exam papers
- **User Administration**: Monitor users and manage accounts
- **Grading System**: Review submissions and assign marks
- **Analytics Dashboard**: Track app usage and performance

## 🏗️ Architecture

### Backend Stack
- **Node.js + Express**: RESTful API server
- **MongoDB + Mongoose**: Database and ODM
- **Socket.io**: Real-time communication
- **JWT**: Authentication and authorization
- **Cloudinary**: Image and file storage
- **Nodemailer**: Email services

### Frontend Options
- **React Native**: Cross-platform mobile app
- **React**: Web-based admin panel
- **Socket.io Client**: Real-time features

### Security Features
- **JWT Authentication**: Secure token-based auth
- **Rate Limiting**: Prevent abuse and spam
- **Input Validation**: Comprehensive request validation
- **File Upload Security**: Safe file handling
- **CORS Protection**: Cross-origin request security

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- MongoDB (v5+)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/study-challenge-hub.git
   cd study-challenge-hub
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Environment Setup**
   ```bash
   # Backend environment
   cd packages/backend
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database Setup**
   ```bash
   # Make sure MongoDB is running
   mongod
   ```

5. **Start Development Servers**
   ```bash
   # Start backend and admin panel
   npm run dev
   
   # In another terminal, start mobile app
   npm run start:mobile
   ```

### Environment Variables

Create `.env` file in `packages/backend/`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/study-challenge-hub

# JWT Secrets
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Frontend URLs
FRONTEND_URL=http://localhost:3000
MOBILE_APP_SCHEME=studychallenge://
```

## 📱 API Documentation

### Authentication Endpoints

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/verify-email
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET  /api/auth/me
```

### Group Management

```http
GET    /api/groups                 # Get user's groups
POST   /api/groups                 # Create new group
GET    /api/groups/:id             # Get group details
PUT    /api/groups/:id             # Update group
DELETE /api/groups/:id             # Delete group
POST   /api/groups/:id/invite      # Invite users
POST   /api/groups/:id/join        # Join group
POST   /api/groups/:id/leave       # Leave group
POST   /api/groups/:id/start       # Start challenge
```

### Chat & Messaging

```http
GET  /api/chat/:groupId/messages   # Get chat messages
POST /api/chat/:groupId/messages   # Send message
PUT  /api/chat/:groupId/read       # Mark messages as read
```

### Exam System

```http
GET    /api/exams/:groupId         # Get exam details
POST   /api/exams/:groupId/submit  # Submit exam answers
GET    /api/exams/:groupId/results # Get exam results
```

### Friend System

```http
GET    /api/friends                # Get friends list
POST   /api/friends/request        # Send friend request
POST   /api/friends/accept         # Accept friend request
POST   /api/friends/decline        # Decline friend request
DELETE /api/friends/:id            # Remove friend
```

## 🎨 UI/UX Guidelines

### Design Principles
- **Clean & Minimal**: Focus on content and functionality
- **Modern Interface**: Contemporary design patterns
- **Intuitive Navigation**: Easy-to-use interface
- **Responsive Design**: Works on all screen sizes
- **Accessibility**: WCAG compliant design

### Color Scheme
- **Primary**: Blue (#007AFF) - Trust and reliability
- **Secondary**: Green (#34C759) - Success and progress
- **Warning**: Orange (#FF9500) - Attention and alerts
- **Error**: Red (#FF3B30) - Errors and critical actions
- **Background**: Light gray (#F2F2F7) - Clean background

### Typography
- **Headings**: System font, bold weights
- **Body Text**: System font, regular weight
- **Labels**: System font, medium weight
- **Captions**: System font, light weight

## 📊 Database Schema

### User Model
```javascript
{
  fullName: String,
  email: String,
  password: String (hashed),
  schoolOrCollege: String,
  profilePicture: String,
  isEmailVerified: Boolean,
  role: 'user' | 'admin',
  friends: [ObjectId],
  groups: [ObjectId],
  stats: {
    totalChallenges: Number,
    averageScore: Number,
    // ...
  }
}
```

### Group Model
```javascript
{
  name: String,
  subject: String,
  chapter: String,
  creator: ObjectId,
  members: [{
    user: ObjectId,
    role: 'creator' | 'member',
    status: 'active' | 'left' | 'removed'
  }],
  challenge: {
    duration: Number,
    startTime: Date,
    endTime: Date,
    status: 'pending' | 'active' | 'completed'
  },
  exam: {
    paperUrl: String,
    maxMarks: Number,
    duration: Number
  },
  submissions: [{
    user: ObjectId,
    answerSheets: [String],
    marks: Number,
    feedback: String
  }]
}
```

## 🔄 Real-time Events

### Socket.io Events

**Client → Server:**
- `join_group` - Join a group room
- `send_message` - Send chat message
- `typing_start/stop` - Typing indicators
- `mark_messages_read` - Mark messages as read

**Server → Client:**
- `new_message` - New chat message
- `timer_update` - Challenge timer update
- `challenge_update` - Challenge status change
- `exam_notification` - Exam availability
- `new_notification` - Push notification

## 🧪 Testing

```bash
# Run backend tests
cd packages/backend
npm test

# Run frontend tests
cd packages/mobile
npm test

# Run admin panel tests
cd packages/admin
npm test
```

## 📦 Deployment

### Backend Deployment (Heroku)
```bash
# Build the project
npm run build:backend

# Deploy to Heroku
git push heroku main
```

### Mobile App Deployment
```bash
# Build for iOS
cd packages/mobile
npx react-native run-ios --configuration Release

# Build for Android
npx react-native run-android --variant=release
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow ESLint and Prettier configurations
- Write tests for new features
- Update documentation for API changes
- Use conventional commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check this README and API docs
- **Issues**: Create an issue on GitHub
- **Email**: support@studychallenge.com
- **Discord**: Join our developer community

## 🚧 Roadmap

### Phase 1: Core Features ✅
- [x] User authentication system
- [x] Group creation and management
- [x] Real-time chat system
- [x] Challenge timer functionality
- [x] Basic exam system

### Phase 2: Enhanced Features 🔄
- [ ] Mobile app (React Native)
- [ ] Push notifications
- [ ] File sharing in chat
- [ ] Advanced analytics
- [ ] Gamification elements

### Phase 3: Advanced Features 📋
- [ ] Video calling integration
- [ ] AI-powered study recommendations
- [ ] Offline mode support
- [ ] Advanced exam proctoring
- [ ] Integration with learning platforms

## 🏆 Acknowledgments

- **Socket.io** for real-time communication
- **MongoDB** for flexible data storage
- **React Native** for cross-platform development
- **Cloudinary** for media management
- **All contributors** who helped build this project

---

<div align="center">
  <strong>Built with ❤️ for better education</strong>
  <br>
  Made by the Study Challenge Hub Team
</div>