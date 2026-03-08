const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getUserProfileById, exportUserData } = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');

router.get('/me', protect, getProfile);
router.put('/me', protect, updateProfile);
router.get('/export', protect, exportUserData);
router.get('/user/:user_id', protect, getUserProfileById);

module.exports = router;
