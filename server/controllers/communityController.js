const Community = require('../models/Community');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

// --- Community Controllers ---

// @desc    Get all communities (for dropdowns/lists)
// @route   GET /api/communities
exports.getAllCommunities = async (req, res) => {
    try {
        const communities = await Community.find().select('name slug members');
        res.json(communities);
    } catch (error) {
        console.error('Error fetching communities:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.createCommunity = async (req, res) => {
    try {
        const { name, description, rules } = req.body;
        const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
        const community = new Community({
            name,
            slug,
            description,
            rules,
            moderators: [req.user.id],
            members: [req.user.id]
        });
        await community.save();
        res.status(201).json(community);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getCommunities = async (req, res) => {
    try {
        const communities = await Community.find();
        res.json(communities);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getCommunityBySlug = async (req, res) => {
    try {
        const community = await Community.findOne({ slug: req.params.slug });
        if (!community) return res.status(404).json({ message: 'Community not found' });
        res.json(community);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Join a community
exports.joinCommunity = async (req, res) => {
    try {
        const community = await Community.findOne({ slug: req.params.slug });
        if (!community) {
            return res.status(404).json({ message: 'Community not found' });
        }

        if (community.members.includes(req.user.id)) {
            return res.status(400).json({ message: 'Already a member' });
        }

        community.members.push(req.user.id);
        await community.save();
        res.json(community.members);
    } catch (error) {
        console.error('Error joining community:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Leave a community
exports.leaveCommunity = async (req, res) => {
    try {
        const community = await Community.findOne({ slug: req.params.slug });
        if (!community) {
            return res.status(404).json({ message: 'Community not found' });
        }

        const index = community.members.indexOf(req.user.id);
        if (index === -1) {
            return res.status(400).json({ message: 'Not a member' });
        }

        community.members.splice(index, 1);
        await community.save();
        res.json(community.members);
    } catch (error) {
        console.error('Error leaving community:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// --- Post Controllers ---

exports.createPost = async (req, res) => {
    try {
        const { title, content, communityId, tags } = req.body;
        const post = new Post({
            title,
            content,
            community: communityId,
            author: req.user.id,
            tags
        });
        await post.save();
        res.status(201).json(post);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getPosts = async (req, res) => {
    try {
        const posts = await Post.find()
            .populate('author', 'firstName lastName')
            .populate('community', 'name slug')
            .sort({ createdAt: -1 });
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getPostById = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate('author', 'firstName lastName')
            .populate('community', 'name slug');
        if (!post) return res.status(404).json({ message: 'Post not found' });
        res.json(post);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.votePost = async (req, res) => {
    try {
        const { direction } = req.body; // 1 for up, -1 for down, 0 to remove
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const userId = req.user.id;

        // Remove existing votes from both arrays
        post.votes = post.votes.filter(id => id.toString() !== userId);
        post.downvotes = post.downvotes.filter(id => id.toString() !== userId);

        if (direction === 1) {
            post.votes.push(userId);
        } else if (direction === -1) {
            post.downvotes.push(userId);
        }

        await post.save();
        res.json(post);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- Comment Controllers ---

exports.createComment = async (req, res) => {
    try {
        const { content, postId, parentCommentId } = req.body;
        const comment = new Comment({
            content,
            post: postId,
            author: req.user.id,
            parentComment: parentCommentId || null
        });
        await comment.save();

        await Post.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } });

        res.status(201).json(comment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getCommentsByPost = async (req, res) => {
    try {
        const comments = await Comment.find({ post: req.params.postId })
            .populate('author', 'firstName lastName')
            .sort({ createdAt: 1 });
        res.json(comments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
