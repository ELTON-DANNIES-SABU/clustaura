const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/clustaura');

        console.log(`MongoDB Connected: ${conn.connection.host}`);
        console.log(`Database Name: ${conn.connection.name}`);
        console.log(`Port: ${conn.connection.port}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        console.error('Full error details:', error);
        process.exit(1);
    }
};

module.exports = connectDB;
