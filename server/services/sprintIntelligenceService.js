/**
 * Sprint Intelligence Service (Facade)
 * Orchestrates Board Analyzer, Workload Optimizer, and Sprint Predictor.
 */
const mongoose = require('mongoose');
const Issue = require('../models/Issue');
const Sprint = require('../models/Sprint');
const User = require('../models/User');
const Project = require('../models/Project');

const boardAnalyzer = require('./ai/boardAnalyzer');
const workloadOptimizer = require('./ai/workloadOptimizer');
const sprintPredictor = require('./ai/sprintPredictor');

const velocityAgent = require('./ai/velocityAgent');
const dependencyAgent = require('./ai/dependencyAgent');
const riskAgent = require('./ai/riskAgent');
const taskAgent = require('./ai/taskAgent');
const simulationAgent = require('./ai/simulationAgent');
const teamAgent = require('./ai/teamAgent');
const SprintHistory = require('../models/SprintHistory');

const getSprintInsights = async (sprintId) => {
    try {
        // 1. Fetch Data
        const sprint = await Sprint.findById(sprintId).populate('project');
        if (!sprint) throw new Error('Sprint not found');

        const issues = await Issue.find({ sprint: sprintId })
            .populate('assignee', 'firstName lastName email')
            .lean();

        const project = await Project.findById(sprint.project._id);
        const columns = project ? project.columns : ['To Do', 'In Progress', 'Done'];

        // Get Unique Users
        const userIds = [...new Set(issues.map(i => i.assignee?._id.toString()).filter(Boolean))];
        const users = await User.find({ _id: { $in: userIds } }).select('firstName lastName email');

        // Fetch Velocity History
        const history = await SprintHistory.find({
            teamOrProjectCode: project ? project.key : 'UNKNOWN'
        });

        // 2. Execute Agents

        // A. Core Analysis
        const boardAnalysis = boardAnalyzer.analyzeBoard(issues, columns);

        // B. Velocity Learning (New)
        const velocityAnalysis = velocityAgent.calculateVelocity(history);

        // C. Workload Optimization (Enhanced with Velocity)
        // Use learned velocity if high confidence, else default
        const userVelocities = {};
        users.forEach(u => {
            // Simplified: distribute team velocity per user or use individual history if we had it
            // For now, assume Avg / Users
            userVelocities[u._id.toString()] = velocityAnalysis.confidence === 'high'
                ? (velocityAnalysis.forecast / (users.length || 1))
                : 10;
        });
        const workloadAnalysis = workloadOptimizer.optimizeWorkload(users, issues, userVelocities);

        // D. Dependency & Risk (New)
        const depAnalysis = dependencyAgent.analyzeDependencies(issues);
        const riskAnalysis = riskAgent.analyzeRisk(sprint, issues);

        // E. Prediction (Enhanced)
        let totalCapacity = 0;
        Object.values(workloadAnalysis.userLoad).forEach(u => totalCapacity += u.capacity);

        const prediction = sprintPredictor.predictSprint(
            issues,
            totalCapacity,
            boardAnalysis.stuckTasks.length,
            boardAnalysis.stats.blockedCount
        );

        // Adjust risk with new factors
        const finalRiskLevel = riskAnalysis.alerts.some(a => a.level === 'CRITICAL')
            ? 'HIGH'
            : prediction.riskLevel;

        const narrative = generateNarrative({
            prediction, boardAnalysis, workloadAnalysis, velocityAnalysis, riskAnalysis, depAnalysis
        });

        return {
            sprintId,
            timestamp: new Date(),
            health: {
                riskLevel: finalRiskLevel,
                score: prediction.riskScore,
                probability: prediction.successProbability
            },
            velocity: velocityAnalysis,
            dependencies: {
                criticalPath: depAnalysis.criticalPath,
                warnings: depAnalysis.dependencyCount > 5 ? ['High complexity detected'] : []
            },
            riskAlerts: riskAnalysis.alerts,
            bottlenecks: boardAnalysis.bottlenecks,
            stuckTasks: boardAnalysis.stuckTasks,
            userLoad: workloadAnalysis.userLoad,
            suggestions: workloadAnalysis.suggestions,
            narrative
        };

    } catch (error) {
        console.error('Sprint Intelligence Error:', error);
        throw error;
    }
};

// Helper for Narrative Generation
const generateNarrative = (context) => {
    let text = `Success Probability: ${context.prediction.successProbability}% (${context.prediction.riskLevel}). `;

    if (context.velocityAnalysis.trend === 'declining') {
        text += `Team velocity is declining. `;
    }

    if (context.riskAnalysis.alerts.length > 0) {
        text += `⚠️ ${context.riskAnalysis.alerts.length} deadline alerts active. `;
    }

    if (context.depAnalysis.criticalPath.length > 3) {
        text += `Critical path has ${context.depAnalysis.criticalPath.length} dependent tasks. `;
    }

    if (context.workloadAnalysis.overloaded.length > 0) {
        const victim = context.workloadAnalysis.overloaded[0];
        text += `${victim.name} is overloaded (${victim.utilPercent}%). `;
    }

    return text;
};

// New functions for specific endpoints
const getVelocityForecast = async (projectCode) => {
    const history = await SprintHistory.find({ teamOrProjectCode: projectCode });
    return velocityAgent.calculateVelocity(history);
};

const getCriticalPath = async (sprintId) => {
    const issues = await Issue.find({ sprint: sprintId });
    return dependencyAgent.analyzeDependencies(issues);
};

const splitTask = async (taskId) => {
    const issue = await Issue.findById(taskId);
    if (!issue) throw new Error('Task not found');
    return taskAgent.splitTask(issue);
};

const composeSprint = async (sprintId, capacity) => {
    // Fetch project's backlog (issues with no sprint or in backlog status)
    const sprint = await Sprint.findById(sprintId);
    if (!sprint) throw new Error('Sprint not found');

    // Assuming simple query for backlog
    const backlog = await Issue.find({ project: sprint.project, sprint: { $exists: false } });
    return taskAgent.composeSprint(backlog, capacity);
};

const runSimulation = async (sprintId, action) => {
    const issues = await Issue.find({ sprint: sprintId }).populate('assignee');
    // We need users for capacity
    const userIds = [...new Set(issues.map(i => i.assignee?._id.toString()).filter(Boolean))];
    const users = await User.find({ _id: { $in: userIds } });

    return simulationAgent.runSimulation(issues, users, action);
};

const proposeTeam = async (requirements) => {
    // Fetch all users or filter by some criteria?
    // fetching top 50 for now
    const users = await User.find().limit(50);
    return teamAgent.proposeTeam(users, requirements);
};

module.exports = {
    getSprintInsights,
    getVelocityForecast,
    getCriticalPath,
    splitTask,
    composeSprint,
    runSimulation,
    proposeTeam
};
