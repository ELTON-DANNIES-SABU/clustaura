/**
 * Risk Agent
 * Responsibilities:
 * - Detect Deadline Proximity (< 5 days)
 * - Detect Scope Creep (Total points increased mid-sprint)
 */

const RISK_RULES = {
    DEADLINE_WARNING_DAYS: 5,
    DANGER_DAYS: 2
};

const analyzeRisk = (sprint, issues) => {
    const alerts = [];
    const now = new Date();

    // 1. Sprint Deadline
    if (sprint && sprint.endDate) {
        const end = new Date(sprint.endDate);
        const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));

        // Calculate % complete
        const totalPoints = issues.reduce((acc, i) => acc + (i.storyPoints || 0), 0);
        const donePoints = issues
            .filter(i => i.status === 'Done') // Assuming 'Done' status
            .reduce((acc, i) => acc + (i.storyPoints || 0), 0);

        const percentDone = totalPoints > 0 ? (donePoints / totalPoints) : 0;

        if (daysLeft <= RISK_RULES.DEADLINE_WARNING_DAYS && daysLeft > 0) {
            if (percentDone < 0.5) {
                alerts.push({
                    level: 'HIGH',
                    message: `Sprint ends in ${daysLeft} days but only ${Math.round(percentDone * 100)}% complete. High failure risk.`
                });
            } else if (percentDone < 0.8) {
                alerts.push({
                    level: 'MEDIUM',
                    message: `Sprint ends in ${daysLeft} days. ${Math.round(percentDone * 100)}% complete.`
                });
            }
        } else if (daysLeft <= 0 && percentDone < 1) {
            alerts.push({
                level: 'CRITICAL',
                message: `Sprint is OVERDUE.`
            });
        }
    }

    // 2. Task Deadlines
    issues.forEach(i => {
        if (i.dueDate && i.status !== 'Done') {
            const due = new Date(i.dueDate);
            const daysToDue = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

            if (daysToDue <= RISK_RULES.DANGER_DAYS && daysToDue >= 0) {
                alerts.push({
                    level: 'HIGH',
                    message: `Task "${i.summary}" is due in ${daysToDue} days.`
                });
            }
        }
    });

    return {
        alerts,
        riskScoreModifier: alerts.length * 0.1 // Simple layout
    };
};

module.exports = {
    analyzeRisk
};
