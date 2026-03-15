const UserSkillProfile = require('../models/UserSkillProfile');
const User = require('../models/User');

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
            // Calculate Match Score = (Skill Match × 0.6) + (Experience Level × 0.2) + (Availability × 0.2)
            
            // Skill Match (fuzzy matching for technology names)
            const techLower = technology.toLowerCase();
            const hasSkill = profile.skills.some(s => {
                const skillLower = s.toLowerCase();
                // Check if tech is in skill, skill is in tech, or they match partially
                return techLower.includes(skillLower) || skillLower.includes(techLower);
            });
            const skillScore = hasSkill ? 1.0 : 0.0;
            
            // Experience Level weighting
            const expWeights = { 'senior': 1.0, 'intermediate': 0.7, 'junior': 0.4 };
            const expScore = expWeights[profile.experienceLevel] || 0.7;
            
            // Availability weighting
            let availabilityScore = 0;
            if (profile.availabilityStatus === 'available') availabilityScore = 1.0;
            else if (profile.availabilityStatus === 'busy') availabilityScore = 0.5;
            else availabilityScore = 0.0;
            
            // Availability also considers current workload (inverse)
            // Assuming 0-10 scale where 0 is best availability
            const workloadAdjustment = Math.max(0, (10 - (profile.currentWorkload || 0)) / 10);
            const finalAvailabilityScore = (availabilityScore * 0.7) + (workloadAdjustment * 0.3);

            const totalScore = (skillScore * 0.6) + (expScore * 0.2) + (finalAvailabilityScore * 0.2);

            return {
                user: profile.user,
                matchScore: parseFloat(totalScore.toFixed(2)),
                skills: profile.skills,
                experienceLevel: profile.experienceLevel
            };
        });

        // Rank candidates and pick top ones
        const sortedCandidates = candidates
            .filter(c => c.matchScore > 0.4) // Filter out very poor matches
            .sort((a, b) => b.matchScore - a.matchScore);

        return {
            technology,
            requiredDevelopers: req.requiredDevelopers,
            suggestedUsers: sortedCandidates.slice(0, 5) // Suggest top 5
        };
    });

    return results;
};

module.exports = { matchUsersToRequirements };
