const Message = require('../models/Message');

// @desc    Get conversation between current user and friend
// @route   GET /api/chat/:friendId
// @access  Private
const getMessages = async (req, res) => {
    try {
        const friendId = req.params.friendId;
        const userId = req.user._id;

        const messages = await Message.find({
            $or: [
                { sender: userId, recipient: friendId },
                { sender: friendId, recipient: userId }
            ]
        }).sort({ createdAt: 1 }); // Oldest first

        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getMessages
};
