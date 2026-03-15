const express = require('express');
const router = express.Router();
const { analyzeProjectPlan, improviseProjectPlan, assignTickets, getTeamAnalysis, getFullPlan, getSuggestedTeam } = require('../controllers/agentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/analyze-project', protect, analyzeProjectPlan);
router.post('/improvise-project', protect, improviseProjectPlan);
router.post('/assign-tickets', protect, assignTickets);
router.get('/team-analysis/:projectId', protect, getTeamAnalysis);
router.get('/full-plan/:projectId', protect, getFullPlan);
router.get('/suggest-team/:projectId', protect, getSuggestedTeam);
router.get('/tickets/:projectId', protect, async (req, res) => {
    try {
        const { sprint } = req.query;
        const query = { project: req.params.projectId };
        if (sprint) query.sprint = sprint;
        const Ticket = require('../models/Ticket');
        const tickets = await Ticket.find(query).populate('assignedUser', 'firstName lastName avatar');
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
