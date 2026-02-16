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

// Socket.io connection handling
io.on('connection', async (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join_room', (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined their room`);
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
            // In a real app, update DB here. For now, just acknowledged.
            // We'll trust the client state for now or add a User field later if requested.
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

            const { sender, recipient, content } = data;

            // Save to database
            const message = await Message.create({
                sender,
                recipient,
                content
            });

            // Emit to recipient (in their room)
            io.to(recipient).emit('receive_message', message);

            // Emit back to sender
            io.to(sender).emit('receive_message', message);

            // Create a persistent notification record
            const User = require('./models/User');
            const senderUser = await User.findById(sender);

            const Notification = require('./models/Notification');
            const notification = await Notification.create({
                recipient: recipient,
                sender: sender,
                type: 'message',
                content: `New message from ${senderUser.firstName} ${senderUser.lastName}`
            });

            // Emit the notification for the bell icon
            io.to(recipient).emit('receive_notification', notification);

        } catch (error) {
            console.error('Error sending message:', error);
        }
    });

    // Send last 50 challenges on connect
    socket.on('request_challenges', async () => {
        try {
            if (!isDBConnected) {
                socket.emit('challenge:error', { message: 'Database not available' });
                return;
            }

            const Challenge = require('./models/Challenge');
            const challenges = await Challenge.find()
                .populate('author', 'firstName lastName email')
                .populate('comments.user', 'firstName lastName')
                .sort({ createdAt: -1 })
                .limit(50);

            socket.emit('challenge:initial', challenges);
        } catch (error) {
            console.error('Error sending initial challenges:', error);
        }
    });


    // --- Group Call & Global Signaling Logic ---

    // User joins a "Call Room"
    socket.on('join_call_room', ({ roomId, userId }) => {
        socket.join(roomId);
        socket.userId = userId; // Store userId on socket for retrieval
        console.log(`User ${userId} (${socket.id}) joined call room: ${roomId}`);

        // Notify others in room that a user joined (for signaling + presence)
        socket.to(roomId).emit('call_user_joined', {
            signal: null,
            callerId: socket.id,
            userId: userId
        });

        // Get list of all users in this room (excluding self)
        const clients = io.sockets.adapter.rooms.get(roomId);
        const usersInRoom = [];

        if (clients) {
            clients.forEach(socketId => {
                if (socketId !== socket.id) {
                    const clientSocket = io.sockets.sockets.get(socketId);
                    if (clientSocket) {
                        usersInRoom.push({
                            socketId: socketId,
                            userId: clientSocket.userId
                        });
                    }
                }
            });
        }

        socket.emit('all_users_in_call', usersInRoom);
    });

    socket.on('sending_signal', payload => {
        io.to(payload.userToSignal).emit('user_joined_signal', {
            signal: payload.signal,
            callerId: payload.callerId
        });
    });

    socket.on('returning_signal', payload => {
        io.to(payload.callerId).emit('receiving_returned_signal', {
            signal: payload.signal,
            id: socket.id
        });
    });

    // Global: Start a call (notify channel/user)
    socket.on('start_call', async ({ roomId, type, participants, userId }) => {
        try {
            // Determine if it's a Channel or DM
            // For now, if participants are provided, it's a DM, otherwise it's a channel call where we need to fetch members.

            let usersToNotify = [];
            const initiatorId = userId || socket.id; // Prefer userId from client, fallback to socket

            if (participants && participants.length > 0) {
                // Direct Message Call
                usersToNotify = participants;
            } else {
                // Channel Call - Fetch members from DB
                // We need to find the Team that owns this channel to get members
                // First, find the channel to get teamId
                // NOTE: In this schema, we might need to look up. 
                // Assuming roomId is channelId.
                const CommChannel = require('./models/CommChannel');
                const CommTeam = require('./models/CommTeam');

                const channel = await CommChannel.findById(roomId);
                if (channel) {
                    const team = await CommTeam.findById(channel.teamId).populate('members');
                    if (team) {
                        usersToNotify = team.members.map(m => m._id.toString());
                    }
                }
            }

            const User = require('./models/User');
            let initiatorName = 'Someone';
            if (userId) {
                const initiator = await User.findById(userId);
                if (initiator) initiatorName = `${initiator.firstName} ${initiator.lastName}`;
            }

            console.log(`Starting call in room ${roomId}, notifying ${usersToNotify.length} users. Initiator: ${initiatorName}`);

            // 1. Broadcast Call Signal to each user's personal room (Notification Popup)
            usersToNotify.forEach(uid => {
                if (uid !== initiatorId && uid !== socket.id) { // Don't ring the caller
                    io.to(uid).emit('incoming_call', {
                        roomId,
                        type,
                        initiatorId,
                        initiatorName,
                        participants
                    });
                }
            });

            // 2. Create System Message in Chat (Teams-style)
            if (userId) { // Only if we have a valid User ID to link sender
                try {
                    const CommMessage = require('./models/CommMessage');
                    const systemMsgData = {
                        sender: userId,
                        content: "started a call",
                        type: "call",
                        metadata: {
                            roomId,
                            callType: type,
                            initiatorId: userId
                        }
                    };

                    if (participants && participants.length > 0) {
                        // DM Message
                        // DM needs recipient. If group DM exists, handled differently. 
                        // For 1:1 DM:
                        const recipient = participants.find(p => p !== userId);
                        if (recipient) systemMsgData.recipient = recipient;
                    } else {
                        // Channel Message
                        systemMsgData.channelId = roomId;
                    }

                    const systemMsg = await CommMessage.create(systemMsgData);
                    const populatedMsg = await CommMessage.findById(systemMsg._id).populate('sender', 'firstName lastName email');

                    // Broadcast message to room (chat update)
                    if (systemMsgData.channelId) {
                        io.to(systemMsgData.channelId.toString()).emit('receive_comm_message', populatedMsg);
                    } else if (systemMsgData.recipient) {
                        io.to(systemMsgData.recipient.toString()).emit('receive_comm_message', populatedMsg);
                        io.to(userId).emit('receive_comm_message', populatedMsg);
                    }

                } catch (msgErr) {
                    console.error("Failed to create system call message:", msgErr);
                }
            }

        } catch (error) {
            console.error('Error starting call:', error);
        }
    });

    socket.on('leave_call_room', ({ roomId }) => {
        socket.leave(roomId);
        if (socket.userId) {
            socket.to(roomId).emit('user_left_call', socket.userId);
        }
    });

    // Handle disconnect during call
    socket.on('disconnecting', () => {
        const rooms = [...socket.rooms];
        rooms.forEach((roomId) => {
            if (socket.userId) {
                socket.to(roomId).emit('user_left_call', socket.userId);
            } else {
                socket.to(roomId).emit('user_left_call', socket.id);
            }
        });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
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