const express = require('express');
const { ExpressPeerServer } = require('peer');

const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const Message = require('./models/Message');
const Challenge = require('./models/Challenge');
require('dotenv').config();
const syncService = require('./services/syncService');

const app = express();
const server = http.createServer(app);

// Initialize PeerServer
const peerServer = ExpressPeerServer(server, {
    debug: true,
    path: '/'
});

app.use('/peerjs', peerServer);

// Enhanced CORS configuration
const corsOptions = {
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
    optionsSuccessStatus: 200
};

// Initialize Socket.io
const io = new Server(server, {
    cors: {
        origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'],
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Add request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Make io accessible to our router
app.set('io', io);

// Connect to Database with error handling
let isDBConnected = false;
connectDB().then(() => {
    console.log('✅ MongoDB connected successfully');
    isDBConnected = true;
}).catch((error) => {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('⚠️ Server will run without database connection');
    isDBConnected = false;
});

// Sync data to AI Engine once DB is connected
mongoose.connection.once('open', () => {
    console.log('🔗 Database connection open, initiating AI sync...');
    // Add a small delay to ensure models are ready
    setTimeout(() => {
        syncService.syncUsersToAI();
    }, 2000);
});

// Add database health middleware
app.use((req, res, next) => {
    if (!isDBConnected && req.method !== 'GET') {
        return res.status(503).json({
            message: 'Database is not available. Please try again later.'
        });
    }
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/challenges', require('./routes/challengeRoutes'));
app.use('/api/friends', require('./routes/friendRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/news', require('./routes/newsRoutes'));
app.use('/api/search', require('./routes/searchRoutes'));
app.use('/api/workplace', require('./routes/workplaceRoutes'));
app.use('/api/comm', require('./routes/commRoutes'));
app.use('/api/community', require('./routes/communityRoutes'));
app.use('/api/posts', require('./routes/postRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));

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
            // In a real app, update DB here. For now, just acknowledged.
            // We'll trust the client state for now or add a User field later if requested.
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
            // Validate owner
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

            // Simple reaction logic: toggle reaction
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
            // Updated: Use the message model if we were to persist this.
            // For now, just a placeholder as requested in the plan.
        } catch (error) {
            console.error('Error marking read:', error);
        }
    });

    socket.on('send_message', async (data) => {
        try {
            if (!isDBConnected) {
                socket.emit('error', { message: 'Database not available' });
                return;
            }

            const { sender, recipient, content, channelId } = data;

            // In our new schema, we should use CommMessage
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

            // Emit to channel if exists, otherwise to recipient and sender
            if (channelId) {
                io.to(channelId).emit('receive_comm_message', populatedMsg);
            } else if (recipient) {
                io.to(recipient).emit('receive_comm_message', populatedMsg);
                socket.emit('receive_comm_message', populatedMsg); // Emit back to sender
            }

            // Create a notification for the recipient (if not a channel message, or for mentions later)
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

    // --- Group Call Signaling ---
    socket.on('call:join', ({ roomId: rawRoomId, userId, userName, userAvatar }) => {
        const roomId = String(rawRoomId);
        socket.join(roomId);

        const participant = {
            socketId: socket.id,
            userId: String(userId),
            name: userName,
            avatar: userAvatar,
            mediaState: { mic: true, video: true }
        };

        if (!activeCalls.has(roomId)) {
            activeCalls.set(roomId, new Set());
        }

        const participants = activeCalls.get(roomId);
        // Remove old entry if same socket somehow
        participants.forEach(p => { if (p.socketId === socket.id) participants.delete(p); });
        participants.add(participant);

        console.log(`[CALL] User ${userName} joined room ${roomId}`);

        // 1. Send current participants to the new joiner (legacy support)
        socket.emit('call:participants', Array.from(participants));

        // 2. Broadcast FULL authoritative list to EVERYONE in the room
        broadcastParticipants(io, roomId);

        // Update presence
        userPresence.set(String(userId), 'in-call');
        io.emit('presence_update', { userId: String(userId), status: 'in-call' });
    });

    socket.on('call:offer', ({ to, offer, from }) => {
        io.to(to).emit('call:offer', { offer, from });
    });

    socket.on('call:answer', ({ to, answer, from }) => {
        io.to(to).emit('call:answer', { answer, from });
    });

    socket.on('call:ice-candidate', ({ to, candidate, from }) => {
        io.to(to).emit('call:ice-candidate', { candidate, from });
    });

    socket.on('call:media-toggle', ({ roomId: rawRoomId, userId, mediaType, enabled }) => {
        const roomId = String(rawRoomId);
        const participants = activeCalls.get(roomId);
        if (participants) {
            participants.forEach(p => {
                if (p.userId === userId) {
                    p.mediaState[mediaType] = enabled;
                }
            });
            // Broadcast full updated list
            broadcastParticipants(io, roomId);
        }
    });

    socket.on('call:leave', ({ roomId: rawRoomId, userId }) => {
        const roomId = String(rawRoomId);
        socket.leave(roomId);
        const participants = activeCalls.get(roomId);
        if (participants) {
            participants.forEach(p => {
                if (p.socketId === socket.id) participants.delete(p);
            });
            if (participants.size === 0) {
                activeCalls.delete(roomId);
            } else {
                broadcastParticipants(io, roomId);
            }
        }

        socket.to(roomId).emit('call:user-left', { socketId: socket.id, userId });

        userPresence.set(String(userId), 'online');
        io.emit('presence_update', { userId: String(userId), status: 'online' });
        console.log(`[CALL] User ${userId} left room ${roomId}`);
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

            // 1. Broadcast Call Signal to each user's personal room
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

            // 2. Create System Message in Chat
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
    socket.on('disconnect', async () => {
        const userId = socket.user._id.toString();
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
                if (participants.size === 0) activeCalls.delete(roomId);
                else broadcastParticipants(io, roomId);
            }
        });
    });
});

// Test endpoint
app.get('/api/test', (req, res) => {
    console.log('Test endpoint hit');
    res.json({
        message: 'ClustAura API is running',
        timestamp: new Date().toISOString(),
        database: isDBConnected ? 'connected' : 'disconnected',
        port: server.address().port
    });
});

// Add a health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: isDBConnected ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        server: 'ClustAura API Server',
        database: isDBConnected ? 'connected' : 'disconnected',
        port: server.address().port
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

// Handle port already in use - FIXED LOGIC
const startServer = (port) => {
    // Ensure port is a number and within valid range
    port = Number(port);
    if (port < 0 || port > 65535) {
        console.error(`❌ Invalid port number: ${port}. Using default 5000`);
        port = 5000;
    }

    server.listen(port, () => {
        console.log(`✅ Server running on port ${port}`);
        console.log(`🔌 Socket.io running on port ${port}`);
        console.log(`📊 Test endpoint: http://localhost:${port}/api/test`);
        console.log(`🌐 CORS enabled for: localhost:3000, localhost:3001, 127.0.0.1:3000, 127.0.0.1:3001`);
        console.log(`💾 Database status: ${isDBConnected ? '✅ Connected' : '❌ Disconnected'}`);
    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`❌ Port ${port} is busy, trying ${port + 1}...`);

            // Try next port, but limit to reasonable range
            const nextPort = port + 1;
            if (nextPort > 5100) { // Don't go too high
                console.error(`❌ Could not find available port between ${PORT} and 5100`);
                console.log('💡 Try killing processes on these ports or use a different port:');
                console.log('   netstat -ano | findstr :5000');
                console.log('   taskkill /PID [PID] /F');
                process.exit(1);
            }

            startServer(nextPort);
        } else {
            console.error('Server error:', err);
            process.exit(1);
        }
    });
};

// Only start server if this file is run directly
if (require.main === module) {
    // First, try to kill any existing processes on our desired ports
    console.log('Starting ClustAura API Server...');
    console.log(`Attempting to use port ${PORT}...`);

    // Small delay to ensure everything is loaded
    setTimeout(() => {
        startServer(PORT);
    }, 1000);
}

module.exports = app;
