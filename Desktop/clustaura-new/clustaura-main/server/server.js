require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

// --- Models (eagerly required so socket handlers can use them) ---
const Challenge = require('./models/Challenge');

// --- Express App Setup ---
const app = express();

app.use(cors({
    origin: (origin, callback) => {
        // Allow all origins in development (needed for cross-device LAN access)
        callback(null, true);
    },
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- API Routes ---
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/posts', require('./routes/postRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/friends', require('./routes/friendRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/community', require('./routes/communityRoutes'));
app.use('/api/search', require('./routes/searchRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/comm', require('./routes/commRoutes'));
app.use('/api/teams', require('./routes/teamRoutes'));
app.use('/api/workplace', require('./routes/workplaceRoutes'));
app.use('/api/challenges', require('./routes/challengeRoutes'));
app.use('/api/assessment', require('./routes/assessmentRoutes'));
app.use('/api/credits', require('./routes/creditRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/professional', require('./routes/professionalRoutes'));
app.use('/api/news', require('./routes/newsRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/ai-guide', require('./routes/aiGuideRoutes'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// 404 fallback
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// --- HTTP Server & Socket.IO ---
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: (origin, callback) => {
            // Allow all origins in development (needed for cross-device LAN access)
            callback(null, true);
        },
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// --- Database Connection & Server Start ---
let isDBConnected = false;

const init = async () => {
    try {
        await connectDB();
        isDBConnected = true;
        console.log('✅ MongoDB connected');
    } catch (err) {
        console.error('❌ MongoDB connection failed:', err.message);
        console.warn('Server will start but DB features unavailable.');
    }

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
};

init();

// --- Socket.io Middleware & Presence ---
const userSockets = new Map(); // userId -> Set of socketIds
const userPresence = new Map(); // userId -> status ('online', 'away', 'busy', 'in-call')

// --- Group Call Signaling ---
const activeCalls = new Map(); // roomId -> Set of participants { socketId, userId, name, avatar, mediaState }

const broadcastParticipants = (io, roomIdOrObj) => {
    const roomId = String(roomIdOrObj);
    const participants = activeCalls.get(roomId);
    if (participants) {
        const list = Array.from(participants);
        console.log(`[CALL] Broadcasting ${list.length} participants to room ${roomId}`);
        io.to(roomId).emit('call:participants-update', { roomId, participants: list });

        // Also emit legacy event for backward compatibility
        io.to(roomId).emit('call:participants', list);
    }
};

io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token || socket.handshake.headers['authorization']?.split(' ')[1];
        if (!token) {
            return next(new Error('Authentication error: No token provided'));
        }

        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');

        const User = require('./models/User');
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return next(new Error('Authentication error: User not found'));
        }

        socket.user = user;
        next();
    } catch (err) {
        console.error('Socket Auth Error:', err.message);
        next(new Error('Authentication error: Invalid token'));
    }
});

// Socket.io connection handling
io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();
    console.log(`User connected: ${socket.user.firstName} (${socket.id})`);

    // Track user socket
    if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socket.id);

    // Set initial presence if first socket
    if (!userPresence.has(userId)) {
        userPresence.set(userId, 'online');
    }

    // Join personal room
    socket.join(userId);

    // Broadcast current presence to all
    io.emit('presence_update', {
        userId,
        status: userPresence.get(userId)
    });

    // Send all current presence to the new user
    socket.emit('presence_sync', Array.from(userPresence.entries()).map(([uid, status]) => ({ userId: uid, status })));

    // --- Challenges Handling ---
    socket.on('request_challenges', async () => {
        try {
            const challenges = await Challenge.find()
                .populate('author', 'firstName lastName email')
                .populate('comments.user', 'firstName lastName')
                .sort({ createdAt: -1 });
            socket.emit('challenge:initial', challenges);
            console.log(`[CHALLENGE] Sent ${challenges.length} challenges to user ${socket.user.firstName}`);
        } catch (error) {
            console.error('Error fetching challenges for socket:', error);
        }
    });

    // --- Typing Indicators ---
    socket.on('typing', ({ roomId, user }) => {
        socket.to(roomId).emit('display_typing', { user, roomId });
    });

    socket.on('stop_typing', ({ roomId, user }) => {
        socket.to(roomId).emit('hide_typing', { user, roomId });
    });

    // --- Read Receipts ---
    socket.on('mark_channel_read', async ({ channelId, userId }) => {
        try {
            // In a real app, update DB here
        } catch (error) {
            console.error('Error marking read:', error);
        }
    });

    // --- Channel Handling ---
    socket.on('join_channel', (channelId) => {
        socket.join(channelId);
        console.log(`User ${socket.user.firstName} joined channel: ${channelId}`);
    });

    socket.on('leave_channel', (channelId) => {
        socket.leave(channelId);
        console.log(`User ${socket.user.firstName} left channel: ${channelId}`);
    });

    // --- Presence Handling ---
    socket.on('update_presence', (status) => {
        userPresence.set(userId, status);
        io.emit('presence_update', { userId, status });
        console.log(`Presence updated for ${socket.user.firstName}: ${status}`);
    });

    // --- Message Interactions ---
    socket.on('message:edit', async ({ messageId, content }) => {
        try {
            const CommMessage = require('./models/CommMessage');
            const message = await CommMessage.findById(messageId);

            if (!message) return;
            if (message.sender.toString() !== userId) return;

            message.content = content;
            message.isEdited = true;
            await message.save();

            const target = message.channelId ? message.channelId.toString() : message.recipient.toString();
            io.to(target).emit('message:updated', message);
            if (!message.channelId) socket.emit('message:updated', message);
        } catch (error) {
            console.error('Error editing message:', error);
        }
    });

    socket.on('message:delete', async ({ messageId }) => {
        try {
            const CommMessage = require('./models/CommMessage');
            const message = await CommMessage.findById(messageId);

            if (!message) return;
            if (message.sender.toString() !== userId) return;

            await CommMessage.findByIdAndDelete(messageId);

            const target = message.channelId ? message.channelId.toString() : message.recipient.toString();
            io.to(target).emit('message:deleted', messageId);
            if (!message.channelId) socket.emit('message:deleted', messageId);
        } catch (error) {
            console.error('Error deleting message:', error);
        }
    });

    socket.on('message:reaction', async ({ messageId, emoji }) => {
        try {
            const CommMessage = require('./models/CommMessage');
            const message = await CommMessage.findById(messageId);

            if (!message) return;

            const existingIndex = message.reactions.findIndex(r => r.user.toString() === userId && r.emoji === emoji);

            if (existingIndex > -1) {
                message.reactions.splice(existingIndex, 1);
            } else {
                message.reactions.push({ user: userId, emoji });
            }

            await message.save();
            const populatedMsg = await CommMessage.findById(messageId).populate('sender', 'firstName lastName email');

            const target = message.channelId ? message.channelId.toString() : message.recipient.toString();
            io.to(target).emit('message:updated', populatedMsg);
            if (!message.channelId) socket.emit('message:updated', populatedMsg);
        } catch (error) {
            console.error('Error reacting to message:', error);
        }
    });

    socket.on('send_message', async (data) => {
        try {
            if (!isDBConnected) {
                socket.emit('error', { message: 'Database not available' });
                return;
            }

            const { sender, recipient, content, channelId } = data;

            const CommMessage = require('./models/CommMessage');

            const msgData = {
                sender: sender || socket.user._id,
                content,
                type: 'text'
            };

            if (channelId) msgData.channelId = channelId;
            else if (recipient) msgData.recipient = recipient;

            const message = await CommMessage.create(msgData);
            const populatedMsg = await CommMessage.findById(message._id).populate('sender', 'firstName lastName email');

            if (channelId) {
                io.to(channelId).emit('receive_comm_message', populatedMsg);
            } else if (recipient) {
                io.to(recipient).emit('receive_comm_message', populatedMsg);
                socket.emit('receive_comm_message', populatedMsg);
            }

            if (recipient) {
                const Notification = require('./models/Notification');
                const notification = await Notification.create({
                    recipient: recipient,
                    sender: socket.user._id,
                    type: 'message',
                    content: `New message from ${socket.user.firstName} ${socket.user.lastName}`
                });
                io.to(recipient).emit('receive_notification', notification);
            }

        } catch (error) {
            console.error('Error sending message:', error);
            socket.emit('error', { message: 'Failed to send message' });
        }
    });

    // --- FIXED: Group Call Signaling ---
    socket.on('call:join', ({ roomId: rawRoomId, userId, userName, userAvatar }) => {
        const roomId = String(rawRoomId);
        socket.join(roomId);

        const participant = {
            socketId: socket.id,
            userId: String(userId),
            name: userName,
            avatar: userAvatar,
            mediaState: { mic: true, video: true, screen: false }
        };

        if (!activeCalls.has(roomId)) {
            activeCalls.set(roomId, new Set());
        }

        const participants = activeCalls.get(roomId);

        // Remove any existing entries for this user
        participants.forEach(p => {
            if (p.userId === String(userId) || p.socketId === socket.id) {
                participants.delete(p);
            }
        });

        participants.add(participant);

        console.log(`[CALL] User ${userName} (${socket.id}) joined room ${roomId}`);

        // Broadcast FULL authoritative list to EVERYONE in the room
        broadcastParticipants(io, roomId);

        // Update presence
        userPresence.set(String(userId), 'in-call');
        io.emit('presence_update', { userId: String(userId), status: 'in-call' });
    });

    socket.on('call:offer', ({ to, offer, from }) => {
        console.log(`[Signaling] Forwarding offer from ${from.socketId} to ${to}`);
        io.to(to).emit('call:offer', { offer, from });
    });

    socket.on('call:answer', ({ to, answer, from }) => {
        console.log(`[Signaling] Forwarding answer from ${from.socketId} to ${to}`);
        io.to(to).emit('call:answer', { answer, from });
    });

    socket.on('call:ice-candidate', ({ to, candidate, from }) => {
        console.log(`[Signaling] Forwarding ICE candidate from ${from.socketId} to ${to}`);
        io.to(to).emit('call:ice-candidate', { candidate, from });
    });

    socket.on('call:media-toggle', ({ roomId: rawRoomId, userId, mediaType, enabled }) => {
        const roomId = String(rawRoomId);
        const participants = activeCalls.get(roomId);

        if (participants) {
            let updated = false;
            participants.forEach(p => {
                if (p.userId === userId) {
                    p.mediaState[mediaType] = enabled;
                    updated = true;
                }
            });

            if (updated) {
                console.log(`[CALL] Media update: ${userId} ${mediaType}=${enabled}`);
                broadcastParticipants(io, roomId);
            }
        }
    });

    socket.on('call:leave', ({ roomId: rawRoomId, userId }) => {
        const roomId = String(rawRoomId);
        socket.leave(roomId);

        const participants = activeCalls.get(roomId);
        if (participants) {
            let removed = false;
            participants.forEach(p => {
                if (p.userId === userId || p.socketId === socket.id) {
                    participants.delete(p);
                    removed = true;
                }
            });

            if (removed) {
                console.log(`[CALL] User ${userId} left room ${roomId}`);

                if (participants.size === 0) {
                    activeCalls.delete(roomId);
                } else {
                    broadcastParticipants(io, roomId);
                }

                socket.to(roomId).emit('call:user-left', { socketId: socket.id, userId });
            }
        }

        userPresence.set(String(userId), 'online');
        io.emit('presence_update', { userId: String(userId), status: 'online' });
    });

    // Global: Start a call (notify channel/user)
    socket.on('start_call', async ({ roomId, type, participants, userId }) => {
        try {
            let usersToNotify = [];
            const initiatorId = userId || socket.user._id.toString();

            // Create Call Session
            const CallSession = require('./models/CallSession');
            const session = await CallSession.create({
                roomId,
                initiator: initiatorId,
                callType: type || 'video',
                status: 'active',
                participants: [initiatorId]
            });

            if (participants && participants.length > 0) {
                usersToNotify = participants;
            } else {
                const CommChannel = require('./models/CommChannel');
                const CommTeam = require('./models/CommTeam');

                const channel = await CommChannel.findById(roomId);
                if (channel) {
                    const team = await CommTeam.findById(channel.teamId).populate('members');
                    if (team) {
                        usersToNotify = team.members.map(m => m._id.toString());
                    }
                    session.channelId = channel._id;
                    await session.save();
                }
            }

            console.log(`Starting call in room ${roomId}, notifying ${usersToNotify.length} users. Initiator: ${socket.user.firstName}`);

            // Broadcast Call Signal to each user's personal room
            usersToNotify.forEach(uid => {
                if (uid !== initiatorId) {
                    io.to(uid).emit('incoming_call', {
                        roomId,
                        type,
                        initiatorId,
                        initiatorName: `${socket.user.firstName} ${socket.user.lastName}`,
                        participants
                    });
                }
            });

            // Create System Message in Chat
            const CommMessage = require('./models/CommMessage');
            const systemMsgData = {
                sender: initiatorId,
                content: "started a call",
                type: "call",
                metadata: {
                    roomId,
                    callType: type,
                    initiatorId: initiatorId
                }
            };

            if (participants && participants.length > 0) {
                const recipient = participants.find(p => p !== initiatorId);
                if (recipient) systemMsgData.recipient = recipient;
            } else {
                systemMsgData.channelId = roomId;
            }

            const systemMsg = await CommMessage.create(systemMsgData);
            const populatedMsg = await CommMessage.findById(systemMsg._id).populate('sender', 'firstName lastName email');

            if (systemMsgData.channelId) {
                io.to(systemMsgData.channelId.toString()).emit('receive_comm_message', populatedMsg);
            } else if (systemMsgData.recipient) {
                io.to(systemMsgData.recipient.toString()).emit('receive_comm_message', populatedMsg);
                socket.emit('receive_comm_message', populatedMsg);
            }

        } catch (error) {
            console.error('Error starting call:', error);
        }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        const userId = socket.user._id.toString();
        console.log(`User disconnected: ${socket.user.firstName} (${socket.id})`);

        // Remove from socket tracking
        const userSocketSet = userSockets.get(userId);
        if (userSocketSet) {
            userSocketSet.delete(socket.id);
            if (userSocketSet.size === 0) {
                userSockets.delete(userId);

                // Update presence if last socket
                userPresence.set(userId, 'offline');
                io.emit('presence_update', { userId, status: 'offline' });
            }
        }

        // Cleanup from calls
        activeCalls.forEach((participants, roomId) => {
            let changed = false;
            participants.forEach(p => {
                if (p.socketId === socket.id) {
                    participants.delete(p);
                    changed = true;
                    socket.to(roomId).emit('call:user-left', { socketId: socket.id, userId });
                }
            });

            if (changed) {
                if (participants.size === 0) {
                    activeCalls.delete(roomId);
                } else {
                    broadcastParticipants(io, roomId);
                }
            }
        });
    });
});

// Server start is handled by init() above