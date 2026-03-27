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
        status: 'future',
        startDate: s.startDate ? new Date(s.startDate) : undefined,
        endDate: s.endDate ? new Date(s.endDate) : undefined
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
            skillsRequired: Array.isArray(t.skillsRequired) ? t.skillsRequired : [],
            startDate: t.startDate ? new Date(t.startDate) : undefined,
            endDate: t.endDate ? new Date(t.endDate) : undefined
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
    let projectTechs = plan.recommendedTechnologies || plan.technologies || [];
    if (projectTechs.length === 0) {
        createdTickets.forEach(t => {
            if (Array.isArray(t.skillsRequired)) {
                t.skillsRequired.forEach(skill => {
                    if (!projectTechs.includes(skill)) projectTechs.push(skill);
                });
            }
        });
    }
    const techRequirements = await teamEstimatorAgent.estimateWorkforce(projectId, createdTickets, projectTechs);
    
    // Count actual members for gaps dynamically
    const UserSkillProfile = require('../models/UserSkillProfile');
    const memberProfiles = await UserSkillProfile.find({ user: { $in: project.members.map(m => m.user) } });
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
    await TeamRequirement.insertMany(techRequirements);

    // 7. Bidirectional relationships
    console.log("Saving bidirectional relationships...");
    for (const m of createdModules) {
        const moduleTickets = createdTickets.filter(t => 
            (t.module && String(t.module) === String(m._id)) ||
            (t.moduleName && m.moduleName && String(t.moduleName).toLowerCase().trim() === String(m.moduleName).toLowerCase().trim())
        );
        console.log(`Module: ${m.moduleName}, Found ${moduleTickets.length} tickets`);
        await ProjectModule.findByIdAndUpdate(m._id, { tickets: moduleTickets.map(t => t._id) });
    }
    for (const s of createdSprints) {
        const sprintTickets = createdTickets.filter(t => 
            (t.sprint && String(t.sprint) === String(s._id)) ||
            (t.sprintName && s.name && String(t.sprintName).toLowerCase().trim() === String(s.name).toLowerCase().trim())
        );
        console.log(`Sprint: ${s.name}, Found ${sprintTickets.length} tickets`);
        await Sprint.findByIdAndUpdate(s._id, { tickets: sprintTickets.map(t => t._id) });
    }

    // 8. Auto-assignment
    console.log("Skipping auto-assignment, tickets will begin in To Do state...");
    // Auto-assignment is now handled manually by Team Leads via the dynamic assignment UI.
    // Tickets are left with assignedUser: null and status: 'To Do'.

    // Update Project Metadata
    project.recommendedTechnologies = projectTechs;
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
        const project = await Project.findById(projectId).populate('members.user', 'firstName lastName email avatar');
        if (!project) return res.status(404).json({ message: 'Project not found' });

        const isOwner = project.owner?._id.toString() === req.user._id.toString() || project.owner.toString() === req.user._id.toString();
        const isLead = project.members?.find(m => (m.user?._id?.toString() === req.user._id.toString() || m.user?.toString() === req.user._id.toString()) && m.role === 'Project Lead');
        const canSeeAll = isOwner || !!isLead;

        let [modules, tickets, sprints, requirements] = await Promise.all([
            ProjectModule.find({ project: projectId }).populate({
                path: 'tickets',
                populate: { path: 'assignedUser', select: 'firstName lastName avatar' }
            }).lean(),
            Ticket.find({ project: projectId }).populate('assignedUser', 'firstName lastName avatar').populate('module').populate('sprint').lean(),
            Sprint.find({ project: projectId }).populate({
                path: 'tickets',
                populate: { path: 'assignedUser', select: 'firstName lastName avatar' }
            }).lean(),
            TeamRequirement.find({ project: projectId })
        ]);

        if (!canSeeAll) {
            // Filter tickets for regular members
            tickets = tickets.filter(t => t.assignedUser?._id?.toString() === req.user._id.toString());
            
            const visibleTicketIds = tickets.map(t => t._id.toString());
            const visibleModuleIds = tickets.filter(t => t.module).map(t => t.module._id?.toString() || t.module.toString());
            const visibleSprintIds = tickets.filter(t => t.sprint).map(t => t.sprint._id?.toString() || t.sprint.toString());

            // Filter modules to only those containing at least one visible ticket
            modules = modules.filter(m => visibleModuleIds.includes(m._id.toString())).map(m => ({
                ...m,
                tickets: m.tickets.filter(tid => visibleTicketIds.includes(tid._id?.toString() || tid.toString()))
            }));

            // Filter sprints to only those containing at least one visible ticket
            sprints = sprints.filter(s => visibleSprintIds.includes(s._id.toString())).map(s => ({
                ...s,
                tickets: s.tickets.filter(tid => visibleTicketIds.includes(tid._id?.toString() || tid.toString()))
            }));
        }

        // Dynamically compute current team capacities based on actual project members
        const UserSkillProfile = require('../models/UserSkillProfile');
        const memberProfiles = await UserSkillProfile.find({ user: { $in: project.members.map(m => m.user) } });
        
        for (const req of requirements) {
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
            await req.save(); // ensure it's persistent as they view it
        }

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

        const project = await Project.findById(projectId).populate('members.user');
        if (!project) return res.status(404).json({ message: 'Project not found' });

        // Fetch only unassigned tickets for this project
        const tickets = await Ticket.find({ project: projectId, assignedUser: { $exists: false } });
        
        if (tickets.length === 0) {
            return res.json({ message: 'No unassigned tickets found', results: [] });
        }

        console.log(`Auto-assigning ${tickets.length} tickets for project: ${project.name}`);
        const assignedResults = await skillMatchingAgent.matchTicketsToUsers(tickets, project.members.map(m => m.user));

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
        const project = await Project.findById(projectId).populate('members.user');
        const tickets = await Ticket.find({ project: projectId });

        const analysis = await capacityAgent.analyzeCapacity(tickets, project.members.map(m => m.user));
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
        const project = await Project.findById(projectId).populate('members.user', 'firstName lastName email avatar');
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

const getTickets = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { sprint } = req.query;
        
        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        const isOwner = project.owner?._id.toString() === req.user._id.toString() || project.owner.toString() === req.user._id.toString();
        const isLead = project.members?.find(m => (m.user?._id?.toString() === req.user._id.toString() || m.user?.toString() === req.user._id.toString()) && m.role === 'Project Lead');
        
        const query = { project: projectId };
        if (sprint) query.sprint = sprint;
        
        // If not owner/lead, only show assigned tickets
        if (!isOwner && !isLead) {
            query.assignedUser = req.user._id;
        }

        const tickets = await Ticket.find(query).populate('assignedUser', 'firstName lastName avatar');
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    analyzeProjectPlan,
    improviseProjectPlan,
    getFullPlan,
    getTickets,
    getSuggestedTeam,
    assignTickets,
    getTeamAnalysis
};
