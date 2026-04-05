const UserSkillProfile = require('../models/UserSkillProfile');
const Post = require('../models/Post');
const profileMatchingEngine = require('../services/profileMatchingEngine');

/**
 * Assigns tickets to users based on the new Profile Intelligence engine, 
 * while still managing workload balancing.
 * 
 * @param {Array} tickets - List of Tickets to assign
 * @param {Array} users - List of User objects (the team)
 * @returns {Promise<Array>} Assigned tickets with userId
 */
const matchTicketsToUsers = async (tickets, users) => {
    const profiles = await UserSkillProfile.find({ user: { $in: users.map(u => u._id) } });

    // Track local workload during the assignment process to avoid overloading one person
    const localWorkload = {};
    profiles.forEach(p => {
        localWorkload[p.user.toString()] = p.currentWorkload || 0;
    });

    const assignedTicketsPromises = tickets.map(async (ticket) => {
        let bestScore = -1;
        let bestUser = null;

        const candidateScores = await Promise.all(users.map(async (user) => {
            const userId = user._id.toString();
            const profile = profiles.find(p => p.user.toString() === userId) || {
                skills: [],
                experienceLevel: 'intermediate',
                currentWorkload: 0
            };

            const currentWorkload = localWorkload[userId] || 0;

            // Fetch user posts for evidence
            const userPosts = await Post.find({ author: user._id })
                .limit(10)
                .select('title content');

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

            const ticketData = {
                requiredSkills: ticket.skillsRequired || [],
                description: ticket.description || '',
                title: ticket.title || ''
            };

            // Call the centralized Profile Intelligence engine
            const engineResult = profileMatchingEngine.calculateMatchScore(fullUserProfile, ticketData);
            
            // Integrate Workload Balance (Penalty for overloading)
            // We still use the engine's matchScore as the base (0.8 weight) 
            // and workload as a balancer (0.2 weight).
            const workloadScore = Math.max(0, (10 - currentWorkload) / 10);
            const totalScore = (engineResult.matchScore * 0.8) + (workloadScore * 0.2);

            return { userId, totalScore };
        }));

        candidateScores.forEach(({ userId, totalScore }) => {
            if (totalScore > bestScore) {
                bestScore = totalScore;
                bestUser = userId;
            }
        });

        // If a user was found, increment their local workload
        if (bestUser) {
            localWorkload[bestUser] = (localWorkload[bestUser] || 0) + 1;
        }

        return { 
            ...(ticket.toObject ? ticket.toObject() : ticket), 
            assignedUser: bestUser, 
            matchScore: parseFloat(bestScore.toFixed(4))
        };
    });

    return await Promise.all(assignedTicketsPromises);
};

module.exports = { matchTicketsToUsers };
