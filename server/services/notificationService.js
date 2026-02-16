const Notification = require('../models/Notification');

class NotificationService {
    async notify({ recipient, sender, type, content, relatedId, io }) {
        try {
            if (!recipient || !sender || !type || !content) {
                console.error('Missing required fields for notification');
                return;
            }

            // Don't notify self
            if (recipient.toString() === sender.toString()) return;

            // Create in DB
            const notification = await Notification.create({
                recipient,
                sender,
                type,
                content,
                relatedId,
                read: false
            });

            // Populate for real-time display
            const populatedNotification = await Notification.findById(notification._id)
                .populate('sender', 'firstName lastName avatar')
                .lean();

            // Emit via Socket.IO if available
            if (io) {
                io.to(recipient.toString()).emit('receive_notification', populatedNotification);
            }

            return notification;
        } catch (error) {
            console.error('Error sending notification:', error);
        }
    }
}

module.exports = new NotificationService();
