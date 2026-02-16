const mongoose = require('mongoose');
require('dotenv').config();

const testDB = async () => {
    try {
        console.log('Attempting to connect to MongoDB...');
        const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
        
        if (!uri) {
            console.error('❌ No MongoDB URI found in environment variables');
            console.log('Make sure you have either MONGO_URI or MONGODB_URI in your .env file');
            process.exit(1);
        }
        
        console.log(`Connection URI: ${uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`);

        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000
        });
        
        console.log('✅ MongoDB Connected Successfully');
        console.log(`📊 Database Name: ${mongoose.connection.name}`);

        // List collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('📁 Collections:', collections.map(c => c.name));

        // Try to access User model
        try {
            const User = require('./models/User');
            
            // Count users
            const userCount = await User.countDocuments();
            console.log(`👥 Total users in database: ${userCount}`);
            
            // List first 5 users
            if (userCount > 0) {
                const users = await User.find().limit(5).select('email firstName lastName');
                console.log('📝 Sample users:');
                users.forEach(user => {
                    console.log(`  - ${user.email} (${user.firstName} ${user.lastName})`);
                });
            }
            
        } catch (error) {
            console.log('⚠️ Could not load User model:', error.message);
        }

    } catch (error) {
        console.error('❌ Database Error:', error.message);
        
        // More specific error messages
        if (error.name === 'MongoParseError') {
            console.error('The MongoDB URI format is incorrect');
        } else if (error.name === 'MongoNetworkError') {
            console.error('Network error - check your internet connection and MongoDB Atlas IP whitelist');
        } else if (error.message.includes('bad auth')) {
            console.error('Authentication failed - check username and password');
        } else if (error.message.includes('ECONNREFUSED')) {
            console.error('Connection refused - check if MongoDB service is running');
        }
    } finally {
        if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
            console.log('🔌 Disconnected from MongoDB');
        }
        process.exit();
    }
};

testDB();