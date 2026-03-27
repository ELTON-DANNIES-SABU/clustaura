require('dotenv').config({path: './server/.env'});
require('./server/config/db')().then(async () => {
    try {
        const mongoose = require('mongoose');
        const Project = require('./server/models/Project');
        const Ticket = require('./server/models/Ticket');
        const Sprint = require('./server/models/Sprint');
        const ProjectModule = require('./server/models/ProjectModule');
        const TeamReq = require('./server/models/TeamRequirement');
        
        const p = await Project.findOne().sort({createdAt: -1});
        const projectId = p._id;
        const createdTickets = await Ticket.find({project: projectId});
        const createdSprints = await Sprint.find({project: projectId});
        
        console.log('Project ID:', projectId);
        console.log('Tickets:', createdTickets.length);
        console.log('Sprints:', createdSprints.length);
        
        let projectTechs = p.recommendedTechnologies || [];
        if (projectTechs.length === 0) {
            createdTickets.forEach(t => {
                if (Array.isArray(t.skillsRequired)) {
                    t.skillsRequired.forEach(skill => {
                        if (!projectTechs.includes(skill)) projectTechs.push(skill);
                    });
                }
            });
            console.log('Extracted techs:', projectTechs.length);
            p.recommendedTechnologies = projectTechs;
            await p.save();
        }
        
        const teamEstimatorAgent = require('./server/agents/teamEstimatorAgent');
        const techRequirements = await teamEstimatorAgent.estimateWorkforce(projectId, createdTickets, projectTechs);
        
        for (const req of techRequirements) {
            req.currentDevelopers = 0;
            req.gap = Math.max(0, req.requiredDevelopers - 0);
        }
        
        await TeamReq.deleteMany({project: projectId});
        await TeamReq.insertMany(techRequirements);
        console.log('Inserted Reqs:', techRequirements.length);
        
        const timelineAgent = require('./server/agents/timelineAgent');
        const { updatedSprints, updatedTickets } = timelineAgent.generateTimeline(createdSprints, createdTickets);
        
        for (const s of updatedSprints) {
            await Sprint.findByIdAndUpdate(s._id, { startDate: s.startDate, endDate: s.endDate });
        }
        for (const t of updatedTickets) {
            await Ticket.findByIdAndUpdate(t._id, { startDate: t.startDate, endDate: t.endDate });
        }
        
        for (const s of createdSprints) {
            const sprintTickets = createdTickets.filter(t => 
                (t.sprint && String(t.sprint) === String(s._id)) || 
                (t.sprintName && s.name && String(t.sprintName).toLowerCase().trim() === String(s.name).toLowerCase().trim())
            );
            await Sprint.findByIdAndUpdate(s._id, { tickets: sprintTickets.map(t => t._id) });
        }
        console.log('Successfully retrofitted project:', p.name);
    } catch(e) {
        console.error(e);
    }
    process.exit(0);
});
