const generateTimeline = (sprints, tickets) => {
    // If AI already generated dates, use them directly instead of algorithmic scheduling
    if (sprints.length > 0 && sprints[0].startDate && tickets.length > 0 && tickets[0].startDate) {
        return { updatedSprints: sprints, updatedTickets: tickets };
    }

    const sprintDurationDays = 14; // Default 2 weeks
    let currentStartDate = new Date();

    const updatedSprints = sprints.map((sprint) => {
        const sprintObj = sprint.toObject ? sprint.toObject() : sprint;
        const startDate = new Date(currentStartDate);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + sprintDurationDays - 1); // Exact 14 days

        // Update currentStartDate for next sprint
        currentStartDate = new Date(endDate);
        currentStartDate.setDate(currentStartDate.getDate() + 1);

        return {
            ...sprintObj,
            startDate,
            endDate
        };
    });

    const updatedTickets = tickets.map(ticket => {
        const ticketObj = ticket.toObject ? ticket.toObject() : ticket;
        
        // Match by ID or Name (with fallback for sprint object)
        const sprintId = ticketObj.sprint?._id || ticketObj.sprint;
        
        const sprint = updatedSprints.find(s => 
            (s._id && sprintId && String(s._id) === String(sprintId)) ||
            (s.name && ticketObj.sprintName && String(s.name).toLowerCase().trim() === String(ticketObj.sprintName).toLowerCase().trim())
        );
        
        if (sprint) {
            // Find relative index of this ticket in its sprint to stagger dates
            const ticketsInThisSprint = tickets.filter(t => {
                const tObj = t.toObject ? t.toObject() : t;
                const tsId = tObj.sprint?._id || tObj.sprint;
                return (sprint._id && tsId && String(sprint._id) === String(tsId)) ||
                       (sprint.name && tObj.sprintName && String(sprint.name).toLowerCase().trim() === String(tObj.sprintName).toLowerCase().trim());
            });

            const indexInSprint = ticketsInThisSprint.findIndex(t => {
                const tObj = t.toObject ? t.toObject() : t;
                return String(tObj._id) === String(ticketObj._id);
            });

            // Calculate granular dates within the sprint
            // Spread tickets evenly across the sprint
            const daysInSprint = 14;
            const daysPerTicket = Math.max(1, Math.floor(daysInSprint / Math.max(1, ticketsInThisSprint.length)));
            
            const ticketStart = new Date(sprint.startDate);
            ticketStart.setDate(ticketStart.getDate() + (indexInSprint * daysPerTicket));
            
            const ticketEnd = new Date(ticketStart);
            ticketEnd.setDate(ticketEnd.getDate() + daysPerTicket - 1);

            // Cap at sprint end
            if (ticketEnd > sprint.endDate) {
                ticketEnd.setTime(sprint.endDate.getTime());
            }

            return {
                ...ticketObj,
                startDate: ticketStart,
                endDate: ticketEnd
            };
        }
        return ticketObj;
    });

    return { updatedSprints, updatedTickets };
};

module.exports = { generateTimeline };
