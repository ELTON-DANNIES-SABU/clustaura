/**
 * Workload Optimizer Agent
 * Responsibilities:
 * - Calculate member utilization (Load / Capacity)
 * - Detect Overloaded (>120%) and Underutilized (<70%) members
 * - Suggest load balancing moves
 */

const OPTIMIZER_RULES = {
    OVERLOAD_THRESHOLD: 1.20, // 120%
    UNDERLOAD_THRESHOLD: 0.70, // 70%
    DEFAULT_CAPACITY: 10 // Default story points capacity if unknown
};

const optimizeWorkload = (users, issues, userVelocities = {}) => {
    const analysis = {
        userLoad: {},
        overloaded: [],
        underutilized: [],
        suggestions: []
    };

    // 1. Calculate Load per User
    const loadMap = {};
    users.forEach(u => loadMap[u._id.toString()] = 0);

    issues.forEach(issue => {
        if (issue.assignee && issue.storyPoints) {
            const uid = issue.assignee.toString();
            if (loadMap[uid] !== undefined) {
                loadMap[uid] += issue.storyPoints;
            }
        }
    });

    // 2. Analyze Utilization
    users.forEach(user => {
        const uid = user._id.toString();
        const load = loadMap[uid];
        const capacity = userVelocities[uid] || OPTIMIZER_RULES.DEFAULT_CAPACITY;

        const utilization = capacity > 0 ? (load / capacity) : 1.0; // Avoid div by zero
        const utilPercent = Math.round(utilization * 100);

        analysis.userLoad[uid] = {
            name: `${user.firstName} ${user.lastName}`,
            load,
            capacity,
            utilization: utilPercent
        };

        if (utilization > OPTIMIZER_RULES.OVERLOAD_THRESHOLD) {
            analysis.overloaded.push({ id: uid, name: analysis.userLoad[uid].name, load, capacity, utilPercent });
        } else if (utilization < OPTIMIZER_RULES.UNDERLOAD_THRESHOLD) {
            analysis.underutilized.push({ id: uid, name: analysis.userLoad[uid].name, load, capacity, utilPercent });
        }
    });

    // 3. Generate Move Suggestions
    // Very simple greedy algorithm: Take from biggest overload -> Give to biggest underload
    // Filter overloaded and underutilized lists
    let givers = [...analysis.overloaded].sort((a, b) => b.utilPercent - a.utilPercent);
    let receivers = [...analysis.underutilized].sort((a, b) => a.utilPercent - b.utilPercent);

    if (givers.length > 0 && receivers.length > 0) {
        givers.forEach(giver => {
            if (receivers.length === 0) return;
            const receiver = receivers[0]; // Most underutilized

            // Find a movable task? (In real logic we'd pick specific tasks)
            // Here we suggest a generic point move
            const pointsToShed = giver.load - giver.capacity;
            const receiverSpace = receiver.capacity - receiver.load;

            const moveAmount = Math.min(pointsToShed, receiverSpace);

            if (moveAmount > 0) {
                analysis.suggestions.push({
                    type: 'MOVE_WORK',
                    fromUser: giver.name,
                    toUser: receiver.name,
                    points: moveAmount,
                    reason: `Balance load: ${giver.name} is at ${giver.utilPercent}% capacity.`
                });

                // Adjust virtual load for next iteration logic
                receiver.load += moveAmount;
                if (receiver.load >= receiver.capacity * 0.9) receivers.shift(); // Remove if full
            }
        });
    }

    return analysis;
};

module.exports = {
    optimizeWorkload
};
