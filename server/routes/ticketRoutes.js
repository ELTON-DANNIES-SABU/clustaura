const express = require('express');
const router = express.Router();
const { getTicketSuggestions, assignTicketManually, autoAssignTickets } = require('../controllers/ticketController');
const { protect } = require('../middleware/authMiddleware');

router.get('/:ticketId/suggestions', protect, getTicketSuggestions);
router.post('/assign', protect, assignTicketManually);
router.post('/auto-assign/:projectId', protect, autoAssignTickets);

module.exports = router;
