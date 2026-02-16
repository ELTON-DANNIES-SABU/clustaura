const express = require('express');
const router = express.Router();
const { registerUser, loginUser, updatePassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.put('/update-password', protect, updatePassword);

module.exports = router;
