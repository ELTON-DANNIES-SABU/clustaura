const express = require('express');
const router = express.Router();
const { registerUser, loginUser, updatePassword, sendOTP, verifyOTPAndResetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.put('/update-password', protect, updatePassword);
router.post('/forgot-password', sendOTP);
router.post('/reset-password', verifyOTPAndResetPassword);

module.exports = router;
