const mongoose = require('mongoose');
const User = require('./models/User');
const Profile = require('./models/Profile');
const Post = require('./models/Post');
const aiMatchingEngine = require('./services/aiMatchingEngine');
require('dotenv').config();

const runTest = async () => {
    try {
        console.log('🚀 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected.');

        // 1. Create Mock Data
        console.log('\n📝 Creating Test Profiles...');
        
        // Use unique emails to avoid conflicts
        const ts = Date.now();
        
        const user1 = new User({
            firstName: 'Alice',
            lastName: 'Frontend',
            email: `alice_${ts}@test.com`,
            password: 'password123',
            role: 'Developer'
        });
        await user1.save();

        const profile1 = new Profile({
            user: user1._id,
            bio: 'Expert in React, Tailwind, and Framer Motion. I love building beautiful and responsive user interfaces.',
            skills: ['React', 'CSS', 'JavaScript', 'Tailwind', 'UI/UX']
        });
        await profile1.save();

        const user2 = new User({
            firstName: 'Bob',
            lastName: 'Designer',
            email: `bob_${ts}@test.com`,
            password: 'password123',
            role: 'Designer'
        });
        await user2.save();

        const profile2 = new Profile({
            user: user2._id,
            bio: 'UI/UX Designer specializing in React component libraries and design systems. Skilled in Figma and frontend styling.',
            skills: ['Figma', 'React', 'CSS', 'Design Systems', 'UX']
        });
        await profile2.save();

        const user3 = new User({
            firstName: 'Charlie',
            lastName: 'Backend',
            email: `charlie_${ts}@test.com`,
            password: 'password123',
            role: 'Developer'
        });
        await user3.save();

        const profile3 = new Profile({
            user: user3._id,
            bio: 'Python developer focused on Django, FastAPI, and PostgreSQL. I build scalable backend architectures.',
            skills: ['Python', 'Django', 'PostgreSQL', 'FastAPI', 'Backend']
        });
        await profile3.save();

        console.log('✅ Mock data created.');

        // 2. Generate Embeddings
        console.log('\n🧠 Generating Embeddings (First run may take a moment to download model)...');
        await aiMatchingEngine.updateUserEmbedding(user1._id);
        await aiMatchingEngine.updateUserEmbedding(user2._id);
        await aiMatchingEngine.updateUserEmbedding(user3._id);
        console.log('✅ Embeddings generated.');

        // 3. Test Similarity
        console.log('\n📊 Comparing Similarities (Alice vs others):');
        
        const matches = await aiMatchingEngine.recommendUsers(user1._id);
        
        for (const match of matches) {
            const explanation = await aiMatchingEngine.explainMatch(
                { name: 'Alice Frontend', skills: profile1.skills, bio: profile1.bio },
                { name: match.name, skills: match.skills, bio: match.bio }
            );
            console.log(`- ${match.name} (${match.role}): ${match.similarityScore} score`);
            console.log(`  AI Reason: "${explanation}"`);
        }

        // 4. Cleanup
        console.log('\n🧹 Cleaning up test data...');
        await User.deleteMany({ email: { $regex: ts.toString() } });
        await Profile.deleteMany({ user: { $in: [user1._id, user2._id, user3._id] } });
        console.log('✅ Done.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Test Failed:', error);
        process.exit(1);
    }
};

runTest();
