const express = require('express');
const router = express.Router();
const communityController = require('../controllers/communityController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

// Community Routes
router.get('/', communityController.getAllCommunities);
router.post('/', communityController.createCommunity);
router.get('/communities', communityController.getCommunities);
router.get('/communities/:slug', communityController.getCommunityBySlug);
router.post('/communities/:slug/join', communityController.joinCommunity);
router.post('/communities/:slug/leave', communityController.leaveCommunity);

// Post Routes
router.post('/posts', protect, communityController.createPost);
router.get('/posts', communityController.getPosts);
router.get('/posts/:id', communityController.getPostById);
router.put('/posts/:id', protect, communityController.updatePost);
router.delete('/posts/:id', protect, communityController.deletePost);
router.put('/posts/:id/vote', protect, communityController.votePost);

// Comment Routes
router.post('/comments', protect, communityController.createComment);
router.get('/posts/:postId/comments', communityController.getCommentsByPost);
router.put('/comments/:id/vote', protect, communityController.voteComment);

// User Activity Routes
router.get('/me/posts', protect, communityController.getUserPosts);
router.get('/me/comments', protect, communityController.getUserComments);

module.exports = router;
