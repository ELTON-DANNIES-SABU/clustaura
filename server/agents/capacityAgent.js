const UserSkillProfile = require('../models/UserSkillProfile');

/**
 * Analyzes team capacity and identifies missing skills or overloads.
 * @param {Array} tickets - New tickets to be assigned
 * @param {Array} users - Team members
 * @returns {Object} { overloadedMembers, missingSkills, recommendations }
 */
const analyzeCapacity = async (tickets, users) => {
    const profiles = await UserSkillProfile.find({ user: { $in: users.map(u => u._id) } });

    const requiredSkills = [...new Set(tickets.flatMap(t => t.skillsRequired))];
    const teamSkills = [...new Set(profiles.flatMap(p => p.skills))];

    const missingSkills = requiredSkills.filter(s => !teamSkills.includes(s));

    const overloadedMembers = profiles
        .filter(p => p.currentWorkload >= 8) // Threshold 8
        .map(p => ({
            userId: p.user,
            workload: p.currentWorkload
        }));

    const recommendations = [];
    if (missingSkills.length > 0) {
        recommendations.push(`Consider adding developers with skills: ${missingSkills.join(', ')}`);
    }
    if (overloadedMembers.length > 0) {
        recommendations.push(`Team members are reaching capacity. Reassign tasks or increase team size.`);
    }

    return {
        overloadedMembers,
        missingSkills,
        recommendations
    };
};

module.exports = { analyzeCapacity };
