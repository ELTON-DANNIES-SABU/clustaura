const UserSkillProfile = require('../models/UserSkillProfile');
const User = require('../models/User');
const Ticket = require('../models/Ticket');
const Post = require('../models/Post');
const profileMatchingEngine = require('../services/profileMatchingEngine');

/**
 * Matches project technical requirements to available platform users.
 * @param {string} projectId - Current Project ID
 * @param {Array} techRequirements - List of { technology, requiredDevelopers }
 * @returns {Array} List of suggestions per technology
 */
const matchUsersToRequirements = async (projectId, techRequirements) => {
    // 1. Fetch project for context
    const project = await require('../models/Project').findById(projectId);
    const projectContext = project ? `${project.name}: ${project.description || ''}` : '';

    // 2. Fetch all skill profiles and users
    const profiles = await UserSkillProfile.find().populate('user', 'firstName lastName avatar email bio');
    
    // 3. Pre-fetch pending ticket counts for all candidates (Global Workload)
    const userIds = profiles.map(p => p.user?._id).filter(id => id);
    const ticketCounts = await Ticket.aggregate([
        { $match: { assignedUser: { $in: userIds }, status: { $ne: 'Done' } } },
        { $group: { _id: '$assignedUser', count: { $sum: 1 } } }
    ]);
    
    const workloadMap = {};
    ticketCounts.forEach(tc => {
        workloadMap[tc._id.toString()] = tc.count;
    });

    const resultsPromises = techRequirements.map(async (req) => {
        // Extract core technology name if it contains descriptions (e.g. "GO (BACKEND...)" -> "GO")
        const technologyRaw = req.technology;
        const technology = technologyRaw.split(/[(\[:]/)[0].trim();
        
        console.log(`Matching for: ${technology} in project ${project?.name}`);

        const candidatesPromises = profiles.map(async (profile) => {
            const user = profile.user || {};
            const userIdStr = user._id?.toString();
            const pendingTicketCount = workloadMap[userIdStr] || 0;
            
            // Fetch user posts for evidence
            const userPosts = await Post.find({ author: user._id })
                .limit(10)
                .select('title content');

            // Build the combined user profile expected by matchingEngine
            const fullUserProfile = {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                avatar: user.avatar,
                email: user.email,
                skills: profile.skills,
                bio: user.bio || '',
                posts: userPosts
            };

            // Build the task/ticket data expected by matchingEngine
            const reqData = {
                requiredSkills: [technology],
                description: `Expertise in ${technology} for ${projectContext}`,
                pendingTicketCount: pendingTicketCount
            };

            // Call the centralized Profile Intelligence engine
            const engineResult = profileMatchingEngine.calculateMatchScore(fullUserProfile, reqData);

            return {
                user: profile.user,
                matchScore: engineResult.matchScore,
                ontologyScore: engineResult.ontologyScore,
                bioScore: engineResult.bioScore,
                postScore: engineResult.postScore,
                availabilityScore: engineResult.availabilityScore,
                pendingTickets: engineResult.pendingTickets,
                skills: profile.skills,
                experienceLevel: profile.experienceLevel
            };
        });

        const candidates = await Promise.all(candidatesPromises);

        // Rank candidates and pick top ones
        let sortedCandidates = candidates
            .filter(c => c.matchScore > 0.2) // More inclusive initial filter
            .sort((a, b) => b.matchScore - a.matchScore);

        // Fallback: If no strict matches exist, suggest best available devs
        if (sortedCandidates.length === 0) {
            sortedCandidates = candidates
                .filter(c => c.matchScore > 0.05) // Catch even very generic matches
                .sort((a, b) => b.matchScore - a.matchScore);
        }

        return {
            technology: technologyRaw, // Keep the original descriptive name for the UI group header
            requiredDevelopers: req.requiredDevelopers,
            suggestedUsers: sortedCandidates.slice(0, 5) // Suggest top 5
        };
    });

    const results = await Promise.all(resultsPromises);
    return results;
};

module.exports = { matchUsersToRequirements };
