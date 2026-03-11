const UserSkillProfile = require('../models/UserSkillProfile');

/**
 * Assigns tickets to users based on skills, experience, and workload.
 * @param {Array} tickets - List of Tickets to assign
 * @param {Array} users - List of User objects (the team)
 * @returns {Array} Assigned tickets with userId
 */
const matchTicketsToUsers = async (tickets, users) => {
    const profiles = await UserSkillProfile.find({ user: { $in: users.map(u => u._id) } });

    return tickets.map(ticket => {
        let bestScore = -1;
        let bestUser = null;

        users.forEach(user => {
            const profile = profiles.find(p => p.user.toString() === user._id.toString()) || {
                skills: [],
                experienceLevel: 'intermediate',
                currentWorkload: 0
            };

            // 1. Skill Match (0.6)
            const matchedSkills = ticket.skillsRequired.filter(s => profile.skills.includes(s));
            const skillScore = ticket.skillsRequired.length > 0
                ? matchedSkills.length / ticket.skillsRequired.length
                : 1;

            // 2. Experience Level (0.2)
            const expWeight = { 'senior': 1.0, 'intermediate': 0.7, 'junior': 0.4 };
            const expScore = expWeight[profile.experienceLevel] || 0.7;

            // 3. Workload Availability (0.2)
            // Assuming max workload is 10 for simplicity
            const workloadScore = Math.max(0, (10 - (profile.currentWorkload || 0)) / 10);

            const totalScore = (skillScore * 0.6) + (expScore * 0.2) + (workloadScore * 0.2);

            if (totalScore > bestScore) {
                bestScore = totalScore;
                bestUser = user._id;
            }
        });

        return { ...ticket, assignedUser: bestUser, matchScore: bestScore };
    });
};

module.exports = { matchTicketsToUsers };
