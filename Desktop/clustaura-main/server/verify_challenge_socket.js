const { io } = require('socket.io-client');
const mongoose = require('mongoose');
const User = require('./models/User');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const testSocket = async () => {
    try {
        const mongoUrl = process.env.MONGO_URI || 'mongodb://localhost:27017/clustaura';
        const jwtSecret = process.env.JWT_SECRET || 'secret123';

        console.log('Connecting to:', mongoUrl.split('@')[1] || mongoUrl); // Log without credentials
        await mongoose.connect(mongoUrl);
        console.log('Connected to DB');

        const user = await User.findOne();
        if (!user) {
            console.error('No user found to test with');
            process.exit(1);
        }

        console.log('Testing with User:', user.firstName, 'ID:', user._id);

        const token = jwt.sign({ id: user._id }, jwtSecret);
        console.log('Generated token');

        const socket = io('http://localhost:5000', {
            auth: { token }
        });

        socket.on('connect', () => {
            console.log('Connected to socket server');
            socket.emit('request_challenges');
        });

        socket.on('challenge:initial', (data) => {
            console.log('SUCCESS: Received challenge:initial event');
            console.log('Number of challenges:', data.length);
            if (data.length > 0) {
                console.log('First challenge title:', data[0].title);
                console.log('Author populated:', !!data[0].author?.firstName);
            }
            socket.close();
            process.exit(0);
        });

        socket.on('connect_error', (err) => {
            console.error('Connection error:', err.message);
            process.exit(1);
        });

        setTimeout(() => {
            console.error('Timeout waiting for challenge:initial');
            process.exit(1);
        }, 15000); // Increased timeout for Atlas

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

testSocket();
