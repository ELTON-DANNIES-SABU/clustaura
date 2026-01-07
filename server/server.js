
const express = require('express');
const cors = require('cors');
const http = require('http'); // Import http
const { Server } = require('socket.io'); // Import Server from socket.io
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const Message = require('./models/Message'); // Import Message model
const Challenge = require('./models/Challenge'); // Import Challenge model
require('dotenv').config();

const app = express();
const server = http.createServer(app); // Create HTTP server

// Connect to Database
connectDB();

// Enhanced CORS configuration
const corsOptions = {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
    optionsSuccessStatus: 200
};

// Initialize Socket.io
const io = new Server(server, {
    cors: {
        origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
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

// Socket.io connection handling
io.on('connection', async (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join_room', (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined their room`);
    });

    socket.on('send_message', async (data) => {
        try {
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
    try {
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

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Test endpoint
app.get('/api/test', (req, res) => {
    console.log('Test endpoint hit');
    res.json({
        message: 'ClustAura API is running',
        timestamp: new Date().toISOString()
    });
});

// Add a health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        server: 'ClustAura API Server'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

// Only start server if this file is run directly
if (require.main === module) {
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Socket.io running on port ${PORT}`);
        console.log(`Test endpoint: http://localhost:${PORT}/api/test`);
    });
}

module.exports = app;
