const express = require('express');
const router = express.Router();
const aiGuideController = require('../controllers/aiGuideController');

// @route   POST api/ai-guide/query
// @desc    Get AI Guide assistance
// @access  Public (or Private if authentication is needed later)
router.post('/query', aiGuideController.getGuideResponse);

module.exports = router;
