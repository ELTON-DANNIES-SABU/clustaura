const express = require('express');
const router = express.Router();
const {
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    getFriends,
    getFriendRequests,
    searchUsers
} = require('../controllers/friendController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // All routes protected

router.get('/', getFriends);
router.get('/requests', getFriendRequests);
router.get('/search', searchUsers);

router.post('/request/:id', sendFriendRequest);
router.put('/accept/:id', acceptFriendRequest);
router.put('/reject/:id', rejectFriendRequest);
router.delete('/:id', removeFriend);

module.exports = router;
