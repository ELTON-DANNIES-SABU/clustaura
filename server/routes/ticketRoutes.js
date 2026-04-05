const express = require('express');
const router = express.Router();
const { getTicketSuggestions, assignTicketManually, autoAssignTickets, updateTicket, deleteTicket } = require('../controllers/ticketController');
const { protect } = require('../middleware/authMiddleware');

router.get('/:ticketId/suggestions', protect, getTicketSuggestions);
router.post('/assign', protect, assignTicketManually);
router.post('/auto-assign/:projectId', protect, autoAssignTickets);
router.put('/:ticketId', protect, updateTicket);
router.delete('/:ticketId', protect, deleteTicket);

module.exports = router;
