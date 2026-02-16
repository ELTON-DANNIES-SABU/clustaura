const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const maskedURI = process.env.MONGO_URI ? process.env.MONGO_URI.replace(/:([^@]+)@/, ':****@') : 'UNDEFINED';
        console.log(`Attempting to connect to MongoDB: ${maskedURI}`);
        const conn = await mongoose.connect(process.env.MONGO_URI);

        console.log(`MongoDB Connected: ${conn.connection.host}`);
        console.log(`Database Name: ${conn.connection.name}`);
        console.log(`Port: ${conn.connection.port}`);
    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        console.warn('The server will continue running, but database features will be unavailable.');
    }
};

module.exports = connectDB;
