const Notification = require('../models/Notification');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user._id })
            .sort({ createdAt: -1 })
            .populate('sender', 'firstName lastName')
            .limit(20);

        console.log(`Fetched ${notifications.length} notifications for user ${req.user._id}`);
        res.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Mark notifications as read
// @route   PUT /api/notifications/read
// @access  Private
const markRead = async (req, res) => {
    try {
        // Mark all as read for simplicity, or accept specific IDs
        await Notification.updateMany(
            { recipient: req.user._id, read: false },
            { $set: { read: true } }
        );

        res.json({ message: 'Notifications marked as read' });
    } catch (error) {
        console.error('Error marking notifications read:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Accept a team invitation
// @route   POST /api/notifications/:id/accept
// @access  Private
const acceptTeamInvite = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        if (notification.recipient.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        if (notification.type !== 'team_invite') {
            return res.status(400).json({ message: 'Not a team invitation' });
        }

        const projectId = notification.metadata.get('projectId');
        if (!projectId) {
            return res.status(400).json({ message: 'Project ID missing in notification' });
        }

        const Project = require('../models/Project');
        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Add user to project if not already a member (robust check)
        const isAlreadyMember = project.members.some(m => m.toString() === req.user._id.toString());

        console.log(`[acceptTeamInvite] User ${req.user._id} joining project ${projectId}. Already member: ${isAlreadyMember}`);

        if (!isAlreadyMember) {
            project.members.push(req.user._id);
            await project.save();
            console.log(`[acceptTeamInvite] User ${req.user._id} successfully added to members of project ${projectId}`);
        }

        // Mark notification as read or potentially update status to 'accepted'
        notification.read = true;
        await notification.save();

        res.json({ success: true, message: 'Joined project successfully', project });
    } catch (error) {
        console.error('Error accepting team invite:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get invitation for a specific challenge
// @route   GET /api/notifications/challenge/:challengeId
// @access  Private
const getInviteByChallengeId = async (req, res) => {
    try {
        const invite = await Notification.findOne({
            recipient: req.user._id,
            relatedId: req.params.challengeId,
            type: 'team_invite',
            read: false
        }).populate('sender', 'firstName lastName');

        res.json(invite);
    } catch (error) {
        console.error('Error fetching challenge invite:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getNotifications,
    markRead,
    acceptTeamInvite,
    getInviteByChallengeId
};
