const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Manually parse .env to avoid issues
const envPath = path.join(__dirname, 'server', '.env');
const envConfig = fs.readFileSync(envPath, 'utf8');
const mongoUri = envConfig.split('\n').find(line => line.startsWith('MONGO_URI=')).split('=')[1].trim().replace(/['"]/g, '');

const ProjectSchema = new mongoose.Schema({
    invitations: [{
        user: mongoose.Schema.Types.ObjectId,
        role: String,
        description: String,
        workDetails: String,
        status: String
    }]
}, { strict: false });

const Project = mongoose.model('Project', ProjectSchema);

async function debug() {
    try {
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');
        
        const projects = await Project.find({ 'invitations.0': { $exists: true } });
        projects.forEach(p => {
            console.log(`\nProject: ${p._id}`);
            p.invitations.forEach(inv => {
                console.log(`- Invite: ${inv.status} | Role: ${inv.role}`);
                console.log(`  Desc: "${inv.description}"`);
                console.log(`  Work: "${inv.workDetails}"`);
            });
        });
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debug();
