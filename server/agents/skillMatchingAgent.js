const UserSkillProfile = require('../models/UserSkillProfile');

/**
 * Assigns tickets to users based on skills, experience, and workload.
 * @param {Array} tickets - List of Tickets to assign
 * @param {Array} users - List of User objects (the team)
 * @returns {Promise<Array>} Assigned tickets with userId
 */
const matchTicketsToUsers = async (tickets, users) => {
    const profiles = await UserSkillProfile.find({ user: { $in: users.map(u => u._id) } });

    // Track local workload during the assignment process to avoid overloading one person in a single batch
    const localWorkload = {};
    profiles.forEach(p => {
        localWorkload[p.user.toString()] = p.currentWorkload || 0;
    });

    return tickets.map(ticket => {
        let bestScore = -1;
        let bestUser = null;

        users.forEach(user => {
            const userId = user._id.toString();
            const profile = profiles.find(p => p.user.toString() === userId) || {
                skills: [],
                experienceLevel: 'intermediate',
                currentWorkload: 0
            };

            const currentWorkload = localWorkload[userId] || 0;

            // 1. Skill Match (0.6) - Fuzzy Matching
            let skillScore = 0;
            if (ticket.skillsRequired && ticket.skillsRequired.length > 0) {
                const matchedCount = ticket.skillsRequired.filter(reqSkill => {
                    const reqLower = reqSkill.toLowerCase();
                    return profile.skills.some(userSkill => {
                        const userLower = userSkill.toLowerCase();
                        return reqLower.includes(userLower) || userLower.includes(reqLower);
                    });
                }).length;
                skillScore = matchedCount / ticket.skillsRequired.length;
            } else {
                skillScore = 0.5; // Neutral if no skills required
            }

            // 2. Experience Level (0.2)
            const expWeight = { 'senior': 1.0, 'intermediate': 0.7, 'junior': 0.4 };
            const expScore = expWeight[profile.experienceLevel] || 0.7;

            // 3. Workload Availability (0.2)
            // Soft limit of 5-7 tickets per person
            const maxWorkload = 8;
            let workloadScore = Math.max(0, (maxWorkload - currentWorkload) / maxWorkload);
            
            // Hard penalty for overloading
            if (currentWorkload >= 6) {
                workloadScore *= 0.5;
            }
            if (currentWorkload >= 10) {
                workloadScore = 0; // Avoid assigning to severely overloaded members
            }

            const totalScore = (skillScore * 0.6) + (expScore * 0.2) + (workloadScore * 0.2);

            if (totalScore > bestScore) {
                bestScore = totalScore;
                bestUser = user._id;
            }
        });

        // If a user was found, increment their local workload for the next ticket in the loop
        if (bestUser) {
            const bestUserId = bestUser.toString();
            localWorkload[bestUserId] = (localWorkload[bestUserId] || 0) + 1;
        }

        return { 
            ...(ticket.toObject ? ticket.toObject() : ticket), 
            assignedUser: bestUser, 
            matchScore: bestScore 
        };
    });
};

module.exports = { matchTicketsToUsers };
