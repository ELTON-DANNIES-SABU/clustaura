const mongoose = require('mongoose');
require('dotenv').config();
const Project = require('./models/Project');

const MONGO_URI = process.env.MONGO_URI;
const validRoles = ['owner', 'lead', 'developer', 'Member', 'Project Owner', 'Project Lead'];

async function cleanupRoles() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected successfully.");

        const projects = await Project.find({});
        console.log(`Found ${projects.length} projects to scan.`);

        let totalFixed = 0;

        for (const project of projects) {
            let projectModified = false;
            
            project.members.forEach(member => {
                if (member.role && !validRoles.includes(member.role)) {
                    console.log(`[FIX] Project: ${project.name}, Member User ID: ${member.user}, Invalid Role: "${member.role}" -> Resetting to "Member"`);
                    member.role = 'Member';
                    projectModified = true;
                    totalFixed++;
                }
            });

            if (projectModified) {
                // Use updateOne to bypass validation for the sake of fixing data
                await Project.updateOne(
                    { _id: project._id },
                    { $set: { members: project.members } }
                );
                console.log(`[SUCCESS] Updated project: ${project.name}`);
            }
        }

        console.log(`\nCleanup complete. Total invalid roles fixed: ${totalFixed}`);
        process.exit(0);
    } catch (error) {
        console.error("Cleanup Failed:", error);
        process.exit(1);
    }
}

cleanupRoles();
