/**
 * Sprint Predictor Agent
 * Responsibilities:
 * - Forecast completion probability
 * - Identify high-risk factors
 * - Formula: Risk = (Load / Forecast) * StuckFactor * DependencyFactor
 */

const predictSprint = (issues, totalCapacity, stuckCount, dependencyCount) => {
    let totalPoints = 0;
    issues.forEach(i => totalPoints += (i.storyPoints || 0));

    // Base Ratio
    const capacity = totalCapacity || 1; // Avoid div 0
    let riskScore = totalPoints / capacity; // > 1 means impossible baseline

    // Stuck Factor: Each stuck task adds 5% risk
    const stuckFactor = 1 + (stuckCount * 0.05);

    // Dependency Factor: Each dependency cycle/deadlock adds risk (simplified count here)
    // Assuming broad "blocked properties". 
    // If strict dependencies were passed, we'd check chains.
    // For now, assume dependencyCount comes from an analysis of blocked items
    const depFactor = 1 + (dependencyCount * 0.02);

    const finalRisk = riskScore * stuckFactor * depFactor;

    // Categorize
    let riskLevel = 'LOW';
    let probability = 90; // Base success chance

    if (finalRisk > 1.2) {
        riskLevel = 'HIGH';
        probability = Math.max(10, 100 - (finalRisk * 40));
    } else if (finalRisk > 0.9) {
        riskLevel = 'MEDIUM';
        probability = Math.max(40, 100 - (finalRisk * 30));
    } else {
        probability = Math.min(99, 100 - (finalRisk * 10)); // Even underload has some risk (Parkinson's law)
    }

    return {
        totalPoints,
        capacity,
        riskScore: parseFloat(finalRisk.toFixed(2)),
        riskLevel,
        successProbability: Math.round(probability),
        factors: {
            load: parseFloat(riskScore.toFixed(2)),
            stuckImpact: parseFloat(stuckFactor.toFixed(2)),
            depImpact: parseFloat(depFactor.toFixed(2))
        }
    };
};

module.exports = {
    predictSprint
};
