const Project = require('../models/Project');
const ProjectModule = require('../models/ProjectModule');
const Ticket = require('../models/Ticket');
const Sprint = require('../models/Sprint');
const User = require('../models/User');
const TeamRequirement = require('../models/TeamRequirement');
const requirementAgent = require('../agents/requirementAgent');
const skillMatchingAgent = require('../agents/skillMatchingAgent');
const capacityAgent = require('../agents/capacityAgent');
const teamEstimatorAgent = require('../agents/teamEstimatorAgent');
const teamMatcherAgent = require('../agents/teamMatcherAgent');
const timelineAgent = require('../agents/timelineAgent');
const TeamSuggestions = require('../models/TeamSuggestions');

const savePlanToDatabase = async (projectId, plan) => {
    const project = await Project.findById(projectId);
    if (!project) throw new Error('Project not found');

    // 1. Clear existing plan data
    console.log("Cleaning up existing plan data...");
    await ProjectModule.deleteMany({ project: projectId });
    await Sprint.deleteMany({ project: projectId });
    await Ticket.deleteMany({ project: projectId });
    await TeamRequirement.deleteMany({ project: projectId });

    // 2. Create Modules
    console.log("Creating modules...");
    const createdModules = await ProjectModule.insertMany(
        plan.modules.map(m => ({ project: projectId, moduleName: m.name, description: m.description }))
    );

    // 3. Create Sprints (Initial shell)
    console.log("Creating sprint shells...");
    const sprintShells = plan.sprints.map(s => ({
        name: s.name,
        project: projectId,
        status: 'future'
    }));
    const createdSprints = await Sprint.insertMany(sprintShells);

    // 4. Create Tickets
    console.log("Creating ticket shells...");
    const ticketsToInsert = plan.tickets.map(t => {
        const module = createdModules.find(m =>
            m.moduleName.toLowerCase() === (t.moduleName || '').toLowerCase()
        );

        let sprint = createdSprints.find(s => {
            const sprintDef = plan.sprints.find(sd => sd.name === s.name);
            return sprintDef && Array.isArray(sprintDef.ticketTitles) && 
                   sprintDef.ticketTitles.some(title => title.toLowerCase().trim() === t.title.toLowerCase().trim());
        });

        // Add fallback matching by sprintName directly if provided by AI
        if (!sprint && t.sprintName) {
            sprint = createdSprints.find(s => s.name.toLowerCase().trim() === t.sprintName.toLowerCase().trim());
        }

        // Fallback: Assign to first sprint if not specified by AI
        if (!sprint && createdSprints.length > 0) {
            sprint = createdSprints[0];
        }

        return {
            title: t.title,
            description: t.description || '',
            project: projectId,
            module: module ? module._id : null,
            sprint: sprint ? sprint._id : null,
            priority: (t.priority || 'medium').toLowerCase(),
            type: (t.type || 'task').toLowerCase(),
            effort: parseInt(t.effort) || 1,
            skillsRequired: Array.isArray(t.skillsRequired) ? t.skillsRequired : []
        };
    });
    const createdTickets = await Ticket.insertMany(ticketsToInsert);

    // 5. Generate Timeline (Dates)
    console.log("Generating timeline...");
    const { updatedSprints, updatedTickets } = timelineAgent.generateTimeline(createdSprints, createdTickets);

    // Explicitly update each sprint and ticket with calculated dates
    for (const s of updatedSprints) {
        await Sprint.findByIdAndUpdate(s._id, { 
            startDate: s.startDate, 
            endDate: s.endDate 
        }, { new: true });
    }
    for (const t of updatedTickets) {
        await Ticket.findByIdAndUpdate(t._id, { 
            startDate: t.startDate, 
            endDate: t.endDate 
        }, { new: true });
    }

    // 6. Workforce Estimation
    console.log("Estimating workforce requirements...");
    const techRequirements = await teamEstimatorAgent.estimateWorkforce(projectId, createdTickets, plan.recommendedTechnologies || []);
    
    // Count actual members for gaps
    const projectMembers = await User.find({ _id: { $in: project.members } });
    for (const req of techRequirements) {
        req.currentDevelopers = 0; // Simplified
        req.gap = Math.max(0, req.requiredDevelopers - 0);
    }
    await TeamRequirement.insertMany(techRequirements);

    // 7. Bidirectional relationships
    console.log("Saving bidirectional relationships...");
    for (const m of createdModules) {
        const moduleTickets = createdTickets.filter(t => 
            (t.module && t.module.toString() === m._id.toString()) ||
            (t.moduleName && m.moduleName && t.moduleName.toLowerCase().trim() === m.moduleName.toLowerCase().trim())
        );
        console.log(`Module: ${m.moduleName}, Found ${moduleTickets.length} tickets`);
        await ProjectModule.findByIdAndUpdate(m._id, { tickets: moduleTickets.map(t => t._id) });
    }
    for (const s of createdSprints) {
        const sprintTickets = createdTickets.filter(t => 
            (t.sprint && t.sprint.toString() === s._id.toString()) ||
            (t.sprintName && s.name && t.sprintName.toLowerCase().trim() === s.name.toLowerCase().trim())
        );
        console.log(`Sprint: ${s.name}, Found ${sprintTickets.length} tickets`);
        await Sprint.findByIdAndUpdate(s._id, { tickets: sprintTickets.map(t => t._id) });
    }

    // 8. Auto-assignment
    console.log("Starting auto-assignment...");
    const assignedResults = await skillMatchingAgent.matchTicketsToUsers(createdTickets, projectMembers);
    for (const result of assignedResults) {
        if (result.assignedUser) {
            await Ticket.findByIdAndUpdate(result._id, { assignedUser: result.assignedUser });
        }
    }

    // Update Project Metadata
    project.recommendedTechnologies = plan.recommendedTechnologies || [];
    project.modules = createdModules.map(m => m._id);
    project.sprints = createdSprints.map(s => s._id);
    await project.save();

    // Re-fetch everything to ensure we return the latest populated state
    const finalSprints = await Sprint.find({ project: projectId }).sort({ startDate: 1 }).populate('tickets');
    const finalTickets = await Ticket.find({ project: projectId }).populate('assignedUser', 'firstName lastName avatar');

    console.log(`Plan saved. Sprints: ${finalSprints.length}, Tickets: ${finalTickets.length}`);
    finalSprints.forEach(s => {
        console.log(`Sprint: ${s.name}, Tickets: ${s.tickets?.length}, Dates: ${s.startDate} - ${s.endDate}`);
    });

    return {
        modules: createdModules,
        tickets: finalTickets,
        sprints: finalSprints,
        technologies: project.recommendedTechnologies,
        requirements: techRequirements
    };
};

// @desc    Analyze project and generate initial development plan
const analyzeProjectPlan = async (req, res) => {
    try {
        const { title, description, projectId } = req.body;
        console.log("Fetching plan from requirementAgent...");
        const plan = await requirementAgent.analyzeProject(title, description);
        
        const result = await savePlanToDatabase(projectId, plan);
        
        res.json({
            message: 'Project plan generated, scheduled, and auto-assigned successfully',
            ...result
        });
    } catch (error) {
        console.error('Analyze Project Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get suggested team members based on project requirements
// @route   GET /api/agents/suggest-team/:projectId
// @access  Private
const getSuggestedTeam = async (req, res) => {
    try {
        const { projectId } = req.params;
        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        const techRequirements = await TeamRequirement.find({ project: projectId });
        if (!techRequirements.length) {
            return res.status(400).json({ message: 'No team requirements found for this project. Generate SDLC plan first.' });
        }

        console.log("Starting team matching process...");
        const suggestions = await teamMatcherAgent.matchUsersToRequirements(projectId, techRequirements);

        // Save or update suggestions in DB
        await TeamSuggestions.deleteMany({ project: projectId });
        const savedSuggestions = await TeamSuggestions.insertMany(
            suggestions.map(s => ({
                project: projectId,
                technology: s.technology,
                requiredDevelopers: s.requiredDevelopers,
                suggestedUsers: s.suggestedUsers.map(c => ({
                    user: c.user._id,
                    matchScore: c.matchScore
                }))
            }))
        );

        // Fetch back with populated users for the response
        const populatedSuggestions = await TeamSuggestions.find({ project: projectId })
            .populate('suggestedUsers.user', 'firstName lastName avatar email');

        res.json(populatedSuggestions);
    } catch (error) {
        console.error('Get Suggested Team Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get full saved project plan
// @route   GET /api/agents/full-plan/:projectId
// @access  Private
const getFullPlan = async (req, res) => {
    try {
        const { projectId } = req.params;
        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        const [modules, tickets, sprints, requirements] = await Promise.all([
            ProjectModule.find({ project: projectId }).populate({
                path: 'tickets',
                populate: { path: 'assignedUser', select: 'firstName lastName avatar' }
            }),
            Ticket.find({ project: projectId }).populate('assignedUser', 'firstName lastName avatar').populate('module').populate('sprint'),
            Sprint.find({ project: projectId }).populate({
                path: 'tickets',
                populate: { path: 'assignedUser', select: 'firstName lastName avatar' }
            }),
            TeamRequirement.find({ project: projectId })
        ]);

        res.json({
            project,
            modules,
            tickets,
            sprints,
            requirements,
            technologies: project.recommendedTechnologies
        });
    } catch (error) {
        console.error('Get Full Plan Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Automatically assign tickets using skill matching
const assignTickets = async (req, res) => {
    try {
        const { projectId } = req.body;
        if (!projectId) return res.status(400).json({ message: 'Project ID is required' });

        const project = await Project.findById(projectId).populate('members');
        if (!project) return res.status(404).json({ message: 'Project not found' });

        // Fetch only unassigned tickets for this project
        const tickets = await Ticket.find({ project: projectId, assignedUser: { $exists: false } });
        
        if (tickets.length === 0) {
            return res.json({ message: 'No unassigned tickets found', results: [] });
        }

        console.log(`Auto-assigning ${tickets.length} tickets for project: ${project.name}`);
        const assignedResults = await skillMatchingAgent.matchTicketsToUsers(tickets, project.members);

        let successfulAssignments = 0;
        for (const result of assignedResults) {
            if (result.assignedUser) {
                await Ticket.findByIdAndUpdate(result._id, { assignedUser: result.assignedUser });
                
                // Update UserSkillProfile workload
                const UserSkillProfile = require('../models/UserSkillProfile');
                await UserSkillProfile.findOneAndUpdate(
                    { user: result.assignedUser },
                    { $inc: { currentWorkload: 1 } },
                    { upsert: true }
                );
                successfulAssignments++;
            }
        }

        res.json({ 
            message: `Successfully assigned ${successfulAssignments} out of ${tickets.length} tickets`, 
            results: assignedResults 
        });
    } catch (error) {
        console.error('Assign Tickets Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Run team capacity and skill analysis
const getTeamAnalysis = async (req, res) => {
    try {
        const { projectId } = req.params;
        const project = await Project.findById(projectId).populate('members');
        const tickets = await Ticket.find({ project: projectId });

        const analysis = await capacityAgent.analyzeCapacity(tickets, project.members);
        res.json(analysis);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Improvise/Refine project plan with new requirements
// @route   POST /api/agents/improvise-project
// @access  Private
const improviseProjectPlan = async (req, res) => {
    try {
        const { projectId, improvisationQuery } = req.body;
        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        // 1. Gather existing plan data for context
        const [modules, tickets, sprints] = await Promise.all([
            ProjectModule.find({ project: projectId }).lean(),
            Ticket.find({ project: projectId }).lean(),
            Sprint.find({ project: projectId }).lean()
        ]);

        const existingPlan = {
            modules: modules.map(m => ({ name: m.moduleName, description: m.description })),
            tickets: tickets.map(t => ({ title: t.title, description: t.description, moduleName: modules.find(m => m._id.toString() === t.module?.toString())?.moduleName })),
            sprints: sprints.map(s => ({ name: s.name, ticketTitles: tickets.filter(t => t.sprint?.toString() === s._id.toString()).map(t => t.title) }))
        };

        // 2. Call Gemini for improvisation
        console.log(`Starting improvisation for project: ${project.name} (ID: ${projectId})`);
        console.log("Improvisation query:", improvisationQuery);
        
        const plan = await requirementAgent.improviseProject(project.name, existingPlan, improvisationQuery);
        console.log("Improvised plan received successfully. Modules count:", plan.modules?.length);

        if (!plan || !plan.modules || !Array.isArray(plan.modules) || plan.modules.length === 0) {
            throw new Error("AI failed to architect any modules for this requirement. Please try being more specific.");
        }

        const result = await savePlanToDatabase(projectId, plan);

        res.json({
            message: 'Project plan improvised successfully',
            ...result
        });

    } catch (error) {
        console.error('Improvise Plan Error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    analyzeProjectPlan,
    improviseProjectPlan,
    getFullPlan,
    getSuggestedTeam,
    assignTickets,
    getTeamAnalysis
};
