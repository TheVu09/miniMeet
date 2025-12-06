/**
 * Socket.IO Handler
 * Xử lý real-time communication cho meeting:
 * - WebRTC signaling (offer/answer/ice-candidate)
 * - Chat, polls, Q&A
 * - Whiteboard collaboration
 * - Participant management
 */
const Meeting = require('../models/Meeting');
const Chat = require('../models/Chat');
const Poll = require('../models/Poll');
const Question = require('../models/Question');
const Attendance = require('../models/Attendance');

// Lưu trạng thái whiteboard trong memory (không lưu vào DB)
const whiteboardStates = new Map();

const createStrokeId = () => `stroke_${Date.now()}_${Math.random().toString(16).slice(2)}`;

const getWhiteboardState = (meetingId) => {
  if (!whiteboardStates.has(meetingId)) {
    whiteboardStates.set(meetingId, {
      active: false,
      strokes: []
    });
  }
  return whiteboardStates.get(meetingId);
};

const socketHandler = (io, socket) => {
  console.log('User connected:', socket.id);
  socket.canUseWhiteboard = false;

  /**
   * Event: join-meeting
   * User tham gia vào meeting room, gửi danh sách participants hiện tại
   */
  socket.on('join-meeting', async ({ meetingId, userId }) => {
    socket.join(meetingId);
    socket.meetingId = meetingId;
    socket.userId = userId;

    // Lấy tất cả sockets trong room này (bao gồm cả socket hiện tại)
    const socketsInRoom = await io.in(meetingId).fetchSockets();
    const socketIdMap = new Map();
    const allParticipants = [];

    socketsInRoom.forEach(s => {
      if (s.userId) {
        const uid = s.userId.toString();
        socketIdMap.set(uid, s.id);
        allParticipants.push({
          userId: uid,
          socketId: s.id
        });
      }
    });

    // Notify others về user mới (gửi cả userId và socketId)
    socket.to(meetingId).emit('user-joined', { userId, socketId: socket.id });

    // Gửi danh sách tất cả participants hiện có (bao gồm cả những người đang online) cho user mới
    const meeting = await Meeting.findById(meetingId);
    if (meeting) {
      const currentUserId = userId?.toString();
      const isHost = meeting.host.toString() === currentUserId;
      const isCoHost = meeting.coHosts.some(ch => ch.toString() === currentUserId);
      socket.canUseWhiteboard = isHost || isCoHost;

      // Kết hợp participants từ DB và sockets đang online
      const participantsMap = new Map();

      // Thêm từ sockets (ưu tiên vì có socketId)
      allParticipants.forEach(p => {
        participantsMap.set(p.userId, p);
      });

      // Thêm từ DB nếu chưa có
      meeting.participants.forEach(p => {
        const uid = p.user.toString();
        if (!participantsMap.has(uid)) {
          participantsMap.set(uid, {
            userId: uid,
            joinedAt: p.joinedAt,
            socketId: socketIdMap.get(uid) || null
          });
        } else {
          // Cập nhật joinedAt từ DB
          participantsMap.get(uid).joinedAt = p.joinedAt;
        }
      });

      socket.emit('participants-list', {
        participants: Array.from(participantsMap.values())
      });

      // Gửi thông tin về user mới cho tất cả users hiện có (bao gồm cả socketId)
      socket.to(meetingId).emit('new-participant-info', {
        userId,
        socketId: socket.id
      });

      // Gửi trạng thái whiteboard hiện tại cho user mới
      const wbState = getWhiteboardState(meetingId);
      wbState.strokes = wbState.strokes.map(stroke => {
        if (stroke.id) {
          return stroke;
        }
        return { ...stroke, id: createStrokeId() };
      });
      socket.emit('whiteboard-state', {
        active: wbState.active,
        strokes: wbState.strokes
      });
    }
  });

  // WebRTC signaling
  socket.on('offer', ({ meetingId, offer, targetId }) => {
    if (!targetId) {
      return;
    }
    // targetId là socketId của người nhận; dùng io.to để gửi đúng socket
    io.to(targetId).emit('offer', {
      offer,
      from: socket.id,
      fromUserId: socket.userId
    });
  });

  socket.on('answer', ({ meetingId, answer, targetId }) => {
    if (!targetId) {
      return;
    }
    // Đảm bảo trả lời reach đúng peer nhằm hoàn tất handshake
    io.to(targetId).emit('answer', {
      answer,
      from: socket.id,
      fromUserId: socket.userId
    });
  });

  socket.on('ice-candidate', ({ candidate, targetId }) => {
    if (!targetId) {
      return;
    }
    // Gửi ICE candidate trực tiếp tới socket đích
    io.to(targetId).emit('ice-candidate', {
      candidate,
      from: socket.id
    });
  });

  // Media controls
  socket.on('toggle-camera', ({ meetingId, enabled }) => {
    socket.to(meetingId).emit('camera-toggled', { userId: socket.userId, enabled });
  });

  socket.on('toggle-microphone', ({ meetingId, enabled }) => {
    socket.to(meetingId).emit('microphone-toggled', { userId: socket.userId, enabled });
  });

  // Screen sharing
  socket.on('start-screen-share', ({ meetingId, streamId }) => {
    socket.to(meetingId).emit('screen-share-started', { userId: socket.userId, streamId });
  });

  socket.on('stop-screen-share', ({ meetingId }) => {
    socket.to(meetingId).emit('screen-share-stopped', { userId: socket.userId });
  });

  // Whiteboard events (host/co-host only)
  socket.on('whiteboard-toggle', ({ meetingId, active }) => {
    if (!socket.canUseWhiteboard) {
      return;
    }
    const targetMeetingId = meetingId || socket.meetingId;
    const state = getWhiteboardState(targetMeetingId);
    state.active = !!active;
    io.to(targetMeetingId).emit('whiteboard-toggle', { active: state.active });
    if (state.active) {
      io.to(targetMeetingId).emit('whiteboard-state', {
        active: state.active,
        strokes: state.strokes
      });
    }
  });

  socket.on('whiteboard-draw', ({ meetingId, stroke }) => {
    if (!socket.canUseWhiteboard || !stroke) {
      return;
    }
    const targetMeetingId = meetingId || socket.meetingId;
    const state = getWhiteboardState(targetMeetingId);
    if (!stroke.id) {
      stroke.id = createStrokeId();
    }
    state.strokes.push(stroke);
    if (state.strokes.length > 2000) {
      state.strokes = state.strokes.slice(-2000);
    }
    socket.to(targetMeetingId).emit('whiteboard-draw', { stroke });
  });

  socket.on('whiteboard-clear', ({ meetingId }) => {
    if (!socket.canUseWhiteboard) {
      return;
    }
    const targetMeetingId = meetingId || socket.meetingId;
    const state = getWhiteboardState(targetMeetingId);
    state.strokes = [];
    io.to(targetMeetingId).emit('whiteboard-clear');
  });

  socket.on('whiteboard-erase', ({ meetingId, strokeId }) => {
    if (!socket.canUseWhiteboard || !strokeId) {
      return;
    }
    const targetMeetingId = meetingId || socket.meetingId;
    const state = getWhiteboardState(targetMeetingId);
    state.strokes = state.strokes.filter(stroke => stroke.id !== strokeId);
    io.to(targetMeetingId).emit('whiteboard-erase', { strokeId });
  });

  // Chat
  socket.on('chat-message', async ({ meetingId, userId, message }) => {
    const chat = await Chat.create({
      meeting: meetingId,
      user: userId,
      message
    });

    await chat.populate('user', 'name email avatar');

    io.to(meetingId).emit('chat-message', {
      id: chat._id,
      user: chat.user,
      message: chat.message,
      createdAt: chat.createdAt
    });
  });

  // Raise hand
  socket.on('raise-hand', ({ meetingId, userId }) => {
    io.to(meetingId).emit('hand-raised', { userId });
  });

  socket.on('lower-hand', ({ meetingId, userId }) => {
    io.to(meetingId).emit('hand-lowered', { userId });
  });

  // Emoji reactions
  socket.on('emoji-reaction', ({ meetingId, userId, emoji }) => {
    io.to(meetingId).emit('emoji-reaction', { userId, emoji });
  });

  // Polls - Kept for backward compatibility, but business logic moved to pollController
  // These socket events now only handle real-time broadcasting
  socket.on('create-poll', async ({ meetingId, userId, question, options }) => {
    // This is now deprecated - polls should be created via POST /api/meeting/:meetingId/poll
    // Kept for backward compatibility during transition
    console.warn('Deprecated: create-poll socket event. Use REST API instead.');
  });

  socket.on('vote-poll', async ({ pollId, userId, optionIndex }) => {
    // This is now deprecated - votes should be submitted via POST /api/poll/:pollId/vote
    // Kept for backward compatibility during transition
    console.warn('Deprecated: vote-poll socket event. Use REST API instead.');
  });

  socket.on('end-poll', async ({ pollId }) => {
    // This is now deprecated - polls should be ended via PATCH /api/poll/:pollId/end
    // Kept for backward compatibility during transition
    console.warn('Deprecated: end-poll socket event. Use REST API instead.');
  });

  // Q&A - DEPRECATED: Use REST API endpoints in qaRoutes.js instead
  socket.on('ask-question', async ({ meetingId, userId, question }) => {
    console.warn('[DEPRECATED] ask-question socket event - Use POST /api/meeting/:meetingId/question instead');
    const q = await Question.create({
      meeting: meetingId,
      user: userId,
      question
    });

    await q.populate('user', 'name email');

    io.to(meetingId).emit('question-asked', {
      id: q._id,
      user: q.user,
      question: q.question,
      createdAt: q.createdAt
    });
  });

  socket.on('answer-question', async ({ questionId, userId, answer }) => {
    console.warn('[DEPRECATED] answer-question socket event - Use POST /api/question/:questionId/answer instead');
    const q = await Question.findByIdAndUpdate(questionId, {
      answer,
      answeredBy: userId,
      answeredAt: new Date(),
      isAnswered: true
    });

    if (q) {
      io.to(socket.meetingId).emit('question-answered', {
        id: q._id,
        answer,
        answeredBy: userId
      });
    }
  });

  socket.on('upvote-question', async ({ questionId, userId }) => {
    console.warn('[DEPRECATED] upvote-question socket event - Use POST /api/question/:questionId/upvote instead');
    const q = await Question.findById(questionId);
    if (q && !q.upvotes.includes(userId)) {
      q.upvotes.push(userId);
      await q.save();
      io.to(socket.meetingId).emit('question-upvoted', {
        id: q._id,
        upvotes: q.upvotes.length
      });
    }
  });

  // Host controls
  socket.on('mute-user', ({ meetingId, targetUserId }) => {
    socket.to(meetingId).emit('user-muted', { userId: targetUserId });
  });

  socket.on('set-co-host', async ({ meetingId, targetUserId }) => {
    try {
      const meeting = await Meeting.findById(meetingId);
      if (meeting) {
        // Check if user is already co-host
        const isAlreadyCoHost = meeting.coHosts?.some(
          coHost => coHost.toString() === targetUserId
        );

        if (isAlreadyCoHost) {
          // Remove co-host
          meeting.coHosts = meeting.coHosts.filter(
            coHost => coHost.toString() !== targetUserId
          );
          await meeting.save();
          io.to(meetingId).emit('co-host-removed', { userId: targetUserId });
        } else {
          // Add co-host
          if (!meeting.coHosts) meeting.coHosts = [];
          meeting.coHosts.push(targetUserId);
          await meeting.save();
          io.to(meetingId).emit('co-host-added', { userId: targetUserId });
        }
      }
    } catch (error) {
      console.error('Error setting co-host:', error);
    }
  });

  socket.on('remove-participant', async ({ meetingId, targetUserId }) => {
    try {
      // Emit to target user to leave
      io.to(meetingId).emit('participant-removed', { userId: targetUserId });

      // Update meeting participants
      const meeting = await Meeting.findById(meetingId);
      if (meeting) {
        const participant = meeting.participants.find(
          p => p.user.toString() === targetUserId
        );
        if (participant) {
          participant.leftAt = new Date();
          await meeting.save();
        }
      }
    } catch (error) {
      console.error('Error removing participant:', error);
    }
  });

  socket.on('disable-chat', ({ meetingId }) => {
    io.to(meetingId).emit('chat-disabled');
  });

  socket.on('enable-chat', ({ meetingId }) => {
    io.to(meetingId).emit('chat-enabled');
  });

  socket.on('disable-screen-share', ({ meetingId }) => {
    io.to(meetingId).emit('screen-share-disabled');
  });

  socket.on('enable-screen-share', ({ meetingId }) => {
    io.to(meetingId).emit('screen-share-enabled');
  });

  socket.on('spotlight-user', ({ meetingId, userId }) => {
    io.to(meetingId).emit('user-spotlighted', { userId });
  });

  // Leave meeting
  socket.on('leave-meeting', async ({ meetingId, userId }) => {
    if (meetingId && userId) {
      const meeting = await Meeting.findById(meetingId);
      if (meeting) {
        const participant = meeting.participants.find(
          p => p.user.toString() === userId
        );
        if (participant) {
          participant.leftAt = new Date();
          await meeting.save();
        }
      }

      // Update attendance
      const attendance = await Attendance.findOne({
        meeting: meetingId,
        user: userId,
        leftAt: null
      });
      if (attendance) {
        attendance.leftAt = new Date();
        attendance.duration = Math.floor((attendance.leftAt - attendance.joinedAt) / 1000);
        await attendance.save();
      }
    }

    socket.to(meetingId).emit('user-left', { userId, socketId: socket.id });
    socket.leave(meetingId);

    if (!io.sockets.adapter.rooms.get(meetingId)) {
      whiteboardStates.delete(meetingId);
    }
  });

  /**
   * Event: caption-text
   * Gửi phụ đề (caption) đến các user khác trong meeting
   */
  socket.on('caption-text', ({ meetingId, userId, text, timestamp }) => {
    // Broadcast caption đến tất cả users khác trong meeting
    socket.to(meetingId).emit('caption-text', {
      userId,
      text,
      timestamp
    });
  });

  /**
   * Event: request-approval
   * User in pending state requests approval from host
   */
  socket.on('request-approval', async ({ meetingId, user }) => {
    console.log(`📨 request-approval received from ${user.name} for meeting ${meetingId}`);
    try {
      const meeting = await Meeting.findById(meetingId);
      if (meeting) {
        console.log(`✅ Meeting found, broadcasting participant-requesting to room ${meetingId}`);

        // Get all sockets in room
        const socketsInRoom = await io.in(meetingId).fetchSockets();
        console.log(`   Room has ${socketsInRoom.length} socket(s) connected`);

        // Broadcast to all in room EXCEPT sender (host will receive and show modal)
        io.to(meetingId).except(socket.id).emit('participant-requesting', {
          user: user,
          requestedAt: new Date()
        });
        console.log(`✅ Broadcasted participant-requesting for user ${user.name} to ${socketsInRoom.length - 1} other socket(s)`);
      } else {
        console.error(`❌ Meeting ${meetingId} not found`);
      }
    } catch (error) {
      console.error('Error in request-approval:', error);
    }
  });

  /**
   * Event: get-participants
   * Get current participants list with populated user info
   */
  socket.on('get-participants', async ({ meetingId }) => {
    try {
      const meeting = await Meeting.findById(meetingId).populate('participants.user', 'name email');
      if (meeting) {
        socket.emit('participants-list', {
          participants: meeting.participants
        });
      }
    } catch (error) {
      console.error('Error getting participants:', error);
    }
  });

  /**
   * Event: get-pending-participants
   * Get pending participants list (host/co-host only)
   */
  socket.on('get-pending-participants', async ({ meetingId }) => {
    try {
      const meeting = await Meeting.findById(meetingId).populate('pendingParticipants.user', 'name email');
      if (meeting) {
        const currentUserId = socket.userId?.toString();
        const isHost = meeting.host.toString() === currentUserId;
        const isCoHost = meeting.coHosts.some(ch => ch.toString() === currentUserId);

        // Only host and co-hosts can see pending participants
        if (isHost || isCoHost) {
          socket.emit('pending-participants-list', {
            pendingParticipants: meeting.pendingParticipants
          });
        }
      }
    } catch (error) {
      console.error('Error getting pending participants:', error);
    }
  });

  // Disconnect
  socket.on('disconnect', async () => {
    if (socket.meetingId && socket.userId) {
      const meeting = await Meeting.findById(socket.meetingId);
      if (meeting) {
        const participant = meeting.participants.find(
          p => p.user.toString() === socket.userId
        );
        if (participant && !participant.leftAt) {
          participant.leftAt = new Date();
          await meeting.save();
        }
      }

      const attendance = await Attendance.findOne({
        meeting: socket.meetingId,
        user: socket.userId,
        leftAt: null
      });
      if (attendance) {
        attendance.leftAt = new Date();
        attendance.duration = Math.floor((attendance.leftAt - attendance.joinedAt) / 1000);
        await attendance.save();
      }

      socket.to(socket.meetingId).emit('user-left', {
        userId: socket.userId,
        socketId: socket.id
      });
    }

    if (socket.meetingId && !io.sockets.adapter.rooms.get(socket.meetingId)) {
      whiteboardStates.delete(socket.meetingId);
    }
    console.log('User disconnected:', socket.id);
  });
};

module.exports = socketHandler;

