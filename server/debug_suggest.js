const mongoose = require('mongoose');
require('dotenv').config();

const Project = require('./models/Project');
const Ticket = require('./models/Ticket');
const TeamRequirement = require('./models/TeamRequirement');
const teamEstimatorAgent = require('./agents/teamEstimatorAgent');
const teamMatcherAgent = require('./agents/teamMatcherAgent');
const TeamSuggestions = require('./models/TeamSuggestions');

async function debugSuggestedTeam() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const projectId = '695bf5033aa30e83beb57ee'; // Nexus-Auth-Test
        console.log('--- Debugging suggestedTeam for:', projectId, '---');

        const project = await Project.findById(projectId);
        if (!project) throw new Error('Project not found');

        let techRequirements = await TeamRequirement.find({ project: projectId });
        console.log('Existing Requirements in DB:', techRequirements.length);

        if (!techRequirements.length) {
            console.log('Triggering SELF-HEALING...');
            let tickets = await Ticket.find({ project: projectId }).lean();
            let projectTechs = project.recommendedTechnologies || project.technologies || [];
            
            console.log('Initial projectTechs:', projectTechs);
            if (tickets.length === 0 && projectTechs.length === 0) {
                console.log('No tickets/techs. Using fallback...');
                projectTechs = ['Frontend', 'Backend'];
            }
            
            const generatedReqs = await teamEstimatorAgent.estimateWorkforce(projectId, tickets || [], projectTechs);
            console.log('Generated Reqs count:', generatedReqs.length);
            
            if (generatedReqs.length > 0) {
                techRequirements = await TeamRequirement.insertMany(generatedReqs);
                console.log('Saved healed requirements:', techRequirements.length);
            }
        }

        if (!techRequirements.length) {
            console.log('CRITICAL: Still no requirements.');
            process.exit(1);
        }

        console.log('Matching users...');
        const suggestions = await teamMatcherAgent.matchUsersToRequirements(projectId, techRequirements);
        console.log('Matched groups:', suggestions.length);

        process.exit(0);
    } catch (err) {
        console.error('DEBUG FAILED:', err);
        process.exit(1);
    }
}

debugSuggestedTeam();
