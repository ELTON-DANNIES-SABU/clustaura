const Post = require('../models/Post');
const User = require('../models/User');
const feedRankingService = require('../services/feedRankingService');
const moderationService = require('../services/moderationService');
const notificationService = require('../services/notificationService');
const recommendationService = require('../services/recommendationService');

// Create a new post
exports.createPost = async (req, res) => {
    console.log("🔥 POST CREATE HIT");
    console.log("Headers:", req.headers);
    console.log("Body:", req.body);
    try {
        const { title, content, community, type, media, projectLink, tags } = req.body;

        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Validate payload: Must have text OR media
        if (!content && (!media || media.length === 0)) {
            return res.status(400).json({ message: 'Post must contain text or media' });
        }

        // Validate title if provided (or make it required based on UI rules)
        if (title && title.length > 120) {
            return res.status(400).json({ message: 'Title must be less than 120 characters' });
        }

        // 1. Content Moderation
        const moderationResult = moderationService.checkContent(content);
        const isHidden = !moderationResult.isSafe;
        const flags = isHidden ? [{ reason: moderationResult.reason, timestamp: new Date() }] : [];

        // 2. Prepare Post Data
        // Note: 'media' is expected to be an array of base64 strings or URLs. 
        // In a real production app, we would upload base64 to S3/Cloudinary here and save URL.
        // For now, we store the base64/URL directly provided by client.

        const newPost = new Post({
            author: req.user.id,
            title,
            content,
            community,
            type: type || 'General Question',
            media: media || [], // Array of strings
            projectLink,
            tags: tags || [],
            isCreatorPost: req.user.role === 'creator',
            isHidden,
            flags,
            analysis: {
                sentiment: 'neutral', // Placeholder
                score: 0
            }
        });

        const savedPost = await newPost.save();

        // Populate author details for the feed
        const populatedPost = await Post.findById(savedPost._id)
            .populate('author', 'firstName lastName avatar role')
            .populate('community', 'name slug')
            .lean();

        // 3. Emit real-time event
        const io = req.app.get('io');
        // Only emit if not hidden (or handle on client)
        // We emit it anyway, client filters hidden, or admins see it
        io.emit('new-post', populatedPost);

        if (isHidden) {
            return res.status(201).json({ ...populatedPost, warning: 'Post is under review for moderation policies.' });
        }

        res.status(201).json(populatedPost);
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Get feed posts
exports.getFeed = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Fetch a larger batch for ranking content
        const rawPosts = await Post.find({ isHidden: { $ne: true } })
            .sort({ createdAt: -1 })
            .limit(limit * 2)
            .populate('author', 'firstName lastName avatar role')
            .populate('comments.user', 'firstName lastName avatar')
            .lean();

        console.log(`🔍 [getFeed] Found ${rawPosts.length} raw posts`);

        // Apply Ranking
        const rankedPosts = await feedRankingService.getRankedFeed(rawPosts);
        console.log(`🔍 [getFeed] Ranked ${rankedPosts.length} posts`);

        // Paginate the ranked result
        const paginatedPosts = rankedPosts.slice(0, limit);

        const total = await Post.countDocuments({ isHidden: { $ne: true } });
        console.log(`🔍 [getFeed] Returning ${paginatedPosts.length} posts. Total available: ${total}`);

        res.json({
            posts: paginatedPosts,
            hasMore: total > skip + limit,
            total
        });
    } catch (error) {
        console.error('Error fetching feed:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Like a post
exports.likePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.id;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Toggle like
        const index = post.likes.indexOf(userId);
        let action = 'unlike';
        if (index === -1) {
            post.likes.push(userId);
            action = 'like';
        } else {
            post.likes.splice(index, 1);
        }

        await post.save();

        // Emit real-time update
        const io = req.app.get('io');
        io.emit('post-updated', {
            postId,
            likes: post.likes,
            action: action === 'like' ? 'like' : 'unlike' // Client mostly cares about new state
        });

        // Send Notification if liked
        if (action === 'like') {
            await notificationService.notify({
                recipient: post.author,
                sender: userId,
                type: 'like',
                content: 'liked your post',
                relatedId: postId,
                io
            });
        }

        res.json(post.likes);
    } catch (error) {
        console.error('Error liking post:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Comment on a post
exports.commentPost = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.id;
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ message: 'Comment text is required' });
        }

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const newComment = {
            user: userId,
            text,
            createdAt: new Date()
        };

        post.comments.push(newComment);
        await post.save();

        // Populate user info for the new comment
        const populatedPost = await Post.findById(postId)
            .populate('comments.user', 'firstName lastName avatar')
            .select('comments author')
            .lean();

        const addedComment = populatedPost.comments[populatedPost.comments.length - 1];

        // Emit real-time update
        const io = req.app.get('io');
        io.emit('post-updated', {
            postId,
            comment: addedComment,
            action: 'comment'
        });

        // Send Notification
        await notificationService.notify({
            recipient: post.author,
            sender: userId,
            type: 'comment',
            content: `commented: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`,
            relatedId: postId,
            io
        });

        res.json(addedComment);
    } catch (error) {
        console.error('Error commenting:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get Recommended Posts
exports.getRecommendations = async (req, res) => {
    try {
        const userId = req.user.id;
        const recommendations = await recommendationService.getRecommendations(userId);
        res.json(recommendations);
    } catch (error) {
        console.error('Error getting recommendations:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
