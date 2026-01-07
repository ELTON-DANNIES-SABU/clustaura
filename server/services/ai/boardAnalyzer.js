/**
 * Board Analyzer Agent
 * Responsibilities:
 * - Detect stage bottlenecks (>40% of items in one non-final stage)
 * - Detect stuck cards (>6 days in same stage)
 * - Detect blocked items (>15% of sprint)
 */

const ANALYZER_RULES = {
    STUCK_THRESHOLD_MS: 6 * 24 * 60 * 60 * 1000, // 6 Days
    BOTTLENECK_PERCENT: 0.40, // 40%
    CRITICAL_BLOCKED_PERCENT: 0.15 // 15%
};

const analyzeBoard = (issues, columns) => {
    const analysis = {
        bottlenecks: [],
        stuckTasks: [],
        warnings: [],
        stats: {
            total: issues.length,
            blockedCount: 0,
            byStage: {}
        }
    };

    if (!issues || issues.length === 0) return analysis;

    // Initialize counts
    columns.forEach(col => analysis.stats.byStage[col] = 0);
    analysis.stats.byStage['Unknown'] = 0;

    const now = new Date();

    issues.forEach(issue => {
        // 1. Stage Counts
        const stage = issue.status || 'Unknown';
        analysis.stats.byStage[stage] = (analysis.stats.byStage[stage] || 0) + 1;

        // 2. Detect Stuck Tasks
        const lastUpdate = new Date(issue.updatedAt);
        const ageInStage = now - lastUpdate;

        // Only consider stuck if not in the final "Done" stage (assuming last column is Done)
        const isDoneStage = columns.length > 0 && stage === columns[columns.length - 1];

        if (!isDoneStage && ageInStage > ANALYZER_RULES.STUCK_THRESHOLD_MS) {
            analysis.stuckTasks.push({
                id: issue._id,
                title: issue.summary,
                stage: stage,
                daysStuck: Math.floor(ageInStage / (1000 * 60 * 60 * 24))
            });
        }

        // 3. Count Blocked (Assuming isBlocked flag or high priority + stuck?)
        // Contrived logic: If usage passes 'isBlocked' or we infer it
        if (issue.isBlocked) {
            analysis.stats.blockedCount++;
        }
    });

    // 4. Detect Bottlenecks
    Object.entries(analysis.stats.byStage).forEach(([stage, count]) => {
        const percentage = count / analysis.stats.total;
        const isDoneStage = columns.length > 0 && stage === columns[columns.length - 1];

        if (!isDoneStage && percentage > ANALYZER_RULES.BOTTLENECK_PERCENT) {
            analysis.bottlenecks.push({
                stage: stage,
                count: count,
                percentage: Math.round(percentage * 100)
            });
            analysis.warnings.push(`Bottleneck detected in '${stage}': ${Math.round(percentage * 100)}% of tasks.`);
        }
    });

    // 5. Critical Blocked Check
    if ((analysis.stats.blockedCount / analysis.stats.total) > ANALYZER_RULES.CRITICAL_BLOCKED_PERCENT) {
        analysis.warnings.push(`CRITICAL: Over 15% of sprint tasks are blocked.`);
    }

    return analysis;
};

module.exports = {
    analyzeBoard
};
