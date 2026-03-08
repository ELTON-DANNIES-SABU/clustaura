const ProfessionalPost = require('../models/ProfessionalPost');
const User = require('../models/User');

// @desc    Get all professional posts
// @route   GET /api/professional
// @access  Private
const getFeed = async (req, res) => {
    try {
        const posts = await ProfessionalPost.find()
            .populate('author', 'firstName lastName email avatar role')
            .sort({ createdAt: -1 });
        res.json(posts);
    } catch (error) {
        console.error('Error fetching professional feed:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a professional post
// @route   POST /api/professional
// @access  Private
const createPost = async (req, res) => {
    try {
        const { title, content, type, tags, media, projectLink } = req.body;

        if (!['Work', 'Project', 'Experience'].includes(type)) {
            return res.status(400).json({ message: 'Invalid post type' });
        }

        const newPost = new ProfessionalPost({
            author: req.user._id,
            title,
            content,
            type,
            tags: tags || [],
            media: media || [],
            projectLink
        });

        const savedPost = await newPost.save();

        const populatedPost = await ProfessionalPost.findById(savedPost._id)
            .populate('author', 'firstName lastName email avatar role');

        // Emit real-time event
        const io = req.app.get('io');
        io.emit('new-professional-post', populatedPost);

        res.status(201).json(populatedPost);
    } catch (error) {
        console.error('Error creating professional post:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Like a professional post
// @route   POST /api/professional/:id/like
// @access  Private
const likePost = async (req, res) => {
    try {
        const post = await ProfessionalPost.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        if (post.likes.includes(req.user._id)) {
            post.likes = post.likes.filter(id => id.toString() !== req.user._id.toString());
        } else {
            post.likes.push(req.user._id);
        }

        await post.save();
        res.json(post.likes);
    } catch (error) {
        console.error('Error liking post:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getFeed,
    createPost,
    likePost
};
