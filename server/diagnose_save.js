const mongoose = require('mongoose');
require('dotenv').config();

const Project = require('./models/Project');
const Ticket = require('./models/Ticket');
const TeamRequirement = require('./models/TeamRequirement');
const teamEstimatorAgent = require('./agents/teamEstimatorAgent');
const UserSkillProfile = require('./models/UserSkillProfile');

async function diagnose() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const projectId = '695bf5033aa30e83beb57ee'; // Nexus-Auth-Test
        console.log('Diagnosing for:', projectId);

        const project = await Project.findById(projectId);
        if (!project) throw new Error('Project not found');

        const tickets = await Ticket.find({ project: projectId }).lean();
        console.log(`Found ${tickets.length} tickets.`);

        let projectTechs = project.recommendedTechnologies || [];
        if (projectTechs.length === 0) {
            console.log('Project has no recommended technologies. Checking tickets...');
            tickets.forEach(t => {
                if (Array.isArray(t.skillsRequired)) {
                    t.skillsRequired.forEach(skill => {
                        if (!projectTechs.includes(skill)) projectTechs.push(skill);
                    });
                }
            });
        }
        if (projectTechs.length === 0) projectTechs = ['Frontend', 'Backend'];
        console.log('Techs to use:', projectTechs);

        const techRequirements = await teamEstimatorAgent.estimateWorkforce(projectId, tickets, projectTechs);
        console.log(`Generated ${techRequirements.length} requirements.`);

        const memberProfiles = await UserSkillProfile.find({ user: { $in: project.members.map(m => m.user) } });
        console.log(`Analyzing gaps for ${memberProfiles.length} members...`);

        for (const req of techRequirements) {
            let count = 0;
            const techLower = req.technology.toLowerCase();
            memberProfiles.forEach(profile => {
                if (profile.skills && profile.skills.some(s => {
                    const skillLower = s.toLowerCase();
                    return techLower.includes(skillLower) || skillLower.includes(techLower);
                })) {
                    count++;
                }
            });
            req.currentDevelopers = count;
            req.gap = Math.max(0, req.requiredDevelopers - count);
        }

        console.log('Saving requirements:', JSON.stringify(techRequirements));
        await TeamRequirement.deleteMany({ project: projectId });
        const saved = await TeamRequirement.insertMany(techRequirements);
        console.log(`Success! Saved ${saved.length} requirements.`);

        process.exit(0);
    } catch (err) {
        console.error('DIAGNOSTIC FAILED:', err);
        process.exit(1);
    }
}

diagnose();
