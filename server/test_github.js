const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/clustaura').then(async () => {
    const Project = require('./models/Project');
    const Profile = require('./models/Profile');
    const User = require('./models/User');

    console.log("--- PROFILES WITH GITHUB USERNAME ---");
    const profiles = await Profile.find({ github: { $exists: true, $ne: '' } }).populate('user');
    for (let p of profiles) {
        console.log(`- ${p.user?.email || 'Unknown'}: github.com/${p.github}`);
    }

    console.log("\n--- RECENT PROJECTS WITH TOKENS ---");
    const projects = await Project.find({ githubAccessToken: { $exists: true, $ne: '' } }).sort({ createdAt: -1 }).limit(3);
    for (let p of projects) {
        console.log(`Project: ${p.name} | Repo: ${p.repositoryUrl} | TokenLength: ${p.githubAccessToken ? p.githubAccessToken.length : 0}`);
        for (let m of p.members) {
            if (!m.user) continue;
            const u = await User.findById(m.user);
            const prof = await Profile.findOne({ user: m.user });
            console.log(`  > Member: ${u?.email} | Role: ${m.role} | GitHub Configured: ${prof?.github || 'NONE'}`);
        }
    }
    process.exit(0);
});
