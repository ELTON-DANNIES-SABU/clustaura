const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware'); // Assuming this exists given authRoutes

const { protectDomainIntegrity } = require('../middleware/firewallMiddleware');

// All routes are protected
router.use(protect);

router.post('/', protectDomainIntegrity, postController.createPost);
router.get('/feed', postController.getFeed);
router.post('/:id/like', postController.likePost);
router.post('/:id/comment', postController.commentPost);
// router.post('/:id/repost', postController.repostPost); // To be implemented

module.exports = router;
