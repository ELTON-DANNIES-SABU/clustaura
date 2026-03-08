const User = require('../models/User');

// @desc    Send friend request
// @route   POST /api/friends/request/:id
// @access  Private
const sendFriendRequest = async (req, res) => {
    try {
        const recipientId = req.params.id;
        const senderId = req.user._id;

        if (recipientId === senderId.toString()) {
            return res.status(400).json({ message: 'Cannot send friend request to yourself' });
        }

        const recipient = await User.findById(recipientId);
        const sender = await User.findById(senderId);

        if (!recipient) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if already friends
        if (recipient.friends.includes(senderId)) {
            return res.status(400).json({ message: 'You are already friends' });
        }

        // Check if request already sent
        if (recipient.friendRequests.includes(senderId)) {
            return res.status(400).json({ message: 'Friend request already sent' });
        }

        // Check if user already has a request from this person (if so, accept it?)
        // For simplicity, just send request
        if (sender.friendRequests.includes(recipientId)) {
            return res.status(400).json({ message: 'This user has already sent you a request. Please accept it.' });
        }

        recipient.friendRequests.push(senderId);
        await recipient.save();

        // Create notification
        const Notification = require('../models/Notification');
        const notification = await Notification.create({
            recipient: recipientId,
            sender: senderId,
            type: 'friend_request',
            content: `${sender.firstName} ${sender.lastName} sent you a friend request`
        });

        // Emit socket event
        const io = req.app.get('io');
        io.to(recipientId).emit('receive_notification', notification);

        res.json({ message: 'Friend request sent successfully' });
    } catch (error) {
        console.error('Error sending friend request:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Accept friend request
// @route   PUT /api/friends/accept/:id
// @access  Private
const acceptFriendRequest = async (req, res) => {
    try {
        const requesterId = req.params.id;
        const recipientId = req.user._id; // I am the recipient accepting the request

        const recipient = await User.findById(recipientId);
        const requester = await User.findById(requesterId);

        if (!requester || !recipient) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if request exists
        if (!recipient.friendRequests.includes(requesterId)) {
            return res.status(400).json({ message: 'No friend request from this user' });
        }

        // Add to friends lists
        recipient.friends.push(requesterId);
        requester.friends.push(recipientId);

        // Remove from requests
        recipient.friendRequests = recipient.friendRequests.filter(
            id => id.toString() !== requesterId.toString()
        );

        await recipient.save();
        await requester.save();

        // Create notification for the requester
        const Notification = require('../models/Notification');
        const notification = await Notification.create({
            recipient: requesterId,
            sender: recipientId, // I accepted
            type: 'friend_accept',
            content: `${recipient.firstName} ${recipient.lastName} accepted your friend request`
        });

        // Emit socket event
        const io = req.app.get('io');
        io.to(requesterId).emit('receive_notification', notification);

        res.json({ message: 'Friend request accepted' });
    } catch (error) {
        console.error('Error accepting friend request:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Reject friend request
// @route   PUT /api/friends/reject/:id
// @access  Private
const rejectFriendRequest = async (req, res) => {
    try {
        const requesterId = req.params.id;
        const recipientId = req.user._id;

        const recipient = await User.findById(recipientId);

        if (!recipient) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Remove from requests
        recipient.friendRequests = recipient.friendRequests.filter(
            id => id.toString() !== requesterId.toString()
        );

        await recipient.save();

        res.json({ message: 'Friend request rejected' });
    } catch (error) {
        console.error('Error rejecting friend request:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Remove friend
// @route   DELETE /api/friends/:id
// @access  Private
const removeFriend = async (req, res) => {
    try {
        const friendId = req.params.id;
        const userId = req.user._id;

        const user = await User.findById(userId);
        const friend = await User.findById(friendId);

        if (!user || !friend) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Remove from friends lists
        user.friends = user.friends.filter(id => id.toString() !== friendId.toString());
        friend.friends = friend.friends.filter(id => id.toString() !== userId.toString());

        await user.save();
        await friend.save();

        res.json({ message: 'Friend removed' });
    } catch (error) {
        console.error('Error removing friend:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all friends
// @route   GET /api/friends
// @access  Private
const getFriends = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('friends', 'firstName lastName email');
        // We might also want to populate profile info like avatar, but that's in Profile model.
        // For now, let's keep it simple with User model fields.
        res.json(user.friends);
    } catch (error) {
        console.error('Error fetching friends:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get pending friend requests
// @route   GET /api/friends/requests
// @access  Private
const getFriendRequests = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('friendRequests', 'firstName lastName email');
        res.json(user.friendRequests);
    } catch (error) {
        console.error('Error fetching friend requests:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Search for users to add
// @route   GET /api/friends/search?query=name
// @access  Private
const searchUsers = async (req, res) => {
    try {
        const query = req.query.query;
        if (!query) {
            return res.json([]);
        }

        // Search by name or email, excluding current user
        const users = await User.find({
            $or: [
                { firstName: { $regex: query, $options: 'i' } },
                { lastName: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } }
            ],
            _id: { $ne: req.user._id }
        }).select('firstName lastName email friends friendRequests');

        // Map to add status context
        const usersWithStatus = users.map(u => {
            const isFriend = u.friends.includes(req.user._id);
            const isRequested = u.friendRequests.includes(req.user._id);
            const hasRequestedMe = req.user.friendRequests && req.user.friendRequests.includes(u._id) // This requires req.user populated or checking DB again. 
            // req.user from authMiddleware usually is just the user doc.

            return {
                _id: u._id,
                firstName: u.firstName,
                lastName: u.lastName,
                email: u.email,
                isFriend,
                isRequested
            };
        });

        res.json(usersWithStatus);
    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    getFriends,
    getFriendRequests,
    searchUsers
};
