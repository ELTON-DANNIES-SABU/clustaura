const express = require('express');
const router = express.Router();
const {
    getChallenges,
    getChallengeById,
    createChallenge,
    voteChallenge,
    joinChallenge,
    addComment
} = require('../controllers/challengeController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected as requested ("visible to all users registered")
router.route('/')
    .get(protect, getChallenges)
    .post(protect, createChallenge);

router.get('/:id', protect, getChallengeById);
router.put('/:id/vote', protect, voteChallenge);
router.put('/:id/join', protect, joinChallenge);
router.post('/:id/comments', protect, addComment);

module.exports = router;
