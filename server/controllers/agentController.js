const Project = require('../models/Project');
const ProjectModule = require('../models/ProjectModule');
const Ticket = require('../models/Ticket');
const Sprint = require('../models/Sprint');
const User = require('../models/User');
const requirementAgent = require('../agents/requirementAgent');
const skillMatchingAgent = require('../agents/skillMatchingAgent');
const capacityAgent = require('../agents/capacityAgent');

// @desc    Analyze project and generate initial development plan
// @route   POST /api/agents/analyze-project
// @access  Private
const analyzeProjectPlan = async (req, res) => {
    try {
        const { title, description, projectId } = req.body;

        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        // 1. Analyze with Gemini
        console.log("Fetching plan from requirementAgent...");
        const plan = await requirementAgent.analyzeProject(title, description);
        console.log("Plan received successfully:", JSON.stringify(plan, null, 2));

        // 2. Clear existing (if any) and create Modules
        console.log("Creating modules...");
        await ProjectModule.deleteMany({ project: projectId });
        const createdModules = await ProjectModule.insertMany(
            plan.modules.map(m => ({ ...m, project: projectId, moduleName: m.name }))
        );

        // 3. Create Sprints
        console.log("Creating sprints...");
        const createdSprints = [];
        for (const s of plan.sprints) {
            const sprint = await Sprint.create({
                name: s.name,
                project: projectId,
                status: 'future'
            });
            createdSprints.push(sprint);
        }

        // 4. Create Tickets
        console.log("Creating tickets...");
        const ticketsToInsert = plan.tickets.map(t => {
            const module = createdModules.find(m =>
                m.moduleName.toLowerCase() === (t.moduleName || '').toLowerCase()
            );

            // Safer sprint matching
            const sprint = createdSprints.find(s => {
                const sprintDef = plan.sprints.find(sd => sd.name === s.name);
                return sprintDef && Array.isArray(sprintDef.ticketTitles) && sprintDef.ticketTitles.includes(t.title);
            });

            return {
                title: t.title,
                description: t.description || '',
                project: projectId,
                module: module ? module._id : null,
                sprint: sprint ? sprint._id : null,
                priority: t.priority || 'medium',
                type: t.type || 'task',
                effort: t.effort || 1,
                skillsRequired: Array.isArray(t.skillsRequired) ? t.skillsRequired : []
            };
        });

        console.log(`Inserting ${ticketsToInsert.length} automated tickets...`);
        const createdTickets = await Ticket.insertMany(ticketsToInsert);

        // 5. Update Project with technologies
        console.log("Updating project metadata...");
        project.technologies = Array.isArray(plan.recommendedTechnologies) ? plan.recommendedTechnologies : [];
        project.modules = createdModules.map(m => m._id);
        project.sprints = createdSprints.map(s => s._id);
        await project.save();

        // 6. AUTO-ASSIGN TICKETS IMMEDIATELY
        console.log("Starting auto-assignment...");
        const projectMembers = await User.find({ _id: { $in: project.members } });
        const assignedResults = await skillMatchingAgent.matchTicketsToUsers(createdTickets, projectMembers);

        for (const result of assignedResults) {
            await Ticket.findByIdAndUpdate(result._id, { assignedUser: result.assignedUser });
        }

        console.log("SDLC Pipeline completed successfully!");
        res.json({
            message: 'Project plan generated and auto-assigned successfully',
            modules: createdModules,
            tickets: assignedResults, // Return tickets with assignments
            sprints: createdSprints,
            technologies: project.technologies
        });
    } catch (error) {
        console.error('Analyze Project Error Details:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Automatically assign tickets using skill matching
// @route   POST /api/agents/assign-tickets
// @access  Private
const assignTickets = async (req, res) => {
    try {
        const { projectId } = req.body;
        const project = await Project.findById(projectId).populate('members');
        if (!project) return res.status(404).json({ message: 'Project not found' });

        const tickets = await Ticket.find({ project: projectId, assignedUser: { $exists: false } });
        if (tickets.length === 0) return res.json({ message: 'No unassigned tickets found' });

        const assignedResults = await skillMatchingAgent.matchTicketsToUsers(tickets, project.members);

        // Update tickets in DB
        for (const result of assignedResults) {
            await Ticket.findByIdAndUpdate(result._id, { assignedUser: result.assignedUser });
        }

        res.json({ message: 'Tickets assigned successfully', results: assignedResults });
    } catch (error) {
        console.error('Assign Tickets Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Run team capacity and skill analysis
// @route   GET /api/agents/team-analysis/:projectId
// @access  Private
const getTeamAnalysis = async (req, res) => {
    try {
        const { projectId } = req.params;
        const project = await Project.findById(projectId).populate('members');
        const tickets = await Ticket.find({ project: projectId });

        const analysis = await capacityAgent.analyzeCapacity(tickets, project.members);

        res.json(analysis);
    } catch (error) {
        console.error('Team Analysis Error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    analyzeProjectPlan,
    assignTickets,
    getTeamAnalysis
};
