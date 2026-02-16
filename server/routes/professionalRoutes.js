const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getFeed, createPost, likePost } = require('../controllers/professionalController');

router.get('/', protect, getFeed);
router.post('/', protect, createPost);
router.post('/:id/like', protect, likePost);

module.exports = router;
