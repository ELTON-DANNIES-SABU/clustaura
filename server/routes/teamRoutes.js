const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createTeamFromComments } = require('../controllers/teamController');

router.post('/from-comments', protect, createTeamFromComments);

module.exports = router;
