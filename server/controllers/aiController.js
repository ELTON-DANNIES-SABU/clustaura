const sprintIntelligenceService = require('../services/sprintIntelligenceService');

// @desc    Get Sprint Intelligence Insights
// @route   GET /api/ai/sprint/:id/insights
// @access  Private
const getSprintInsights = async (req, res) => {
    try {
        const { id } = req.params;
        const insights = await sprintIntelligenceService.getSprintInsights(id);
        res.json(insights);
    } catch (error) {
        console.error('API Error Get Insights:', error);
        res.status(500).json({ message: error.message || 'Failed to analyze sprint' });
    }
};

// @desc    Get Velocity Forecast
// @route   POST /api/ai/velocity/forecast
// @access  Private
const getVelocityForecast = async (req, res) => {
    try {
        const { projectCode } = req.body;
        const result = await sprintIntelligenceService.getVelocityForecast(projectCode);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Critical Path
// @route   GET /api/ai/risk/critical-path
// @access  Private
const getCriticalPath = async (req, res) => {
    try {
        const { sprintId } = req.query;
        if (!sprintId) return res.status(400).json({ message: 'Sprint ID required' });
        const result = await sprintIntelligenceService.getCriticalPath(sprintId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Split Task
// @route   POST /api/ai/tasks/split
// @access  Private
const splitTask = async (req, res) => {
    try {
        const { taskId } = req.body;
        const result = await sprintIntelligenceService.splitTask(taskId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Compose Sprint
// @route   POST /api/ai/sprints/compose
// @access  Private
const composeSprint = async (req, res) => {
    try {
        const { sprintId, capacity } = req.body;
        const result = await sprintIntelligenceService.composeSprint(sprintId, capacity);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Run Simulation
// @route   POST /api/ai/simulation/run
// @access  Private
const runSimulation = async (req, res) => {
    try {
        const { sprintId, action } = req.body;
        const result = await sprintIntelligenceService.runSimulation(sprintId, action);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Propose Team
// @route   POST /api/ai/teams/propose
// @access  Private
const proposeTeam = async (req, res) => {
    try {
        const { requirements } = req.body;
        const result = await sprintIntelligenceService.proposeTeam(requirements);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
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
