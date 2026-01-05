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

module.exports = {
    getNotifications,
    markRead
};
