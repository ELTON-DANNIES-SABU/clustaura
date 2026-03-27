const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getProjectMemberAnalytics } = require('../controllers/analyticsController');

router.use(protect);

router.get('/project/:projectId/members', getProjectMemberAnalytics);

module.exports = router;
