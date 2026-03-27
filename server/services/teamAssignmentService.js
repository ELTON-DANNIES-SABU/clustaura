const UserSkillProfile = require('../models/UserSkillProfile');
const Ticket = require('../models/Ticket');
const Project = require('../models/Project');
const { calculateMatchScore } = require('./matchingEngine');

/**
 * Get ranked developer suggestions for a specific ticket
 * @param {String} ticketId 
 * @param {String} projectId 
 */
const getSuggestedDevelopers = async (ticketId, projectId) => {
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) throw new Error('Ticket not found');

    const project = await Project.findById(projectId).populate('members.user');
    if (!project) throw new Error('Project not found');

    const users = project.members.map(m => m.user);
    const profiles = await UserSkillProfile.find({ user: { $in: users.map(u => u._id) } });

    const suggestions = users.map(user => {
        const userId = user._id.toString();
        const profile = profiles.find(p => p.user.toString() === userId) || {
            skills: [],
            experienceLevel: 'intermediate',
            currentWorkload: 0
        };

        const currentWorkload = profile.currentWorkload || 0;
        
        // Build the combined user profile expected by matchingEngine
        const fullUserProfile = {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            avatar: user.avatar,
            email: user.email,
            skills: profile.skills,
            bio: user.bio || '',
            posts: [] // Workspace assignment doesn't strictly need community posts text
        };

        // Build the task/ticket data expected by matchingEngine
        const ticketData = {
            requiredSkills: ticket.skillsRequired || [],
            description: ticket.description || '',
            title: ticket.title || ticket.issueKey || ''
        };

        // Call the centralized HSVSM engine
        const engineResult = calculateMatchScore(fullUserProfile, ticketData);

        // We can optionally add workload penalization here if needed, 
        // but for now we follow the requirement: use the engine's matchScore directly.
        // We will still track isOverloaded based on maxWorkload (5)

        const maxWorkload = 5;
        const isOverloaded = currentWorkload >= maxWorkload;

        // Optionally, one could blend the engineResult.matchScore with workload manually,
        // but to ensure consistent matching logic as requested, we return the pure engine match score.
        // The isOverloaded flag acts as a hard filter instead.

        return {
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                avatar: user.avatar,
                email: user.email
            },
            skills: profile.skills,
            experienceLevel: profile.experienceLevel,
            currentWorkload,
            matchScore: engineResult.matchScore,
            semanticScore: engineResult.semanticScore,
            cosineScore: engineResult.cosineScore,
            isOverloaded
        };
    });

    // Sort by match score (descending)
    return suggestions.sort((a, b) => b.matchScore - a.matchScore);
};

/**
 * Assign a ticket to a user
 * @param {String} ticketId 
 * @param {String} userId 
 */
const assignTicket = async (ticketId, userId) => {
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) throw new Error('Ticket not found');

    const profile = await UserSkillProfile.findOne({ user: userId });
    
    // Check workload before assignment
    if (profile && profile.currentWorkload >= 5) {
        throw new Error('User is already at maximum workload capacity (5 tickets)');
    }

    ticket.assignedUser = userId;
    // 'To Do' is the default and starting point
    await ticket.save();

    // Increment workload
    await UserSkillProfile.findOneAndUpdate(
        { user: userId },
        { $inc: { currentWorkload: 1 } },
        { upsert: true }
    );

    return ticket;
};

/**
 * Auto-assign all unassigned/To Do tickets in a project.
 * @param {String} projectId 
 */
const autoAssignProjectTickets = async (projectId) => {
    // 1. Fetch unassigned tickets or tickets that are in To Do
    const tickets = await Ticket.find({
        project: projectId,
        status: { $in: ['To Do'] }
    });

    if (tickets.length === 0) {
        return { message: 'No tickets to assign. All tickets are already In Progress or Completed.', assignedCount: 0 };
    }

    // 2. We will need project members
    const project = await Project.findById(projectId).populate('members.user');
    if (!project || project.members.length === 0) {
        throw new Error('Project not found or has no members');
    }

    // 2.5 Recalculate Workload to reflect only 'In Progress' tickets
    // so we get accurate fresh assignment caps.
    const memberIds = project.members.map(m => m.user._id);
    for (let userId of memberIds) {
        const inProgressCount = await Ticket.countDocuments({ project: projectId, assignedUser: userId, status: 'In Progress' });
        await UserSkillProfile.findOneAndUpdate(
            { user: userId },
            { $set: { currentWorkload: inProgressCount } },
            { upsert: true }
        );
    }

    let assignedCount = 0;

    // 3. For each ticket, find the best fit and assign
    for (const ticket of tickets) {
        try {
            // Unset assigned user temporarily if it was previously assigned
            // so getSuggestedDevelopers evaluates them cleanly
            ticket.assignedUser = null; 

            // Re-fetch suggestions for each ticket
            const suggestions = await getSuggestedDevelopers(ticket._id, projectId);

            // Filter out overloaded members
            const validCandidates = suggestions.filter(s => !s.isOverloaded);
            
            if (validCandidates.length > 0) {
                const bestMatch = validCandidates[0];

                ticket.assignedUser = bestMatch.user._id;
                ticket.status = 'To Do';
                ticket.progressPercentage = 0; // Initialize progress
                await ticket.save();

                // Increment workload
                await UserSkillProfile.findOneAndUpdate(
                    { user: bestMatch.user._id },
                    { $inc: { currentWorkload: 1 } },
                    { upsert: true }
                );

                assignedCount++;
            } else {
                // No valid candidate (everyone is overloaded)
                // We'll just leave it unassigned to protect workloads
                console.log(`Could not assign ticket ${ticket.issueKey} - all team members overloaded.`);
            }
        } catch (error) {
            console.error(`Failed to assign ticket ${ticket._id}:`, error);
        }
    }

    return { message: `Successfully assigned ${assignedCount} tickets.`, assignedCount };
};

module.exports = {
    getSuggestedDevelopers,
    assignTicket,
    autoAssignProjectTickets
};
