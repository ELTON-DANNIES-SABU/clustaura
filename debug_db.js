const mongoose = require('mongoose');
require('dotenv').config();
const TeamRequirement = require('./server/models/TeamRequirement');
const Project = require('./server/models/Project');

async function checkData() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const projects = await Project.find().limit(5);
        console.log('Projects found:', projects.map(p => ({ id: p._id, name: p.name, techs: p.recommendedTechnologies })));

        for (const p of projects) {
            const reqs = await TeamRequirement.find({ project: p._id });
            console.log(`Requirements for ${p.name} (${p._id}):`, reqs.length);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkData();
