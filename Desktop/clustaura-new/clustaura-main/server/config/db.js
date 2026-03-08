const mongoose = require('mongoose');

const connectDB = async () => {
    const maskedURI = process.env.MONGO_URI
        ? process.env.MONGO_URI.replace(/:([^@]+)@/, ':****@')
        : 'UNDEFINED';
    console.log(`Attempting to connect to MongoDB: ${maskedURI}`);

    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database Name: ${conn.connection.name}`);
};

module.exports = connectDB;

