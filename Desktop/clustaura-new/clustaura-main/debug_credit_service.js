require('dotenv').config({ path: './server/.env' }); // Adjust path if needed
const mongoose = require('mongoose');
const User = require('./server/models/User');
const Post = require('./server/models/Post');
const creditService = require('./server/services/creditService');

// Use a hardcoded string if .env fails or provide instruction to user
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/clustaura"; // Default fallback

const runDebug = async () => {
    try {
        console.log("1. Connecting to DB...", MONGO_URI);
        await mongoose.connect(MONGO_URI);
        console.log("   Connected.");

        // Find a test user (or the first user)
        const user = await User.findOne({});
        if (!user) {
            console.error("No users found in DB to test with.");
            return;
        }
        console.log(`2. Testing with user: ${user.firstName} (${user._id})`);
        console.log(`   Initial Credits: ${user.credits}`);
        console.log(`   Initial Breakdown:`, user.creditBreakdown);

        // Simulate Post Creation
        const mockPost = {
            _id: new mongoose.Types.ObjectId(),
            content: "This is a long enough post to get some credit. ".repeat(20), // > 500 chars
            media: ['http://example.com/img.jpg'],
            type: 'Project',
            title: 'Debug Project Post'
        };

        console.log("3. Calling awardPostCreationCredits...");
        const awarded = await creditService.awardPostCreationCredits(user._id, mockPost);
        console.log(`   Award Function Returned: ${awarded}`);

        // Re-fetch user to see changes
        const updatedUser = await User.findById(user._id);
        console.log(`4. Post-Update Check`);
        console.log(`   New Credits: ${updatedUser.credits}`);
        console.log(`   New Breakdown:`, updatedUser.creditBreakdown);
        console.log(`   Tier: ${updatedUser.starTier}, Stars: ${updatedUser.creditStars}`);

        if (updatedUser.credits > user.credits) {
            console.log("✅ SUCCESS: Credits increased.");
        } else {
            console.log("❌ FAILURE: Credits did not increase.");
        }

    } catch (err) {
        console.error("❌ ERROR:", err);
    } finally {
        await mongoose.connection.close();
    }
};

runDebug();
