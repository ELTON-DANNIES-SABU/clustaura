const Challenge = require('../models/Challenge');
const User = require('../models/User');
const creditService = require('../services/creditService'); // Game Theory Credit System

// @desc    Get all challenges
// @route   GET /api/challenges
// @access  Private (Visible to registered users)
const getChallenges = async (req, res) => {
    try {
        const challenges = await Challenge.find()
            .populate('author', 'firstName lastName email')
            .populate('comments.user', 'firstName lastName')
            .sort({ createdAt: -1 }); // Newest first
        res.json(challenges);
    } catch (error) {
        console.error('Error fetching challenges:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a new challenge
// @route   POST /api/challenges
// @access  Private
const createChallenge = async (req, res) => {
    try {
        const { title, description, tags, difficulty, type } = req.body;

        const challenge = new Challenge({
            title,
            description,
            tags,
            difficulty,
            type,
            author: req.user._id
        });

        const createdChallenge = await challenge.save();

        // Game Theory: Award Creation Credits
        await creditService.awardPostCreationCredits(req.user._id, createdChallenge);

        // Populate author info to return the full object
        await createdChallenge.populate('author', 'firstName lastName');

        res.status(201).json({ success: true, message: 'Challenge created', data: createdChallenge });

        // Emit new challenge to all connected clients
        // Emit new challenge to all connected clients
        const io = req.app.get('io');
        io.emit('new-challenge-post', createdChallenge);
    } catch (error) {
        console.error('Error creating challenge:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Vote on a challenge
// @route   PUT /api/challenges/:id/vote
// @access  Private
const voteChallenge = async (req, res) => {
    try {
        const challenge = await Challenge.findById(req.params.id);

        if (!challenge) {
            return res.status(404).json({ message: 'Challenge not found' });
        }

        // Check if already voted
        if (challenge.votes.includes(req.user._id)) {
            // Remove vote (toggle)
            challenge.votes = challenge.votes.filter(
                (vote) => vote.toString() !== req.user._id.toString()
            );
            challenge.upvotes = Math.max(0, challenge.upvotes - 1);
        } else {
            // Add vote
            challenge.votes.push(req.user._id);
            challenge.upvotes += 1;

            // Game Theory: Award Impact Credits to Author (Author gets rep for good challenge)
            if (challenge.author.toString() !== req.user._id.toString()) {
                await creditService.awardImpactCredits(challenge.author, challenge._id, 'vote');
            }
        }

        await challenge.save();

        // Populate and emit update
        const updatedChallenge = await Challenge.findById(challenge._id)
            .populate('author', 'firstName lastName email')
            .populate('comments.user', 'firstName lastName');

        const io = req.app.get('io');
        io.emit('challenge:update', updatedChallenge);

        res.json({ success: true, message: 'Vote updated', data: challenge.votes });
    } catch (error) {
        console.error('Error voting challenge:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Join a challenge
// @route   PUT /api/challenges/:id/join
// @access  Private
const joinChallenge = async (req, res) => {
    try {
        const challenge = await Challenge.findById(req.params.id);

        if (!challenge) {
            return res.status(404).json({ message: 'Challenge not found' });
        }

        // Check if already joined
        if (challenge.participants.includes(req.user._id)) {
            return res.status(400).json({ message: 'Already joined this challenge' });
        }

        challenge.participants.push(req.user._id);
        await challenge.save();

        // Populate and emit update
        const updatedChallenge = await Challenge.findById(challenge._id)
            .populate('author', 'firstName lastName email')
            .populate('comments.user', 'firstName lastName');

        const io = req.app.get('io');
        io.emit('challenge:update', updatedChallenge);

        res.json(challenge.participants);
    } catch (error) {
        console.error('Error joining challenge:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get a single challenge by ID
// @route   GET /api/challenges/:id
// @access  Private
const getChallengeById = async (req, res) => {
    try {
        const challenge = await Challenge.findById(req.params.id)
            .populate('author', 'firstName lastName email')
            .populate('comments.user', 'firstName lastName')
            .populate('participants', 'firstName lastName');

        if (!challenge) {
            return res.status(404).json({ message: 'Challenge not found' });
        }

        res.json(challenge);
    } catch (error) {
        console.error('Error fetching challenge:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Add a comment to a challenge
// @route   POST /api/challenges/:id/comments
// @access  Private
const addComment = async (req, res) => {
    try {
        const { text, allowContact } = req.body;
        const challenge = await Challenge.findById(req.params.id);

        if (!challenge) {
            return res.status(404).json({ message: 'Challenge not found' });
        }

        const newComment = {
            user: req.user._id,
            text,
            allowContact: allowContact === true, // Ensure boolean
            createdAt: Date.now()
        };

        challenge.comments.unshift(newComment);
        challenge.commentsCount += 1;

        await challenge.save();

        await challenge.populate('comments.user', 'firstName lastName');

        // Emit update to all clients
        const updatedChallengeForEmit = await Challenge.findById(challenge._id)
            .populate('author', 'firstName lastName email')
            .populate('comments.user', 'firstName lastName');

        const io = req.app.get('io');
        io.emit('challenge:update', updatedChallengeForEmit);

        // Notification logic
        if (challenge.author.toString() !== req.user._id.toString()) {
            // Notification logic...
            const Notification = require('../models/Notification');
            const notification = await Notification.create({
                recipient: challenge.author,
                sender: req.user._id,
                type: 'comment',
                content: `${req.user.firstName} ${req.user.lastName} commented on your challenge: "${challenge.title}"`,
                relatedId: challenge._id
            });

            io.to(challenge.author.toString()).emit('receive_notification', notification);

            // Game Theory: Award Impact Credits (to Author)
            await creditService.awardImpactCredits(challenge.author, challenge._id, 'solution_comment');

            // Game Theory: Award Contribution Credits (to Solver)
            await creditService.awardContributionCredits(req.user._id, challenge._id, 'Solution');
        }

        res.json({ success: true, message: 'Comment added', data: challenge.comments });
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Update a challenge
// @route   PUT /api/challenges/:id
// @access  Private
const updateChallenge = async (req, res) => {
    try {
        const { title, description, tags, difficulty, type } = req.body;
        let challenge = await Challenge.findById(req.params.id);

        if (!challenge) {
            return res.status(404).json({ success: false, message: 'Challenge not found' });
        }

        // Make sure user is challenge owner
        if (challenge.author.toString() !== req.user._id.toString()) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        challenge = await Challenge.findByIdAndUpdate(
            req.params.id,
            { title, description, tags, difficulty, type },
            { new: true, runValidators: true }
        ).populate('author', 'firstName lastName email');

        // Emit update
        const io = req.app.get('io');
        io.emit('challenge:update', challenge);

        res.json({ success: true, message: 'Challenge updated', data: challenge });
    } catch (error) {
        console.error('Error updating challenge:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Delete a challenge
// @route   DELETE /api/challenges/:id
// @access  Private
const deleteChallenge = async (req, res) => {
    try {
        const challenge = await Challenge.findById(req.params.id);

        if (!challenge) {
            return res.status(404).json({ success: false, message: 'Challenge not found' });
        }

        // Make sure user is challenge owner
        if (challenge.author.toString() !== req.user._id.toString()) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        await challenge.deleteOne();

        // Emit delete event so clients can remove it
        const io = req.app.get('io');
        io.emit('challenge:delete', { id: req.params.id });

        res.json({ success: true, message: 'Challenge removed', data: {} });
    } catch (error) {
        console.error('Error deleting challenge:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Send a team invitation to a solver
// @route   POST /api/challenges/:id/invite
// @access  Private
const sendTeamInvite = async (req, res) => {
    try {
        const { solverId } = req.body; // The user ID of the solver to invite
        const challenge = await Challenge.findById(req.params.id);

        if (!challenge) {
            return res.status(404).json({ success: false, message: 'Challenge not found' });
        }

        // Only author can invite
        if (challenge.author.toString() !== req.user._id.toString()) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        // Check if solver exists and allowContact logic (optional validation)
        // For now, simpler implementation:

        const io = req.app.get('io');

        // Emit event to valid solver
        io.to(solverId).emit('team_invite', {
            challengeId: challenge._id,
            challengeTitle: challenge.title,
            inviterId: req.user._id,
            inviterName: `${req.user.firstName} ${req.user.lastName}`,
            message: `Invited you to form a team for "${challenge.title}"`
        });

        // Also create a notification
        const Notification = require('../models/Notification');
        await Notification.create({
            recipient: solverId,
            sender: req.user._id,
            type: 'team_invite',
            content: `Invited you to form a team for "${challenge.title}"`,
            relatedId: challenge._id
        });

        res.json({ success: true, message: 'Invitation sent' });
    } catch (error) {
        console.error('Error sending invite:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = {
    getChallenges,
    getChallengeById,
    createChallenge,
    voteChallenge,
    joinChallenge,
    addComment,
    updateChallenge,
    deleteChallenge,
    sendTeamInvite
};
