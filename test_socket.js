const io = require('socket.io-client');

const socket = io('http://localhost:5000');

console.log('Connecting to socket server...');

socket.on('connect', () => {
    console.log('Successfully connected to Socket.IO server!');
    console.log('Socket ID:', socket.id);
});

socket.on('challenge:initial', (data) => {
    console.log('Received challenge:initial event');
    console.log(`Payload contains ${data.length} challenges.`);
    if (data.length > 0) {
        console.log('Sample challenge title:', data[0].title);
    }
    console.log('Verification Successful! Exiting...');
    socket.close();
    process.exit(0);
});

socket.on('connect_error', (err) => {
    console.error('Connection error:', err.message);
    process.exit(1);
});

// Timeout if no event received
setTimeout(() => {
    console.log('Timeout waiting for challenge:initial event.');
    socket.close();
    process.exit(1);
}, 5000);
