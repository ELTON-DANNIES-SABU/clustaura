/**
 * Dependency Agent
 * Responsibilities:
 * - Build Dependency Graph
 * - Identify Critical Path (Longest chain of dependent tasks)
 * - Suggest Parallelizable groups
 */

const analyzeDependencies = (issues) => {
    // 1. Build Graph
    // Assuming issues have 'linkedIssues' or 'blocks' field. 
    // Adapting to standard Jira-like structure: issue.links -> [ { type: 'blocks', issueId: '...' } ]
    // Since our mock Issue model might be simple, we'll check for a 'blocks' array of IDs.

    const graph = {};
    const reverseGraph = {}; // To find roots
    const issueMap = {};

    issues.forEach(i => {
        issueMap[i._id.toString()] = i;
        if (!graph[i._id.toString()]) graph[i._id.toString()] = [];

        // Mocking dependency field check
        if (i.blocks && Array.isArray(i.blocks)) {
            i.blocks.forEach(blockedId => {
                graph[i._id.toString()].push(blockedId.toString());

                if (!reverseGraph[blockedId.toString()]) reverseGraph[blockedId.toString()] = [];
                reverseGraph[blockedId.toString()].push(i._id.toString());
            });
        }
    });

    // 2. Find Critical Path (Longest path by node count, or sum of story points)
    // Simple DFS for longest path
    let longestPath = [];
    let maxPoints = 0;

    const dfs = (currentId, path, currentPoints) => {
        const issue = issueMap[currentId];
        if (!issue) return;

        const newPath = [...path, issue.summary]; // Store titles
        const newPoints = currentPoints + (issue.storyPoints || 1);

        if (newPoints > maxPoints) {
            maxPoints = newPoints;
            longestPath = newPath;
        }

        const neighbors = graph[currentId] || [];
        neighbors.forEach(nextId => {
            if (!path.includes(issueMap[nextId]?.summary)) { // Avoid cycles
                dfs(nextId, newPath, newPoints);
            }
        });
    };

    // Start DFS from all nodes that are not blocked (roots)
    Object.keys(issueMap).forEach(id => {
        if (!reverseGraph[id] || reverseGraph[id].length === 0) {
            dfs(id, [], 0);
        }
    });

    // 3. Find Parallelizable Groups
    // Sets of tasks with NO dependencies between them
    // Simplified: Tasks with in-degree 0 and out-degree 0 are fully independent parallel set
    const independent = issues.filter(i => {
        const id = i._id.toString();
        const hasIncoming = reverseGraph[id] && reverseGraph[id].length > 0;
        const hasOutgoing = graph[id] && graph[id].length > 0;
        return !hasIncoming && !hasOutgoing;
    }).map(i => i.summary);

    return {
        criticalPath: longestPath,
        criticalPathLength: maxPoints,
        parallelGroups: [independent], // Just one group of fully independent for now
        dependencyCount: Object.values(graph).reduce((acc, curr) => acc + curr.length, 0)
    };
};

module.exports = {
    analyzeDependencies
};
