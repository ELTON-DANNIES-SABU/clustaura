const express = require('express');
const router = express.Router();
const { searchGlobal } = require('../controllers/searchController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, searchGlobal);

module.exports = router;
