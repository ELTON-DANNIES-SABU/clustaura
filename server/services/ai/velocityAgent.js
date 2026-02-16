/**
 * Velocity Learning Agent
 * Responsibilities:
 * - Calculate Weighted Average Velocity (Last 5 sprints)
 * - Detect declining trends
 * - Forecast domain-specific capacity
 */

const calculateVelocity = (historyEntries) => {
    if (!historyEntries || historyEntries.length === 0) {
        return { forecast: 0, trend: 'stable', confidence: 'low' };
    }

    // Sort by date descending (newest first)
    const sorted = [...historyEntries].sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
    const recent = sorted.slice(0, 5); // Take last 5

    // Weighted Average: Most recent has highest weight
    let totalWeight = 0;
    let weightedSum = 0;

    // Domain sums
    let frontendSum = 0;
    let backendSum = 0;

    recent.forEach((entry, index) => {
        const weight = 5 - index; // 5, 4, 3, 2, 1
        totalWeight += weight;
        weightedSum += (entry.totalPointsCompleted * weight);

        frontendSum += (entry.breakdown?.frontend || 0);
        backendSum += (entry.breakdown?.backend || 0);
    });

    const forecast = Math.round(weightedSum / totalWeight);

    // Trend Analysis
    let trend = 'stable';
    if (recent.length >= 2) {
        const latest = recent[0].totalPointsCompleted;
        const previous = recent[1].totalPointsCompleted;
        if (latest < previous * 0.8) trend = 'declining';
        else if (latest > previous * 1.2) trend = 'improving';
    }

    // Domain Averages (Simple avg for now)
    const count = recent.length;

    return {
        forecast,
        trend,
        confidence: count >= 3 ? 'high' : 'medium',
        domains: {
            frontend: Math.round(frontendSum / count),
            backend: Math.round(backendSum / count)
        }
    };
};

module.exports = {
    calculateVelocity
};
