/**
 * Task Agent (The Hands)
 * Responsibilities:
 * - Smart Task Splitter: Break large stories into subtasks
 * - Smart Sprint Composer: Recommend backlog items to fill capacity
 */

// Simple Knapsack-like greedy fallback
const composeSprint = (backlogIssues, remainingCapacity, userSkills = {}) => {
    // Sort by priority then business value
    // Assuming priority is numeric or mapped elsewhere. 
    // For now, simpler: map 'highest'->5, 'high'->4...
    const pMap = { highest: 5, high: 4, medium: 3, low: 2, lowest: 1 };

    const sorted = [...backlogIssues].sort((a, b) => {
        const pA = pMap[a.priority] || 0;
        const pB = pMap[b.priority] || 0;
        return pB - pA; // Descending priority
    });

    const recommended = [];
    let filled = 0;

    for (const issue of sorted) {
        const points = issue.storyPoints || 0;
        if (filled + points <= remainingCapacity) {
            recommended.push(issue);
            filled += points;
        }
    }

    return {
        recommended,
        filledPoints: filled,
        remainingCapacity: remainingCapacity - filled
    };
};

const splitTask = (task, parts = []) => {
    // parts: [{ name: 'API', percent: 30 }, { name: 'DB', percent: 40 }]
    const totalPoints = task.storyPoints || 0;

    // If no specific parts provided, use default generic split
    const splitConfig = parts.length > 0 ? parts : [
        { name: 'Backend/API', percent: 40 },
        { name: 'Frontend', percent: 40 },
        { name: 'Testing', percent: 20 }
    ];

    const subtasks = splitConfig.map(part => {
        const points = Math.round(totalPoints * (part.percent / 100));
        return {
            summary: `${task.summary} - ${part.name}`,
            description: `Subtask for ${task.summary}. Focus: ${part.name}`,
            storyPoints: points || 1, // Min 1
            priority: task.priority,
            type: 'subtask',
            parentIssue: task._id
        };
    });

    return subtasks;
};

module.exports = {
    composeSprint,
    splitTask
};
