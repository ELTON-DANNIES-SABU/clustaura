const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config({ path: __dirname + '/.env' }); // Load their env

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const Project = require('./models/Project');
    const Profile = require('./models/Profile');

    const project = await Project.findOne({ name: /Nexus/i });
    let out = '--- CLOUD DIAGNOSTICS ---\n';
    
    if (project) {
        out += `Found Project: ${project.name}\n`;
        out += `Repo URL: ${project.repositoryUrl || 'UNDEFINED'}\n`;
        out += `Token Length: ${project.githubAccessToken ? project.githubAccessToken.length : 0}\n\n`;

        out += `--- MEMBER GITHUB PROFILES ---\n`;
        for (let m of project.members) {
            if (!m.user) continue;
            const prof = await Profile.findOne({ user: m.user });
            out += `User ID ${m.user} Role ${m.role} -> Github: ${prof?.github || 'MISSING'}\n`;
        }
    } else {
        out += 'Could not find Nexus project on Cloud DB!\n';
    }

    fs.writeFileSync('cloud_dump.txt', out);
    process.exit(0);
});
