const teamAssignmentService = require('../services/teamAssignmentService');
const Ticket = require('../models/Ticket');

// @desc    Get suggested developers for a ticket
// @route   GET /api/tickets/:ticketId/suggestions
// @access  Private
const getTicketSuggestions = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { projectId } = req.query;

        if (!projectId) {
            return res.status(400).json({ message: 'Project ID is required' });
        }

        const suggestions = await teamAssignmentService.getSuggestedDevelopers(ticketId, projectId);
        res.json(suggestions);
    } catch (error) {
        console.error('Get Ticket Suggestions Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Assign ticket to a developer
// @route   POST /api/tickets/assign
// @access  Private
const assignTicketManually = async (req, res) => {
    try {
        const { ticketId, assignedUser } = req.body;

        if (!ticketId || !assignedUser) {
            return res.status(400).json({ message: 'Ticket ID and Assigned User ID are required' });
        }

        const ticket = await teamAssignmentService.assignTicket(ticketId, assignedUser);
        
        // Fetch populated ticket to return
        const populatedTicket = await Ticket.findById(ticket._id).populate('assignedUser', 'firstName lastName avatar email');

        res.json({
            message: 'Ticket assigned successfully',
            ticket: populatedTicket
        });
    } catch (error) {
        console.error('Assign Ticket Error:', error);
        res.status(400).json({ message: error.message });
    }
};

// @desc    Auto assign all pending tickets in a project
// @route   POST /api/tickets/auto-assign/:projectId
// @access  Private
const autoAssignTickets = async (req, res) => {
    try {
        const { projectId } = req.params;
        
        if (!projectId) {
            return res.status(400).json({ message: 'Project ID is required' });
        }

        const result = await teamAssignmentService.autoAssignProjectTickets(projectId);
        res.json(result);
    } catch (error) {
        console.error('Auto Assign Tickets Error:', error);
        res.status(500).json({ message: error.message || 'Failed to auto-assign tickets' });
    }
};

module.exports = {
    getTicketSuggestions,
    assignTicketManually,
    autoAssignTickets
};
