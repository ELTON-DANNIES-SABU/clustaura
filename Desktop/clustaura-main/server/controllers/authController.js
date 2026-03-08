const User = require('../models/User');
const { sendOTPEmail } = require('../utils/emailService');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;

        // Validation
        if (!firstName || !lastName || !email || !password) {
            res.status(400);
            throw new Error('Please include all fields');
        }

        // Find if user already exists
        const userExists = await User.findOne({ email });

        if (userExists) {
            res.status(400);
            throw new Error('User already exists');
        }

        // Create user
        const user = await User.create({
            firstName,
            lastName,
            email,
            password
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                token: generateToken(user._id)
            });
        } else {
            res.status(400);
            throw new Error('Invalid user data');
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Login a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        // Check user and password match
        if (user && (await user.matchPassword(password))) {
            res.status(200).json({
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                token: generateToken(user._id)
            });
        } else {
            res.status(401);
            throw new Error('Invalid credentials');
        }
    } catch (error) {
        res.status(401).json({ message: error.message });
    }
};

// Generate Token
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', {
        expiresIn: '30d',
    });
};

// @desc    Update user password
// @route   PUT /api/auth/update-password
// @access  Private
const updatePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);

        if (user && (await user.matchPassword(oldPassword))) {
            user.password = newPassword;
            await user.save();
            res.status(200).json({ message: 'Password updated successfully' });
        } else {
            res.status(401);
            throw new Error('Invalid old password');
        }
    } catch (error) {
        res.status(401).json({ message: error.message });
    }
};

// @desc    Send OTP to user's email
// @route   POST /api/auth/forgot-password
// @access  Public
const sendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User with this email does not exist' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Save hashed OTP and expiry (10 mins)
        const salt = await bcrypt.genSalt(10);
        user.otpCode = await bcrypt.hash(otp, salt);
        user.otpExpire = Date.now() + 10 * 60 * 1000;
        await user.save();

        // Send email
        const emailSent = await sendOTPEmail(email, otp);

        if (emailSent) {
            res.status(200).json({ message: 'OTP sent to your email' });
        } else {
            // Keep dev logging in console but return error to UI for "professional" behavior
            console.log(`[DEV] OTP attempted for ${email}: ${otp}`);
            res.status(500).json({
                message: 'Failed to send OTP code. Please ensure your email configuration is correct in .env or contact support.'
            });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify OTP and reset password
// @route   POST /api/auth/reset-password
// @access  Public
const verifyOTPAndResetPassword = async (req, res) => {
    try {
        const { email, otpCode, newPassword } = req.body;
        const user = await User.findOne({ email });

        if (!user || !user.otpCode || !user.otpExpire) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // Check if OTP is expired
        if (Date.now() > user.otpExpire) {
            user.otpCode = undefined;
            user.otpExpire = undefined;
            await user.save();
            return res.status(400).json({ message: 'OTP has expired' });
        }

        // Verify OTP
        const isMatch = await bcrypt.compare(otpCode, user.otpCode);
        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect OTP code' });
        }

        // Update password and clear OTP
        user.password = newPassword;
        user.otpCode = undefined;
        user.otpExpire = undefined;
        await user.save();

        res.status(200).json({ message: 'Password reset successfully. You can now login.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    updatePassword,
    sendOTP,
    verifyOTPAndResetPassword
};
