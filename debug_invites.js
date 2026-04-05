const mongoose = require('mongoose');
require('dotenv').config({ path: 'server/.env' });
const Project = require('./server/models/Project');

async function debugInvites() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const projects = await Project.find({ 'invitations.0': { $exists: true } });
        console.log(`Found ${projects.length} projects with invitations.`);

        projects.forEach(p => {
            console.log(`\nProject: ${p.name}`);
            p.invitations.forEach(inv => {
                console.log(`- Invite for: ${inv.user}`);
                console.log(`  Role: ${inv.role}`);
                console.log(`  Status: ${inv.status}`);
                console.log(`  Description: "${inv.description}"`);
                console.log(`  WorkDetails: "${inv.workDetails}"`);
            });
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debugInvites();
