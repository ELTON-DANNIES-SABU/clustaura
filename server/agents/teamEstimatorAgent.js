/**
 * Estimates workforce requirements based on project modules and tickets.
 */
const estimateWorkforce = async (projectId, tickets, technologies) => {
    const techRequirements = {};

    // 1. Group tickets by technology
    // We'll use a simple heuristic: match ticket's skillsRequired to technologies
    technologies.forEach(tech => {
        techRequirements[tech] = {
            tickets: 0,
            requiredDevelopers: 0
        };
    });

    tickets.forEach(ticket => {
        ticket.skillsRequired.forEach(skill => {
            if (techRequirements[skill]) {
                techRequirements[skill].tickets++;
            }
        });
    });

    // 2. Apply Rule: 1 developer per 10 tickets per sprint
    // Assuming a standard project has about 2-3 sprints initially
    const sprintCount = 3; 
    const ticketsPerDevPerSprint = 10;

    const summary = technologies.map(tech => {
        const ticketCount = techRequirements[tech].tickets;
        const required = Math.ceil(ticketCount / (sprintCount * ticketsPerDevPerSprint)) || 1;
        
        return {
            project: projectId,
            technology: tech,
            requiredDevelopers: required,
            currentDevelopers: 0, // Will be updated in controller based on actual members
            gap: required
        };
    });

    return summary;
};

module.exports = { estimateWorkforce };
