const express = require('express');
const router = express.Router();
const { getMessages } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

// Get messages between current user and a friend
router.get('/:friendId', protect, getMessages);

module.exports = router;
