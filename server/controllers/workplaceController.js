const Project = require('../models/Project');
const Issue = require('../models/Issue');
const Ticket = require('../models/Ticket');
const Sprint = require('../models/Sprint');
const User = require('../models/User');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const teamAssignmentService = require('../services/teamAssignmentService');

// @desc    Create a new sprint
// @route   POST /api/workplace/sprints
// @access  Private
const createSprint = async (req, res) => {
    try {
        const { name, startDate, endDate } = req.body;
        const projectId = req.params.id || req.body.projectId;

        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        const member = project.members.find(m => m.user.toString() === req.user._id.toString());
        if (!member || (member.role !== 'Project Owner' && member.role !== 'Project Lead')) {
            return res.status(403).json({ message: 'Only Project Owners or Leads can create sprints manually.' });
        }

        const sprint = await Sprint.create({
            project: projectId,
            name,
            startDate,
            endDate,
            status: 'future'
        });

        res.status(201).json(sprint);
    } catch (error) {
        console.error('Error in createSprint:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get sprints for a project
// @route   GET /api/workplace/projects/:id/sprints
// @access  Private
const getProjectSprints = async (req, res) => {
    try {
        // Get active and future sprints
        const sprints = await Sprint.find({
            project: req.params.id,
            status: { $ne: 'closed' }
        }).sort({ createdAt: 1 });

        res.json(sprints);
    } catch (error) {
        console.error('Error fetching sprints:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Move issue to sprint or backlog
// @route   PUT /api/workplace/issues/:id/move
// @access  Private
const moveIssue = async (req, res) => {
    try {
        const { sprintId, startDate, dueDate } = req.body;
        // sprintId can be null (Backlog) or a valid ID

        const issue = await Issue.findById(req.params.id);
        if (!issue) {
            return res.status(404).json({ message: 'Issue not found' });
        }

        if (sprintId !== undefined) issue.sprint = sprintId || null;
        if (startDate !== undefined) issue.startDate = startDate;
        if (dueDate !== undefined) issue.dueDate = dueDate;

        await issue.save();

        res.json(issue);
    } catch (error) {
        console.error('Error moving issue:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update sprint status (start/complete)
// @route   PUT /api/workplace/sprints/:id/status
// @access  Private
const updateSprintStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const sprint = await Sprint.findById(req.params.id).populate('project');

        if (!sprint) {
            return res.status(404).json({ message: 'Sprint not found' });
        }

        // Restriction: Only project owner can start or complete a sprint
        if (status === 'closed' || status === 'active') {
            if (sprint.project.owner.toString() !== req.user._id.toString()) {
                const action = status === 'closed' ? 'complete' : 'start';
                return res.status(403).json({ message: `You are not a lead to ${action} sprint` });
            }
        }

        sprint.status = status;
        await sprint.save();

        res.json(sprint);
    } catch (error) {
        console.error('Error updating sprint status:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a new project
// @route   POST /api/workplace/projects
// @access  Private
const createProject = async (req, res) => {
    // We allow project shell creation for the AI initiator
    try {
        const { name, key, description, communityId } = req.body;
        const existingProject = await Project.findOne({ key: key.toUpperCase() });
        if (existingProject) {
            return res.status(400).json({ message: 'Project key already exists' });
        }
        const project = await Project.create({
            name,
            key: key.toUpperCase(),
            description,
            owner: req.user._id,
            members: [{ user: req.user._id, role: 'Project Owner' }],
            community: communityId || null
        });
        res.status(201).json(project);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all projects for current user
// @route   GET /api/workplace/projects
// @access  Private
const getProjects = async (req, res) => {
    try {
        const projects = await Project.find({
            'members.user': req.user._id
        }).sort({ createdAt: -1 });

        res.json(projects);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get single project details
// @route   GET /api/workplace/projects/:id
// @access  Private
const getProjectById = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('owner', 'firstName lastName email')
            .populate('members.user', 'firstName lastName email avatar');

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check if user is member
        if (!project.members.some(m => m.user._id.toString() === req.user._id.toString())) {
            return res.status(401).json({ message: 'Not authorized to view this project' });
        }

        res.json(project);
    } catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a new issue
// @route   POST /api/workplace/issues
// @access  Private
const createIssue = async (req, res) => {
    try {
        const { title, description, projectId, sprintId, module, priority, type, startDate, endDate, assignedUser } = req.body;

        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        // Basic authorization - must be a member
        const member = project.members.find(m => m.user.toString() === req.user._id.toString());
        if (!member) return res.status(401).json({ message: 'Not authorized' });

        // Generate Issue Key
        const ticketCount = await Ticket.countDocuments({ project: projectId });
        const issueCount = await Issue.countDocuments({ project: projectId });
        const nextNumber = ticketCount + issueCount + 1;
        const issueKey = `${project.key}-${nextNumber}`;

        const ticket = await Ticket.create({
            project: projectId,
            sprint: sprintId || null,
            module: module || null,
            title,
            description,
            priority: priority || 'medium',
            type: type || 'task',
            status: 'To Do',
            issueKey,
            reporter: req.user._id,
            startDate: startDate || null,
            endDate: endDate || null,
            assignedUser: assignedUser || null
        });

        res.status(201).json(ticket);
    } catch (error) {
        console.error('Error in createIssue:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get issues for a project (optionally filtered by sprint)
// @route   GET /api/workplace/projects/:id/issues
// @access  Private
const getProjectIssues = async (req, res) => {
    try {
        const { sprint } = req.query;
        let query = { project: req.params.id };

        if (sprint === 'null') {
            query.sprint = null; // Backlog
        } else if (sprint) {
            query.sprint = sprint;
        }

        const issues = await Issue.find(query)
            .populate('assignee', 'firstName lastName profileImageUrl')
            .populate('reporter', 'firstName lastName')
            .populate('sprint') // Populate sprint info
            .sort({ createdAt: -1 });

        res.json(issues);
    } catch (error) {
        console.error('Error fetching issues:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update issue status (drag and drop)
// @route   PUT /api/workplace/issues/:id/status
// @access  Private
const updateIssueStatus = async (req, res) => {
    try {
        const { status } = req.body;
        let issue = await Issue.findById(req.params.id);
        let isTicket = false;

        if (!issue) {
            issue = await Ticket.findById(req.params.id);
            if (!issue) {
                return res.status(404).json({ message: 'Issue/Ticket not found' });
            }
            isTicket = true;
        }

        // Auto-create post when moved to Completed
        if (status === 'Completed' && issue.status !== 'Completed') {
            try {
                // Fetch project to get community association
                const project = await Project.findById(issue.project);

                const newPost = await Post.create({
                    author: issue.assignee || issue.assignedUser || req.user._id,
                    title: `Completed Task: ${issue.summary || issue.title}`,
                    content: issue.description || `I successfully completed the task: ${issue.summary || issue.title}`,
                    type: 'Update',
                    tags: ['Workplace', 'Achievement'],
                    community: project?.community || null,
                    isCreatorPost: false
                });

                // Populate and emit real-time event
                const populatedPost = await Post.findById(newPost._id)
                    .populate('author', 'firstName lastName avatar role')
                    .populate('community', 'name slug')
                    .lean();

                const io = req.app.get('io');
                if (io) {
                    io.emit('new-post', populatedPost);
                    console.log(`✅ Auto-created and EMITTED post for issue ${issue.issueKey || issue.title}`);
                }
            } catch (postError) {
                console.error('❌ Error auto-creating post:', postError);
                // Continue execution - don't block issue update
            }
        }

        issue.status = status;
        if (status === 'In Progress') {
             issue.progressPercentage = isTicket ? (issue.progressPercentage > 0 ? issue.progressPercentage : 10) : undefined;
        } else if (status === 'Testing') {
            if (isTicket) issue.progressPercentage = 90;
        } else if (status === 'Completed') {
            if (isTicket) issue.progressPercentage = 100;

            // Automated Pipeline Hook: Re-balance and assign tickets when one finishes
            teamAssignmentService.autoAssignProjectTickets(issue.project).catch(err => {
                console.error("Background auto-assign sweep failed:", err);
            });
        }
        await issue.save();

        res.json(issue);
    } catch (error) {
        console.error('Error updating issue status:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Invite member to project
// @route   POST /api/workplace/projects/:id/members
// @access  Private
const addProjectMember = async (req, res) => {
    try {
        const { email, userId, role } = req.body;
        const projectId = req.params.id;
        console.log(`[DEBUG] Inviting member. Project: ${projectId}, User: ${userId || email}, Role: ${role}`);

        const project = await Project.findById(projectId);
        if (!project) {
            console.log(`[DEBUG] Project not found: ${projectId}`);
            return res.status(404).json({ message: 'Project not found' });
        }

        console.log(`[DEBUG] Project found: ${project.name}. Owner: ${project.owner}`);

        // Check if user is owner
        if (project.owner.toString() !== req.user._id.toString()) {
            console.log(`[DEBUG] Authorization failed. Owner: ${project.owner}, Current User: ${req.user._id}`);
            return res.status(401).json({ message: 'Not authorized to invite members' });
        }

        let userToAdd;
        if (userId) {
            userToAdd = await User.findById(userId);
        } else if (email) {
            userToAdd = await User.findOne({ email });
        }

        if (!userToAdd) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if already member
        if (project.members.some(m => m.user.toString() === userToAdd._id.toString())) {
            return res.status(400).json({ message: 'User is already a member' });
        }

        // Check if already invited
        const existingInvite = project.invitations.find(inv => 
            inv.user.toString() === userToAdd._id.toString() && inv.status === 'pending'
        );
        if (existingInvite) {
            return res.status(400).json({ message: 'Invitation already sent and pending' });
        }

        // Add to invitations
        project.invitations.push({
            user: userToAdd._id,
            role: role || 'Member',
            status: 'pending'
        });
        await project.save();

        // Create Invitation Notification
        try {
            const notification = await Notification.create({
                recipient: userToAdd._id,
                sender: req.user._id,
                type: 'team_invite',
                content: `${req.user.firstName} ${req.user.lastName} has invited you to join the project "${project.name}" as a ${role || 'Member'}`,
                relatedId: project._id,
                metadata: {
                    role: role || 'Member'
                }
            });

            const io = req.app.get('io');
            if (io) {
                io.to(userToAdd._id.toString()).emit('receive_notification', notification);
            }
        } catch (notifyErr) {
            console.error('Error sending invitation notification:', notifyErr);
        }

        res.json({ success: true, message: 'Invitation sent successfully' });
    } catch (error) {
        console.error('[DEBUG] Error inviting member:', error);
        res.status(500).json({ message: 'Server Error', details: error.message });
    }
};

// @desc    Respond to project invitation (Accept/Reject)
// @route   POST /api/workplace/projects/:id/invitations/respond
// @access  Private
const respondToInvitation = async (req, res) => {
    try {
        const { action } = req.body; // 'accept' or 'reject'
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const invitationIndex = project.invitations.findIndex(
            inv => inv.user.toString() === req.user._id.toString() && inv.status === 'pending'
        );

        if (invitationIndex === -1) {
            return res.status(404).json({ message: 'No pending invitation found for you' });
        }

        if (action === 'accept') {
            project.invitations[invitationIndex].status = 'accepted';
            // Add to members
            const isAlreadyMember = project.members.some(
                m => m.user.toString() === req.user._id.toString()
            );
            if (!isAlreadyMember) {
                project.members.push({
                    user: req.user._id,
                    role: project.invitations[invitationIndex].role || 'Member'
                });
            }
            
            // Notify Lead
            try {
                await Notification.create({
                    recipient: project.owner,
                    sender: req.user._id,
                    type: 'system_alert',
                    content: `${req.user.firstName} ${req.user.lastName} has accepted your invitation to join "${project.name}"`,
                    relatedId: project._id
                });
            } catch (notifyErr) {
                console.error('Error notifying lead of acceptance:', notifyErr);
            }
        } else {
            project.invitations[invitationIndex].status = 'rejected';
            
            // Notify Lead
            try {
                await Notification.create({
                    recipient: project.owner,
                    sender: req.user._id,
                    type: 'system_alert', // Or a more specific type if desired
                    content: `${req.user.firstName} ${req.user.lastName} has declined your invitation to join "${project.name}"`,
                    relatedId: project._id
                });
            } catch (notifyErr) {
                console.error('Error notifying lead of rejection:', notifyErr);
            }
        }

        // Clean up invitations (remove or keep for history - here we remove based on common practice or just mark)
        // For simplicity and matching common flows, we'll remove it after handling or keep it marked.
        // Let's remove it to keep the array small
        project.invitations.splice(invitationIndex, 1);
        
        await project.save();

        res.json({ success: true, message: `Invitation ${action}ed successfully`, action });
    } catch (error) {
        console.error('Error responding to invitation:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Leave a project (Send request to lead)
// @route   DELETE /api/workplace/projects/:id/leave
// @access  Private
const leaveProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Owner cannot leave their own project
        if (project.owner.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Owner cannot leave the project' });
        }

        // Check if already requested
        const alreadyRequested = project.leaveRequests.some(
            req_item => req_item.user.toString() === req.user._id.toString()
        );

        if (alreadyRequested) {
            return res.status(400).json({ message: 'Leave request already pending approval' });
        }

        // Add to leave requests
        project.leaveRequests.push({ user: req.user._id });
        await project.save();

        // Notify Lead
        try {
            const notification = await Notification.create({
                recipient: project.owner,
                sender: req.user._id,
                type: 'leave_request',
                content: `${req.user.firstName} ${req.user.lastName} has requested to leave the project "${project.name}"`,
                relatedId: project._id
            });

            const io = req.app.get('io');
            if (io) {
                io.to(project.owner.toString()).emit('receive_notification', notification);
            }
        } catch (notifyErr) {
            console.error('Error sending leave request notification:', notifyErr);
        }

        res.json({ success: true, message: 'Leave request sent to project lead' });
    } catch (error) {
        console.error('Error leaving project:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get pending leave requests for a project
// @route   GET /api/workplace/projects/:id/leave-requests
// @access  Private (Lead only)
const getProjectLeaveRequests = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id).populate('leaveRequests.user', 'firstName lastName email profileImageUrl');

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Only lead can see requests
        if (project.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only project lead can view leave requests' });
        }

        res.json(project.leaveRequests);
    } catch (error) {
        console.error('Error fetching leave requests:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Respond to leave request
// @route   POST /api/workplace/projects/:id/leave-requests/:userId/respond
// @access  Private (Lead only)
const respondToLeaveRequest = async (req, res) => {
    try {
        const { action } = req.body; // 'approve' or 'reject'
        const { userId } = req.params;
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Only lead can respond
        if (project.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only project lead can respond to leave requests' });
        }

        // Remove from leave requests regardless of action
        project.leaveRequests = project.leaveRequests.filter(
            r => r.user.toString() !== userId
        );

        if (action === 'approve') {
            // Remove from members
            project.members = project.members.filter(m => m.user.toString() !== userId);

            // Notify user
            try {
                await Notification.create({
                    recipient: userId,
                    sender: req.user._id,
                    type: 'leave_approved',
                    content: `Your request to leave project "${project.name}" has been approved`,
                    relatedId: project._id
                });
            } catch (notifyErr) {
                console.error('Error sending leave approval notification:', notifyErr);
            }
        } else {
            // Notify user of rejection
            try {
                await Notification.create({
                    recipient: userId,
                    sender: req.user._id,
                    type: 'leave_rejected',
                    content: `Your request to leave project "${project.name}" was declined by the lead`,
                    relatedId: project._id
                });
            } catch (notifyErr) {
                console.error('Error sending leave rejection notification:', notifyErr);
            }
        }

        await project.save();

        const updatedProject = await Project.findById(project._id)
            .populate('owner', 'firstName lastName email')
            .populate('members', 'firstName lastName email profileImageUrl');

        res.json({ success: true, action, project: updatedProject });
    } catch (error) {
        console.error('Error responding to leave request:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Remove a member from project (Kick)
// @route   DELETE /api/workplace/projects/:id/members/:userId
// @access  Private
const removeProjectMember = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Only owner can remove members
        if (project.owner.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to remove members' });
        }

        const { userId } = req.params;

        // Cannot remove owner
        if (userId === project.owner.toString()) {
            return res.status(400).json({ message: 'Cannot remove the project lead' });
        }

        // Remove from members
        project.members = project.members.filter(m => m.user.toString() !== userId);
        await project.save();

        const updatedProject = await Project.findById(project._id)
            .populate('owner', 'firstName lastName email')
            .populate('members.user', 'firstName lastName email profileImageUrl');

        res.json(updatedProject);
    } catch (error) {
        console.error('Error removing member:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update member role in project
// @route   PUT /api/workplace/projects/:id/members/:userId/role
// @access  Private (Owner only)
const updateMemberRole = async (req, res) => {
    try {
        const { role } = req.body;
        const { userId } = req.params;
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Only owner can change roles
        if (project.owner.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Only the project owner can change roles' });
        }

        const memberIndex = project.members.findIndex(m => m.user.toString() === userId);
        if (memberIndex === -1) {
            return res.status(404).json({ message: 'Member not found in project' });
        }

        // Cannot change owner's role through this endpoint
        if (userId === project.owner.toString()) {
            return res.status(400).json({ message: 'Cannot change the project owner\'s role' });
        }

        // Only allow specific roles
        const validRoles = ['Member', 'Project Lead'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ message: 'Invalid role. Choose Member or Project Lead.' });
        }

        project.members[memberIndex].role = role;
        await project.save();

        const updatedProject = await Project.findById(project._id)
            .populate('owner', 'firstName lastName email')
            .populate('members.user', 'firstName lastName email profileImageUrl');

        res.json(updatedProject);
    } catch (error) {
        console.error('Error updating member role:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all pending project invitations for current user
// @route   GET /api/workplace/invitations
// @access  Private
const getPendingInvitations = async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Find projects where this user has a pending invitation
        const projects = await Project.find({
            'invitations.user': userId,
            'invitations.status': 'pending'
        }).populate('owner', 'firstName lastName email profileImageUrl');

        // Extract invitation details for each project
        const invitations = projects.map(project => {
            const invite = project.invitations.find(inv => 
                inv.user.toString() === userId.toString() && inv.status === 'pending'
            );
            return {
                _id: invite._id,
                project: {
                    _id: project._id,
                    name: project.name,
                    description: project.description,
                    owner: project.owner
                },
                role: invite.role,
                createdAt: invite.createdAt
            };
        });

        res.json(invitations);
    } catch (error) {
        console.error('Error getting pending invitations:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    createProject,
    getProjects,
    getProjectById,
    createIssue,
    getProjectIssues,
    updateIssueStatus,
    createSprint,
    getProjectSprints,
    moveIssue,
    updateSprintStatus,
    addProjectMember,
    respondToInvitation,
    leaveProject,
    removeProjectMember,
    getProjectLeaveRequests,
    respondToLeaveRequest,
    getPendingInvitations,
    updateMemberRole
};
