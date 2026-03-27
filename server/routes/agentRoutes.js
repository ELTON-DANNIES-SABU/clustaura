const express = require('express');
const router = express.Router();
const { 
    analyzeProjectPlan, 
    improviseProjectPlan, 
    assignTickets, 
    getTeamAnalysis, 
    getFullPlan, 
    getSuggestedTeam,
    getTickets
} = require('../controllers/agentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/analyze-project', protect, analyzeProjectPlan);
router.post('/improvise-project', protect, improviseProjectPlan);
router.post('/assign-tickets', protect, assignTickets);
router.get('/team-analysis/:projectId', protect, getTeamAnalysis);
router.get('/full-plan/:projectId', protect, getFullPlan);
router.get('/suggest-team/:projectId', protect, getSuggestedTeam);
router.get('/tickets/:projectId', protect, getTickets);

module.exports = router;
