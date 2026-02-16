const CommTeam = require('../models/CommTeam');
const CommChannel = require('../models/CommChannel');
const Post = require('../models/Post');
const User = require('../models/User');

// @desc    Create a team from selected commenters (AI Assisted Flow)
// @route   POST /api/teams/from-comments
// @access  Private
const createTeamFromComments = async (req, res) => {
    try {
        const { sourcePostId, memberIds, teamName } = req.body;
        const ownerId = req.user.id;

        // 1. Validation
        if (!memberIds || memberIds.length === 0) {
            return res.status(400).json({ message: 'No members selected' });
        }

        const post = await Post.findById(sourcePostId);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        // 2. Create Team
        const newTeam = await CommTeam.create({
            name: teamName || `Team: ${post.title.substring(0, 20)}`,
            description: `Formed via ClustAura Intelligence from post: ${post.title}`,
            owner: ownerId,
            members: [...memberIds, ownerId],
            sourcePost: sourcePostId,
            workspaceUrl: `/workplace/${Date.now()}`
        });

        // 3. Create Default Channel
        const channel = await CommChannel.create({
            team: newTeam._id,
            name: 'general',
            type: 'text'
        });

        // 4. Notify (Socket.io)
        const io = req.app.get('io');
        io.emit('team-created', {
            teamId: newTeam._id,
            sourcePostId,
            members: memberIds
        });

        res.status(201).json({ success: true, team: newTeam, channel });
    } catch (error) {
        console.error('Error in createTeamFromComments:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    createTeamFromComments
};
