const Ticket = require('../models/Ticket');
const Project = require('../models/Project');
const teamAssignmentService = require('../services/teamAssignmentService');

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


        const io = req.app.get('io');
        if (io) {
            io.emit('ticketAssigned', populatedTicket);
        }

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
        
        const io = req.app.get('io');
        if (io) {
            io.emit('ticketsAutoAssigned', { projectId, ...result });
        }

        res.json(result);
    } catch (error) {
        console.error('Auto Assign Tickets Error:', error);
        res.status(500).json({ message: error.message || 'Failed to auto-assign tickets' });
    }
};

// @desc    Update ticket details (Manually by Owner/Lead)
// @route   PUT /api/tickets/:ticketId
// @access  Private
const updateTicket = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const updates = req.body;
        const userId = req.user._id;

        const ticket = await Ticket.findById(ticketId);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Authorization check
        const project = await Project.findById(ticket.project);
        const isOwner = project.owner.toString() === userId.toString();
        const isLead = project.members.some(m => m.user.toString() === userId.toString() && (m.role === 'lead' || m.role === 'Project Lead'));

        if (!isOwner && !isLead) {
            return res.status(403).json({ message: 'Only Project Owner or Lead can update tickets manually' });
        }

        // Allowed fields for manual update
        const allowedFields = ['title', 'summary', 'description', 'priority', 'type', 'startDate', 'endDate', 'status', 'assignedUser'];
        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                if (field === 'summary' && !updates['title']) {
                    ticket['title'] = updates[field]; // In many places we use title/summary interchangeably
                }
                ticket[field] = updates[field];
            }
        });

        ticket.updatedAt = Date.now();
        await ticket.save();

        const populatedTicket = await Ticket.findById(ticketId)
            .populate('assignedUser', 'firstName lastName avatar email')
            .populate('module', 'name')
            .populate('project', 'name');

        const io = req.app.get('io');
        if (io) {
            io.emit('ticketUpdated', populatedTicket);
        }

        res.json({
            message: 'Ticket updated successfully',
            ticket: populatedTicket
        });
    } catch (error) {
        console.error('Update Ticket Error:', error);
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a ticket
// @route   DELETE /api/tickets/:ticketId
// @access  Private
const deleteTicket = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const userId = req.user._id;

        const ticket = await Ticket.findById(ticketId);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Authorization check
        const project = await Project.findById(ticket.project);
        const isOwner = project.owner.toString() === userId.toString();
        const isLead = project.members.some(m => m.user.toString() === userId.toString() && (m.role === 'lead' || m.role === 'Project Lead'));

        if (!isOwner && !isLead) {
            return res.status(403).json({ message: 'Only Project Owner or Lead can delete tickets' });
        }

        await Ticket.findByIdAndDelete(ticketId);

        const io = req.app.get('io');
        if (io) {
            io.emit('ticketDeleted', { ticketId, projectId: ticket.project });
        }

        res.json({ message: 'Ticket deleted successfully' });
    } catch (error) {
        console.error('Delete Ticket Error:', error);
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    getTicketSuggestions,
    assignTicketManually,
    autoAssignTickets,
    updateTicket,
    deleteTicket
};
