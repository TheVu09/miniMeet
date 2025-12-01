# miniMeet - Full-Stack Meeting & Learning Management System

A comprehensive Node.js application built with Express.js, MongoDB, Socket.io, and WebRTC for video meetings and learning management.

## Features

### Meeting Features (Google Meet-like)
- ✅ Meeting creation with unique codes and links
- ✅ Join by link or meeting code
- ✅ Host/Co-host permission system
- ✅ Lock meeting
- ✅ Approve/deny participants
- ✅ WebRTC video/audio calls
- ✅ Enable/disable camera and microphone
- ✅ Switch audio input/output
- ✅ Video quality control
- ✅ Noise cancellation (WebAudio API)
- ✅ Background blur / virtual background (canvas filter)
- ✅ Screen sharing (full screen, window, browser tab, system audio)
- ✅ Spotlight / pin camera
- ✅ Real-time chat (Socket.io)
- ✅ Raise hand
- ✅ Emoji reactions
- ✅ Polls (teacher can create)
- ✅ Q&A module
- ✅ Breakout rooms (Socket.io rooms)
- ✅ Host can mute others
- ✅ Host can disable chat
- ✅ Host can disable screen share
- ✅ Meeting recording (placeholder for server-side)
- ✅ Save recordings to MongoDB GridFS
- ✅ Attendance tracking
- ✅ Meeting summary (AI-ready placeholder)
- ✅ Action items list (AI-ready placeholder)
- ✅ Live captions (Web Speech API)
- ✅ Caption translation (placeholder)

### Learning System Features
- ✅ Classroom management
  - Create class
  - Join class by code
  - Add/remove students
  - Assign teacher
- ✅ Materials
  - Upload PDF, PPT, video
  - View materials inside class
- ✅ Homework
  - Teacher creates assignment
  - Students submit homework (file upload)
  - Teacher reviews & scores
- ✅ Quiz system
  - Multiple choice quiz
  - Auto grading
  - Anti-cheat module (detect tab change, fullscreen, camera monitoring)
- ✅ Forum / Discussion
  - Thread & comments
  - Filter by class / lesson
- ✅ Notifications
  - Upcoming classes
  - Homework deadlines
  - New materials uploaded
- ✅ AI placeholders
  - Auto summary of lessons
  - Auto quiz generation
  - Auto homework evaluation

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose)
- **Real-time**: Socket.io
- **Video/Audio**: WebRTC
- **View Engine**: EJS (Server-Side Rendering)
- **UI Framework**: Bootstrap 5
- **Authentication**: JWT (Cookie-based)
- **File Upload**: Multer
- **File Storage**: MongoDB GridFS

## Project Structure

```
miniMeet/
├── server.js                 # Main server file
├── package.json              # Dependencies
├── .env.example             # Environment variables template
├── src/
│   ├── config/              # Configuration files
│   │   ├── database.js      # MongoDB connection
│   │   └── gridfs.js        # GridFS setup
│   ├── controllers/         # Route controllers
│   │   ├── authController.js
│   │   ├── meetingController.js
│   │   ├── classroomController.js
│   │   ├── homeworkController.js
│   │   ├── quizController.js
│   │   ├── forumController.js
│   │   ├── materialController.js
│   │   └── notificationController.js
│   ├── middleware/          # Custom middleware
│   │   ├── auth.js          # Authentication middleware
│   │   └── roleCheck.js     # Role-based access control
│   ├── models/              # Mongoose models
│   │   ├── User.js
│   │   ├── Meeting.js
│   │   ├── Class.js
│   │   ├── Homework.js
│   │   ├── Quiz.js
│   │   ├── Material.js
│   │   ├── Chat.js
│   │   ├── Poll.js
│   │   ├── Attendance.js
│   │   ├── Forum.js
│   │   ├── Notification.js
│   │   └── Question.js
│   ├── routes/              # Express routes
│   │   ├── authRoutes.js
│   │   ├── meetingRoutes.js
│   │   ├── classroomRoutes.js
│   │   ├── homeworkRoutes.js
│   │   ├── quizRoutes.js
│   │   ├── forumRoutes.js
│   │   ├── materialRoutes.js
│   │   └── notificationRoutes.js
│   ├── utils/               # Utility functions
│   │   ├── socketHandler.js # Socket.io event handlers
│   │   ├── generateToken.js
│   │   └── generateMeetingCode.js
│   ├── views/               # EJS templates
│   │   ├── layout.ejs       # Main layout
│   │   ├── partials/       # Partial templates
│   │   ├── auth/           # Authentication views
│   │   ├── meeting/        # Meeting views
│   │   ├── classroom/      # Classroom views
│   │   ├── homework/       # Homework views
│   │   ├── quiz/           # Quiz views
│   │   ├── forum/          # Forum views
│   │   └── material/       # Material views
│   └── public/             # Static files
│       ├── css/            # Stylesheets
│       └── js/             # Client-side JavaScript
│           ├── meeting.js  # Meeting functionality
│           ├── webrtc.js   # WebRTC utilities
│           ├── polls.js    # Poll functionality
│           ├── qa.js       # Q&A functionality
│           └── breakout.js # Breakout rooms
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Step 1: Clone and Install

```bash
# Navigate to project directory
cd miniMeet

# Install dependencies
npm install
```

### Step 2: Environment Configuration

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and configure:

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/minimeet
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
SESSION_SECRET=your-session-secret-key-change-this
COOKIE_SECRET=your-cookie-secret-key-change-this
```

### Step 3: Start MongoDB

Make sure MongoDB is running:

```bash
# On Windows
net start MongoDB

# On macOS/Linux
sudo systemctl start mongod
# or
mongod
```

### Step 4: Run the Application

```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000`

## Usage

### 1. Register/Login
- Navigate to `/auth/register` to create an account
- Choose your role: Student, Teacher, or Admin
- Login at `/auth/login`

### 2. Create a Meeting
- Click "New Meeting" from the meetings page
- Enter meeting title and description
- Optionally require approval for participants
- Share the meeting code or link with participants

### 3. Join a Meeting
- Enter the meeting code on the join page
- Or use the meeting link directly
- Wait for approval if required

### 4. Classroom Management
- Teachers can create classes
- Students join using class codes
- Upload materials, create homework, and quizzes
- Manage students

### 5. Features in Meeting
- **Video/Audio Controls**: Toggle camera and microphone
- **Screen Share**: Share your screen with participants
- **Chat**: Real-time messaging
- **Raise Hand**: Get host attention
- **Polls**: Host can create polls
- **Q&A**: Ask questions during meeting
- **Breakout Rooms**: Host can create breakout rooms

## API Routes

### Authentication
- `GET /auth/login` - Login page
- `GET /auth/register` - Register page
- `POST /auth/login` - Login
- `POST /auth/register` - Register
- `GET /auth/logout` - Logout

### Meetings
- `GET /meeting` - List meetings
- `GET /meeting/create` - Create meeting form
- `POST /meeting/create` - Create meeting
- `GET /meeting/join` - Join meeting form
- `POST /meeting/join` - Join by code
- `GET /meeting/:id` - Join meeting room
- `GET /meeting/link/:link` - Join by link

### Classrooms
- `GET /classroom` - List classes
- `GET /classroom/create` - Create class form
- `POST /classroom/create` - Create class
- `GET /classroom/join` - Join class form
- `POST /classroom/join` - Join by code
- `GET /classroom/:id` - View class

### Homework
- `GET /homework` - List homework
- `GET /homework/create` - Create homework form
- `POST /homework/create` - Create homework
- `GET /homework/:id` - View homework
- `POST /homework/:id/submit` - Submit homework
- `POST /homework/:id/grade` - Grade homework (teacher)

### Quizzes
- `GET /quiz` - List quizzes
- `GET /quiz/create` - Create quiz form
- `POST /quiz/create` - Create quiz
- `GET /quiz/:id` - Take/view quiz
- `POST /quiz/:id/submit` - Submit quiz

### Forum
- `GET /forum` - List posts
- `GET /forum/create` - Create post form
- `POST /forum/create` - Create post
- `GET /forum/:id` - View post
- `POST /forum/:id/comment` - Add comment
- `POST /forum/:id/like` - Like post

### Materials
- `GET /material` - List materials
- `GET /material/create` - Upload material form
- `POST /material/create` - Upload material
- `GET /material/:id` - View material
- `GET /material/:id/download` - Download material

## Socket.io Events

### Client → Server
- `join-meeting` - Join a meeting room
- `offer` - WebRTC offer
- `answer` - WebRTC answer
- `ice-candidate` - ICE candidate
- `toggle-camera` - Toggle camera
- `toggle-microphone` - Toggle microphone
- `start-screen-share` - Start screen sharing
- `stop-screen-share` - Stop screen sharing
- `chat-message` - Send chat message
- `raise-hand` - Raise hand
- `lower-hand` - Lower hand
- `emoji-reaction` - Send emoji reaction
- `create-poll` - Create poll
- `vote-poll` - Vote on poll
- `ask-question` - Ask question
- `answer-question` - Answer question
- `create-breakout` - Create breakout rooms
- `join-breakout` - Join breakout room
- `leave-breakout` - Leave breakout room
- `leave-meeting` - Leave meeting

### Server → Client
- `user-joined` - User joined meeting
- `user-left` - User left meeting
- `offer` - WebRTC offer
- `answer` - WebRTC answer
- `ice-candidate` - ICE candidate
- `camera-toggled` - Camera toggled
- `microphone-toggled` - Microphone toggled
- `screen-share-started` - Screen share started
- `screen-share-stopped` - Screen share stopped
- `chat-message` - New chat message
- `hand-raised` - Hand raised
- `emoji-reaction` - Emoji reaction
- `poll-created` - Poll created
- `poll-updated` - Poll updated
- `question-asked` - Question asked
- `question-answered` - Question answered

## Role-Based Access Control

### Admin
- Full access to all features
- Manage all classes, meetings, users

### Teacher
- Create and manage classes
- Create meetings, homework, quizzes
- Grade homework and quizzes
- Upload materials
- Moderate forum posts

### Student
- Join classes and meetings
- Submit homework
- Take quizzes
- View materials
- Participate in forum

## Development

### Adding New Features

1. Create model in `src/models/`
2. Create controller in `src/controllers/`
3. Create routes in `src/routes/`
4. Create views in `src/views/`
5. Add client-side JS if needed in `src/public/js/`

### Database Models

All models use Mongoose. Key models:
- **User**: Authentication and user data
- **Meeting**: Meeting sessions
- **Class**: Classroom management
- **Homework**: Assignments
- **Quiz**: Quizzes and tests
- **Material**: Learning materials
- **Chat**: Meeting chat messages
- **Poll**: Meeting polls
- **Question**: Q&A questions
- **Attendance**: Meeting attendance
- **Forum**: Discussion posts
- **Notification**: User notifications

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check `MONGODB_URI` in `.env`
- Verify MongoDB port (default: 27017)

### WebRTC Not Working
- Ensure HTTPS in production (or use localhost for development)
- Check browser permissions for camera/microphone
- Verify STUN server configuration

### Socket.io Connection Issues
- Check server is running
- Verify Socket.io client script is loaded
- Check browser console for errors

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Use a production MongoDB instance
3. Set secure JWT and session secrets
4. Enable HTTPS for WebRTC
5. Configure proper CORS settings
6. Use a process manager (PM2)
7. Set up reverse proxy (Nginx)

## License

ISC

## Support

For issues and questions, please open an issue on the repository.

---

**Built with ❤️ using Node.js, Express.js, MongoDB, Socket.io, and WebRTC**

