const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const TeamRequirement = require('./models/TeamRequirement');
const Project = require('./models/Project');

async function checkData() {
    try {
        if (!process.env.MONGO_URI) {
            console.error('MONGO_URI not found in .env');
            process.exit(1);
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const projects = await Project.find().limit(5);
        console.log('--- Projects Summary ---');
        projects.forEach(p => {
            console.log(`ID: ${p._id}, Name: ${p.name}, Key: ${p.key}`);
            console.log(`Techs in Project Model: ${JSON.stringify(p.recommendedTechnologies || [])}`);
        });

        console.log('\n--- Team Requirements Check ---');
        for (const p of projects) {
            const reqs = await TeamRequirement.find({ project: p._id });
            console.log(`Project: ${p.name} | Requirements Count: ${reqs.length}`);
            if (reqs.length > 0) {
                reqs.forEach(r => console.log(`  - ${r.technology} (Required: ${r.requiredDevelopers})`));
            }
        }

        process.exit(0);
    } catch (err) {
        console.error('Debug Script Error:', err);
        process.exit(1);
    }
}

checkData();
