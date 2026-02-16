/**
 * Simulation Agent (What-If Simulator)
 * Responsibilities:
 * - Apply hypothetical changes to board state
 * - Re-run analyses (Workload, Risk)
 * - Return delta (Did risk go down?)
 */

// We need to re-import the analyzers to run them on hypothetical data
const workloadOptimizer = require('./workloadOptimizer');
const sprintPredictor = require('./sprintPredictor');

const runSimulation = (currentIssues, users, action) => {
    // Deep copy to avoid mutating real data in memory reference
    const simulatedIssues = JSON.parse(JSON.stringify(currentIssues));

    // Apply Action
    let description = '';

    if (action.type === 'MOVE_TASK') {
        const { taskId, toUserId } = action;
        const issue = simulatedIssues.find(i => i._id === taskId || i._id.toString() === taskId);
        if (issue) {
            const user = users.find(u => u._id.toString() === toUserId);
            issue.assignee = user; // Simulating assignment
            description = `Moved task "${issue.summary}" to ${user ? user.firstName : 'Unknown'}`;
        }
    } else if (action.type === 'CHANGE_POINTS') {
        const { taskId, newPoints } = action;
        const issue = simulatedIssues.find(i => i._id === taskId || i._id.toString() === taskId);
        if (issue) {
            issue.storyPoints = newPoints;
            description = `Changed points of "${issue.summary}" to ${newPoints}`;
        }
    }

    // Re-Analyze
    // Simplified Workload Analysis (No velocity history needed for quick sim, assume default/current)
    const workloadAnalysis = workloadOptimizer.optimizeWorkload(users, simulatedIssues, {});

    // Re-Predict
    let totalCapacity = 0;
    Object.values(workloadAnalysis.userLoad).forEach(u => totalCapacity += u.capacity);

    // Assuming stuck/blocked didn't change for this simple sim
    const stuckCount = simulatedIssues.filter(i => false).length; // complicated to recalculate age
    const blockedCount = 0;

    const prediction = sprintPredictor.predictSprint(
        simulatedIssues,
        totalCapacity,
        stuckCount, // Pass 0 or keep original? Keeping 0 for now as 'best case' or need original params
        blockedCount
    );

    return {
        description,
        simulatedHealth: {
            riskLevel: prediction.riskLevel,
            probability: prediction.successProbability
        },
        simulatedLoad: workloadAnalysis.userLoad
    };
};

module.exports = {
    runSimulation
};
