const express = require('express');
const router = express.Router();
const { getNotifications, markRead, acceptTeamInvite, getInviteByChallengeId } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getNotifications);
router.put('/read', markRead);
router.post('/:id/accept', acceptTeamInvite);
router.get('/challenge/:challengeId', getInviteByChallengeId);

module.exports = router;
