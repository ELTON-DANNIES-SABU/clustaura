/**
 * Team Agent (Social Intelligence)
 * Responsibilities:
 * - Propose Teams based on skills/reputation
 */

const proposeTeam = async (users, requirements) => {
    // requirements: { skills: ['React', 'Node'], count: 2 }

    // 1. Filter by skills (Assuming user has skills field, mocked for now)
    const specialized = users.filter(u => {
        // Mock matching logic
        return true;
    });

    // 2. Sort by Reputation/Compatibility
    // Assuming 'reputation' or 'credits' field
    const ranked = specialized.sort((a, b) => (b.creditStars || 0) - (a.creditStars || 0));

    // 3. Select Top N
    const selected = ranked.slice(0, requirements.count || 3);

    return {
        proposedMembers: selected,
        reason: `Selected top ${selected.length} experts based on reputation and skill match.`
    };
};

module.exports = {
    proposeTeam
};
