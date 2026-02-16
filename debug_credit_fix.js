const mongoose = require('mongoose');
const User = require('./server/models/User');
const Post = require('./server/models/Post');
const creditService = require('./server/services/creditService');

// Use 127.0.0.1 to avoid localhost IPv6 issues
const MONGO_URI = 'mongodb://127.0.0.1:27017/clustaura';

const runDebug = async () => {
    try {
        console.log("---- DEBUG START ----");
        console.log(`1. Connecting to: ${MONGO_URI}`);
        await mongoose.connect(MONGO_URI);
        console.log("   ✅ Connected to MongoDB");

        // Find a user
        const user = await User.findOne({});
        if (!user) {
            console.error("   ❌ No users found! Create a user first.");
            return;
        }
        console.log(`2. Found User: ${user.email} (ID: ${user._id})`);
        console.log(`   Current Credits: ${user.credits}`);

        // Force initialization (Simulate the fix)
        // Actually, the fix is in the service, so we just call the service.

        // Create a dummy post object (in memory)
        const mockPost = {
            _id: new mongoose.Types.ObjectId(),
            type: 'Project',
            title: 'Debug Fix Verification Post',
            content: 'This is a test post to verify the credit system fix.',
            media: ['http://example.com/img.png']
        };

        console.log("3. Calling creditService.awardPostCreationCredits...");
        const awarded = await creditService.awardPostCreationCredits(user._id, mockPost);
        console.log(`   ✅ Service returned: ${awarded}`);

        // Verify in DB
        const updatedUser = await User.findById(user._id);
        console.log("4. Verification Results:");
        console.log(`   Credits: ${updatedUser.credits} (Expected increase)`);
        console.log(`   Breakdown:`, updatedUser.creditBreakdown);
        console.log(`   Tier: ${updatedUser.starTier}`);

        if (updatedUser.credits > user.credits) {
            console.log("   🎉 SUCCESS! Credits increased.");
        } else {
            console.log("   ❌ FAIL! Credits did not move.");
        }

    } catch (err) {
        console.error("   ❌ EXCEPTION:", err);
    } finally {
        console.log("---- DEBUG END ----");
        await mongoose.connection.close();
        process.exit(0);
    }
};

runDebug();
