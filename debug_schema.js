const mongoose = require('mongoose');
require('dotenv').config({ path: 'server/.env' });
const Project = require('./server/models/Project');

async function debugSchema() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const project = await Project.findOne({ 'invitations.0': { $exists: true } });
        if (project) {
            console.log('Found project with invitation:', project.name);
            const invite = project.invitations[0];
            console.log('Invitation structure:', JSON.stringify(invite.toObject(), null, 2));
        } else {
            console.log('No project with invitations found.');
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debugSchema();
