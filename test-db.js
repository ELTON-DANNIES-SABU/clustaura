const mongoose = require('mongoose');
const User = require('./server/models/User'); // Adjust path based on where we run this
require('dotenv').config({ path: './server/.env' });

const testDB = async () => {
    try {
        console.log('Attempting to connect to MongoDB...');
        const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/clustaura';
        console.log(`Connection URI: ${uri}`);

        await mongoose.connect(uri);
        console.log('MongoDB Connected Successfully');

        // Check database name
        console.log(`Database Name: ${mongoose.connection.name}`);

        // List collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));

        // Create a test user
        console.log('Attempting to create test user...');
        const testUser = {
            firstName: 'Test',
            lastName: 'Script',
            email: `testscript${Date.now()}@example.com`,
            password: 'password123'
        };

        const createdUser = await User.create(testUser);
        console.log('Test user created successfully:', createdUser.email);

        // Verify user exists
        const foundUser = await User.findOne({ email: testUser.email });
        if (foundUser) {
            console.log('Verification successful: User found in DB');
        } else {
            console.error('Verification failed: User NOT found in DB');
        }

    } catch (error) {
        console.error('Database Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

testDB();
