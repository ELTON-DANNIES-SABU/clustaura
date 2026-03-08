const express = require('express');
const router = express.Router();
const CommTeam = require('../models/CommTeam');
const CommChannel = require('../models/CommChannel');
const CommMessage = require('../models/CommMessage');
const Meeting = require('../models/Meeting');
const CallSession = require('../models/CallSession');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware'); // Assuming this exists based on common patterns

// Middleware to verify if authMiddleware.protect exists, if not we'll need to check how they handle routes
// I'll check authRoutes.js to see what they use.

// GET all teams the user belongs to
router.get('/teams', protect, async (req, res) => {
    try {
        const teams = await CommTeam.find({
            $or: [
                { owner: req.user._id },
                { members: req.user._id }
            ]
        }).populate('owner', 'firstName lastName email')
            .populate('members', 'firstName lastName email');
        res.json(teams);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET channels for a team
router.get('/teams/:teamId/channels', protect, async (req, res) => {
    try {
        const channels = await CommChannel.find({ teamId: req.params.teamId });
        res.json(channels);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET messages for a channel
router.get('/channels/:channelId/messages', protect, async (req, res) => {
    try {
        const messages = await CommMessage.find({ channelId: req.params.channelId })
            .populate('sender', 'firstName lastName email')
            .sort({ createdAt: 1 });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET DM messages with a specific user
router.get('/dms/:recipientId', protect, async (req, res) => {
    try {
        const messages = await CommMessage.find({
            $or: [
                { sender: req.user._id, recipient: req.params.recipientId },
                { sender: req.params.recipientId, recipient: req.user._id }
            ],
            channelId: { $exists: false }
        })
            .populate('sender', 'firstName lastName email')
            .sort({ createdAt: 1 });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST send a message
router.post('/messages', protect, async (req, res) => {
    try {
        const { channelId, recipientId, content } = req.body;
        const message = await CommMessage.create({
            sender: req.user._id,
            channelId,
            recipient: recipientId,
            content
        });

        const populatedMessage = await CommMessage.findById(message._id)
            .populate('sender', 'firstName lastName email');

        // Emit via Socket.io
        const io = req.app.get('io');
        if (io) {
            if (channelId) {
                io.to(channelId).emit('receive_comm_message', populatedMessage);
            } else if (recipientId) {
                io.to(recipientId).emit('receive_comm_message', populatedMessage);
                io.to(req.user._id.toString()).emit('receive_comm_message', populatedMessage);
            }
        }

        res.status(201).json(populatedMessage);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST create team
router.post('/teams', protect, async (req, res) => {
    try {
        const { name, description } = req.body;
        const team = await CommTeam.create({
            name,
            description,
            owner: req.user._id,
            members: [req.user._id]
        });
        res.status(201).json(team);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST create channel
router.post('/teams/:teamId/channels', protect, async (req, res) => {
    try {
        const { name, description, type } = req.body;
        const channel = await CommChannel.create({
            teamId: req.params.teamId,
            name,
            description,
            type
        });
        res.status(201).json(channel);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PUT add member to team
router.put('/teams/:teamId/members', protect, async (req, res) => {
    try {
        const { email } = req.body;
        const userToAdd = await User.findOne({ email });

        if (!userToAdd) {
            return res.status(404).json({ message: 'User not found' });
        }

        const team = await CommTeam.findById(req.params.teamId);
        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }

        // Check ownership or if already member (optional: allows members to add others? usually owner only or admin)
        // For now, allow any existing member to add others for ease of use in this project context
        if (!team.members.includes(req.user._id) && team.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to add members to this team' });
        }

        // Check if user is already a member
        if (team.members.includes(userToAdd._id)) {
            return res.status(400).json({ message: 'User is already a member of this team' });
        }

        team.members.push(userToAdd._id);
        await team.save();

        const populatedTeam = await CommTeam.findById(team._id)
            .populate('owner', 'firstName lastName email')
            .populate('members', 'firstName lastName email');

        res.json(populatedTeam);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- Meeting Management ---

// GET all meetings for the user (scheduled or ongoing)
router.get('/meetings', protect, async (req, res) => {
    try {
        const meetings = await Meeting.find({
            $or: [
                { host: req.user._id },
                { participants: req.user._id },
                { status: 'scheduled' } // Optionally show all public scheduled meetings? 
            ],
            status: { $ne: 'cancelled' }
        }).populate('host', 'firstName lastName email')
            .populate('participants', 'firstName lastName email')
            .sort({ scheduledAt: 1 });
        res.json(meetings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST schedule a meeting
router.post('/meetings', protect, async (req, res) => {
    try {
        const { title, description, scheduledAt, duration, teamId, channelId, participants } = req.body;
        const meeting = await Meeting.create({
            title,
            description,
            host: req.user._id,
            scheduledAt,
            duration,
            teamId,
            channelId,
            participants: participants || [req.user._id],
            meetingLink: `meeting-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        });

        const populatedMeeting = await Meeting.findById(meeting._id)
            .populate('host', 'firstName lastName email');

        res.status(201).json(populatedMeeting);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- Call Management ---

// GET active calls in channels the user can see
router.get('/calls/active', protect, async (req, res) => {
    try {
        const activeSessions = await CallSession.find({ status: 'active' })
            .populate('initiator', 'firstName lastName');
        res.json(activeSessions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET specific call session details
router.get('/calls/:roomId', protect, async (req, res) => {
    try {
        const session = await CallSession.findOne({ roomId: req.params.roomId })
            .populate('initiator', 'firstName lastName')
            .populate('participants', 'firstName lastName');
        if (!session) return res.status(404).json({ message: 'Call session not found' });
        res.json(session);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
