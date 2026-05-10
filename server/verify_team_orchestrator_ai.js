const mongoose = require('mongoose');
const { matchUsersToRequirements } = require('./agents/teamMatcherAgent');
const User = require('./models/User');
const Profile = require('./models/Profile');
const UserSkillProfile = require('./models/UserSkillProfile');
const Project = require('./models/Project');
const aiMatchingEngine = require('./services/aiMatchingEngine');
require('dotenv').config();

const verifyMatch = async () => {
    try {
        console.log('🚀 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected.');

        // 1. Create a Test Project
        const ts = Date.now();
        const project = new Project({
            name: `AI Test Project ${ts}`,
            key: `AITEST${ts.toString().slice(-4)}`,
            description: 'A high-performance backend system built with Go and Distributed Systems architecture.',
            owner: new mongoose.Types.ObjectId()
        });
        await project.save();

        // 2. Create Target Candidates
        // Candidate A: Go specialist (Expertise should be detected semantically)
        const userA = new User({ firstName: 'Golang', lastName: 'Master', email: `go_${ts}@test.com`, password: 'password', role: 'Developer' });
        await userA.save();
        const profileA = new Profile({ user: userA._id, bio: 'Senior Backend Engineer with 10 years of experience in Go, Microservices, and Distributed Systems.', skills: ['Go', 'Docker'] });
        await profileA.save();
        const skillProfileA = new UserSkillProfile({ user: userA._id, skills: ['Go', 'Docker'] });
        await skillProfileA.save();

        // Candidate B: Node specialist (Low match for Go requirement)
        const userB = new User({ firstName: 'Node', lastName: 'Dev', email: `node_${ts}@test.com`, password: 'password', role: 'Developer' });
        await userB.save();
        const profileB = new Profile({ user: userB._id, bio: 'Frontend-leaning fullstack developer expert in React and Node.js.', skills: ['Node.js', 'React'] });
        await profileB.save();
        const skillProfileB = new UserSkillProfile({ user: userB._id, skills: ['Node.js', 'React'] });
        await skillProfileB.save();

        console.log('✅ Test data created.');

        // 3. Trigger Ingestion (to ensure embeddings exist)
        console.log('\n🧠 Generating Embeddings...');
        await aiMatchingEngine.updateUserEmbedding(userA._id);
        await aiMatchingEngine.updateUserEmbedding(userB._id);

        // 4. Run Matching
        console.log('\n📊 Running Team Orchestrator Match (Go Backend Requirement)...');
        const techRequirements = [
            { technology: 'GO (BACKEND SERVICES)', requiredDevelopers: 1 }
        ];

        const results = await matchUsersToRequirements(project._id, techRequirements);

        console.log('\n🏆 MATCH RESULTS:');
        results.forEach(res => {
            console.log(`Technology: ${res.technology}`);
            res.suggestedUsers.forEach(cand => {
                console.log(`- ${cand.user.firstName} ${cand.user.lastName}:`);
                console.log(`  Match Score: ${cand.matchScore * 100}%`);
                console.log(`  Reason (Semantic): ${cand.bioScore > 0.6 ? 'STRONG BIOMATCH' : 'WEAK BIOMATCH'}`);
                console.log(`  Skills: ${cand.ontologyScore > 0.5 ? 'MATCHED' : 'NOT MATCHED'}`);
            });
        });

        // 5. Cleanup
        console.log('\n🧹 Cleaning up...');
        await Project.findByIdAndDelete(project._id);
        await User.deleteMany({ email: { $regex: ts.toString() } });
        await Profile.deleteMany({ user: { $in: [userA._id, userB._id] } });
        await UserSkillProfile.deleteMany({ user: { $in: [userA._id, userB._id] } });
        console.log('✅ Done.');

        process.exit(0);
    } catch (err) {
        console.error('❌ Verification Failed:', err);
        process.exit(1);
    }
};

verifyMatch();
