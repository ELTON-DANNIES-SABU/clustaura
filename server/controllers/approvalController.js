const ApprovalRequest = require('../models/ApprovalRequest');
const Ticket = require('../models/Ticket');
const ActivityLog = require('../models/ActivityLog');
const Project = require('../models/Project');

// Helper to check if user has approval rights for a project
const hasApprovalRights = async (projectId, userId) => {
    const project = await Project.findById(projectId);
    if (!project) return false;
    
    // Check if user is the direct owner of the project
    if (project.owner.toString() === userId.toString()) return true;

    // Check user's role in the members array
    const member = project.members.find(m => m.user.toString() === userId.toString());
    if (member && (member.role === 'owner' || member.role === 'lead')) {
        return true;
    }
    
    return false;
};

// @desc    Get all pending approvals for a project
// @route   GET /api/approvals/:projectId
// @access  Private
const getApprovals = async (req, res) => {
    try {
        const { projectId } = req.params;
        const approvals = await ApprovalRequest.find({ project: projectId, status: 'pending' })
            .populate('ticket', 'title ticketCode repositoryBranch')
            .populate('reviewedBy', 'firstName lastName')
            .sort({ timestamp: -1 });

        res.json(approvals);
    } catch (error) {
        console.error('Get Approvals Error:', error);
        res.status(500).json({ message: 'Failed to fetch approval requests' });
    }
};

// @desc    Approve a git-triggered ticket update
// @route   POST /api/approvals/approve/:id
// @access  Private
const approveRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const request = await ApprovalRequest.findById(id).populate('ticket').populate('project');

        if (!request) {
            return res.status(404).json({ message: 'Approval request not found' });
        }
        if (request.status !== 'pending') {
            return res.status(400).json({ message: 'Request is already processed' });
        }

        const project = request.project;
        
        // Check RBAC permissions
        const canApprove = await hasApprovalRights(project._id, req.user._id);
        if (!canApprove) {
            return res.status(403).json({ message: 'You do not have permission to approve this request. Lead or Owner role required.' });
        }

        // Apply changes to ticket
        const ticket = request.ticket;
        ticket.status = request.proposedStatus || ticket.status;
        if (request.proposedProgress) {
            ticket.progressPercentage = request.proposedProgress;
        }
        await ticket.save();

        // Update Approval Request status
        request.status = 'approved';
        request.reviewedBy = req.user._id;
        await request.save();

        // Log Activity
        await ActivityLog.create({
            ticket: ticket._id,
            action: `System change approved: ${request.originalCommitMessage || 'Update applied'}`,
            performedBy: req.user._id,
            source: 'user'
        });

        // Notify over socket
        const io = req.app.get('io');
        if (io) {
            io.emit('ticketProgressUpdated', {
                ticketId: ticket._id,
                progress: ticket.progressPercentage,
                status: ticket.status,
                commits: ticket.commits
            });
            io.emit('approvalProcessed', { requestId: request._id, status: 'approved' });
        }

        res.json({ success: true, message: 'Request approved and ticket updated', ticket });
    } catch (error) {
        console.error('Approve Request Error:', error);
        res.status(500).json({ message: 'Failed to approve request' });
    }
};

// @desc    Reject a git-triggered ticket update
// @route   POST /api/approvals/reject/:id
// @access  Private
const rejectRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const request = await ApprovalRequest.findById(id).populate('ticket').populate('project');

        if (!request) {
            return res.status(404).json({ message: 'Approval request not found' });
        }
        if (request.status !== 'pending') {
            return res.status(400).json({ message: 'Request is already processed' });
        }

        // Check RBAC permissions
        const canReject = await hasApprovalRights(request.project._id, req.user._id);
        if (!canReject) {
            return res.status(403).json({ message: 'You do not have permission to reject this request. Lead or Owner role required.' });
        }

        // Update Approval Request status
        request.status = 'rejected';
        request.reviewedBy = req.user._id;
        await request.save();

        // Log Activity
        await ActivityLog.create({
            ticket: request.ticket._id,
            action: `System change rejected: ${request.originalCommitMessage || 'Update ignored'}`,
            performedBy: req.user._id,
            source: 'user'
        });

        const io = req.app.get('io');
        if (io) {
            io.emit('approvalProcessed', { requestId: request._id, status: 'rejected' });
        }

        res.json({ success: true, message: 'Request rejected' });
    } catch (error) {
        console.error('Reject Request Error:', error);
        res.status(500).json({ message: 'Failed to reject request' });
    }
};

// @desc    Override a ticket's state directly
// @route   POST /api/approvals/override/:ticketId
// @access  Private
const overrideTicket = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { status, progressPercentage } = req.body;

        const ticket = await Ticket.findById(ticketId).populate('project');
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Check RBAC permissions
        const canOverride = await hasApprovalRights(ticket.project._id, req.user._id);
        if (!canOverride) {
            return res.status(403).json({ message: 'You do not have permission to override system. Lead or Owner role required.' });
        }

        // Apply changes
        if (status) ticket.status = status;
        if (progressPercentage !== undefined) ticket.progressPercentage = progressPercentage;
        await ticket.save();

        // Clear any pending approvals for this ticket
        await ApprovalRequest.updateMany(
            { ticket: ticketId, status: 'pending' },
            { $set: { status: 'rejected', reviewedBy: req.user._id } }
        );

        // Log Activity
        await ActivityLog.create({
            ticket: ticket._id,
            action: `Ticket manually overridden by Lead/Owner. Status: ${status}, Progress: ${progressPercentage}%`,
            performedBy: req.user._id,
            source: 'user'
        });

        // Notify over socket
        const io = req.app.get('io');
        if (io) {
            io.emit('ticketProgressUpdated', {
                ticketId: ticket._id,
                progress: ticket.progressPercentage,
                status: ticket.status,
                commits: ticket.commits
            });
            // Let the frontend know approvals might have changed
            io.emit('approvalsCleared', { ticketId: ticket._id });
        }

        res.json({ success: true, message: 'Ticket manually overridden', ticket });
    } catch (error) {
        console.error('Override Ticket Error:', error);
        res.status(500).json({ message: 'Failed to override ticket' });
    }
};

module.exports = {
    getApprovals,
    approveRequest,
    rejectRequest,
    overrideTicket
};
