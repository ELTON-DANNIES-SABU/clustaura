const UserSkillProfile = require('../models/UserSkillProfile');
const User = require('../models/User');
const { calculateMatchScore } = require('../services/matchingEngine');

/**
 * Matches project technical requirements to available platform users.
 * @param {string} projectId - Current Project ID
 * @param {Array} techRequirements - List of { technology, requiredDevelopers }
 * @returns {Array} List of suggestions per technology
 */
const matchUsersToRequirements = async (projectId, techRequirements) => {
    // 1. Fetch all skill profiles and users
    const profiles = await UserSkillProfile.find().populate('user', 'firstName lastName avatar email');
    
    const results = techRequirements.map(req => {
        const technology = req.technology;
        const candidates = profiles.map(profile => {
            const user = profile.user || {};
            
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
            const reqData = {
                requiredSkills: [technology],
                description: `Need experts in ${technology}`
            };

            // Call the centralized HSVSM engine
            const engineResult = calculateMatchScore(fullUserProfile, reqData);

            // Optional workload integration as the previous version had
            const workloadAdjustment = Math.max(0, (10 - (profile.currentWorkload || 0)) / 10);
            
            // Although engineResult already has matchScore, to exactly replicate the 100% replacement logic:
            // The prompt says "Replace all existing recommendation logic... ensure consistent matching logic"
            // So we just return the pure matchScore without custom additions.
            // If they are wildly overloaded we can just pass that as metadata, but for ranking, use HSVSM.
            
            return {
                user: profile.user,
                matchScore: engineResult.matchScore,
                semanticScore: engineResult.semanticScore,
                cosineScore: engineResult.cosineScore,
                skills: profile.skills,
                experienceLevel: profile.experienceLevel
            };
        });

        // Rank candidates and pick top ones
        let sortedCandidates = candidates
            .filter(c => c.matchScore > 0.4) // Filter out very poor matches
            .sort((a, b) => b.matchScore - a.matchScore);

        // Fallback: If no strict matches exist (e.g. for niche libraries like Bcrypt), suggest best available devs
        if (sortedCandidates.length === 0) {
            sortedCandidates = candidates
                .filter(c => c.matchScore > 0.15) // Enough to catch available junior/intermediates
                .sort((a, b) => b.matchScore - a.matchScore);
        }

        return {
            technology,
            requiredDevelopers: req.requiredDevelopers,
            suggestedUsers: sortedCandidates.slice(0, 5) // Suggest top 5
        };
    });

    return results;
};

module.exports = { matchUsersToRequirements };
