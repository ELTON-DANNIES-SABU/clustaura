const express = require('express');
const router = express.Router();
const { getTechNews } = require('../controllers/newsController');
const { protect } = require('../middleware/authMiddleware');

// Get tech news (authenticated users)
router.get('/', protect, getTechNews);

module.exports = router;
