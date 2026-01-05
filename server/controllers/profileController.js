const Profile = require('../models/Profile');
const User = require('../models/User');

// @desc    Get current user profile
// @route   GET /api/profile/me
// @access  Private
const getProfile = async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user._id }).populate('user', 'firstName lastName email');

        if (!profile) {
            // Return empty profile with user info if not found
            return res.json({
                user: req.user,
                skills: []
            });
        }

        res.json(profile);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create or update user profile
// @route   PUT /api/profile/me
// @access  Private
const updateProfile = async (req, res) => {
    const {
        bio,
        skills,
        location,
        website,
        github,
        twitter,
        profileImageUrl,
        firstName,
        lastName,
        email
    } = req.body;

    // Build profile object
    const profileFields = {};
    profileFields.user = req.user._id;
    if (bio) profileFields.bio = bio;
    if (skills) profileFields.skills = skills;
    if (location) profileFields.location = location;
    if (website) profileFields.website = website;
    if (github) profileFields.github = github;
    if (twitter) profileFields.twitter = twitter;
    if (profileImageUrl) profileFields.profileImageUrl = profileImageUrl;

    try {
        // Update user basic info if provided
        if (firstName || lastName || email) {
            const user = await User.findById(req.user._id);
            if (firstName) user.firstName = firstName;
            if (lastName) user.lastName = lastName;
            if (email) user.email = email;
            await user.save();
        }

        let profile = await Profile.findOne({ user: req.user._id });

        if (profile) {
            // Update
            profile = await Profile.findOneAndUpdate(
                { user: req.user._id },
                { $set: profileFields },
                { new: true }
            );
            return res.json(profile);
        }

        // Create
        profile = new Profile(profileFields);
        await profile.save();
        res.json(profile);

    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({
            message: 'Server Error',
            error: error.message
        });
    }
};

// @desc    Get profile by user ID
// @route   GET /api/profile/user/:user_id
// @access  Private
const getUserProfileById = async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.params.user_id }).populate('user', 'firstName lastName email');

        if (!profile) {
            // Check if user exists even if profile doesn't
            const user = await User.findById(req.params.user_id).select('firstName lastName email');
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            // Return minimal profile structure
            return res.json({
                user: user,
                skills: [],
                bio: '',
                location: '',
                website: '',
                github: '',
                twitter: '',
                profileImageUrl: ''
            });
        }

        res.json(profile);
    } catch (error) {
        console.error(error.message);
        if (error.kind == 'ObjectId') {
            return res.status(400).json({ message: 'Profile not found' });
        }
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getProfile,
    updateProfile,
    getUserProfileById
};
