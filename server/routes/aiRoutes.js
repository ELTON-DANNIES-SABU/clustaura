const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getSprintInsights, getVelocityForecast, getCriticalPath,
    splitTask, composeSprint, runSimulation, proposeTeam
} = require('../controllers/aiController');

router.get('/sprint/:id/insights', protect, getSprintInsights);
router.post('/velocity/forecast', protect, getVelocityForecast);
router.get('/risk/critical-path', protect, getCriticalPath);
router.post('/tasks/split', protect, splitTask);
router.post('/sprints/compose', protect, composeSprint);
router.post('/simulation/run', protect, runSimulation);
router.post('/teams/propose', protect, proposeTeam);

module.exports = router;
