const express = require('express');
const router = express.Router();
const {
    getChallenges,
    getChallengeById,
    createChallenge,
    voteChallenge,
    joinChallenge,
    addComment,
    updateChallenge,
    deleteChallenge,
    sendTeamInvite
} = require('../controllers/challengeController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected as requested ("visible to all users registered")
router.route('/')
    .get(protect, getChallenges)
    .post(protect, createChallenge);

router.post('/:id/comments', protect, addComment);
router.put('/:id/vote', protect, voteChallenge);
router.put('/:id/join', protect, joinChallenge);
router.post('/:id/invite', protect, sendTeamInvite); // New route for team invites
router.route('/:id')
    .get(protect, getChallengeById)
    .put(protect, updateChallenge)
    .delete(protect, deleteChallenge);

module.exports = router;
