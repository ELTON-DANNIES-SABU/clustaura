const Profile = require('../models/Profile');
const User = require('../models/User');
const recommenderService = require('../services/recommenderService');
const PDFDocument = require('pdfkit');

const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Challenge = require('../models/Challenge');

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

            // Ingest updated profile into AI Engine
            try {
                await recommenderService.ingestUser({
                    user_id: req.user._id.toString(),
                    bio: profileFields.bio || profile.bio || '',
                    skills: profileFields.skills || profile.skills || [],
                    projects: [],
                    posts: []
                });
                console.log('[ProfileController] User profile updated in AI engine:', req.user._id);
            } catch (aiErr) {
                console.error('[ProfileController] AI Ingestion Error:', aiErr.message);
            }

            return res.json(profile);
        }

        // Create
        profile = new Profile(profileFields);
        await profile.save();

        // Ingest user profile into AI Engine for recommendations
        try {
            await recommenderService.ingestUser({
                user_id: req.user._id.toString(),
                bio: profileFields.bio || '',
                skills: profileFields.skills || [],
                projects: [],
                posts: []
            });
            console.log('[ProfileController] User profile ingested into AI engine:', req.user._id);
        } catch (aiErr) {
            console.error('[ProfileController] AI Ingestion Error:', aiErr.message);
        }

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

        // Fetch posts for this user
        const posts = await Post.find({ author: req.params.user_id })
            .populate('author', 'firstName lastName avatar role')
            .populate('community', 'name slug')
            .sort({ createdAt: -1 });

        if (!profile) {
            // Check if user exists even if profile doesn't
            const user = await User.findById(req.params.user_id).select('firstName lastName email');
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            // Return minimal profile structure + posts
            return res.json({
                user: user,
                skills: [],
                bio: '',
                location: '',
                website: '',
                github: '',
                twitter: '',
                profileImageUrl: '',
                posts: posts || []
            });
        }

        // Convert mongoose document to object and add posts
        const profileObj = profile.toObject();
        profileObj.posts = posts || [];

        res.json(profileObj);
    } catch (error) {
        console.error(error.message);
        if (error.kind == 'ObjectId') {
            return res.status(400).json({ message: 'Profile not found' });
        }
        res.status(500).json({ message: 'Server Error' });
    }
};

const exportUserData = async (req, res) => {
    try {
        const userId = req.user._id;

        const [profile, user, posts, challenges, comments] = await Promise.all([
            Profile.findOne({ user: userId }).lean(),
            User.findById(userId).select('-password').lean(),
            Post.find({ author: userId }).populate('community', 'name').lean(),
            Challenge.find({ author: userId }).lean(),
            Comment.find({ author: userId }).populate({
                path: 'post',
                select: 'title',
                populate: { path: 'community', select: 'name' }
            }).lean()
        ]);

        const doc = new PDFDocument({ margin: 50 });
        let filename = `clustaura-export-${user.firstName}.pdf`;

        // Setting response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        doc.pipe(res);

        // Header
        doc.fillColor('#00ffa3').fontSize(25).text('ClustAura', { align: 'center' });
        doc.fillColor('#666666').fontSize(12).text('UserData Activity Report', { align: 'center' });
        doc.moveDown();
        doc.strokeColor('#333333').moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // Account Section
        doc.fillColor('#ffffff').fontSize(16).text('Account Details', { underline: true });
        doc.fontSize(10).fillColor('#333333');
        doc.moveDown(0.5);
        doc.text(`Name: ${user.firstName} ${user.lastName}`);
        doc.text(`Email: ${user.email}`);
        doc.text(`Join Date: ${new Date(user.createdAt).toLocaleDateString()}`);
        if (profile?.bio) doc.text(`Bio: ${profile.bio}`);
        doc.moveDown();

        // Activity Summary
        doc.fillColor('#ffffff').fontSize(16).text('Activity Summary', { underline: true });
        doc.fontSize(10).fillColor('#333333');
        doc.moveDown(0.5);
        doc.text(`Total Community Posts: ${posts.length}`);
        doc.text(`Total Technical Challenges: ${challenges.length}`);
        doc.text(`Total Comments Made: ${comments.length}`);
        doc.moveDown();

        // Posts Section
        if (posts.length > 0) {
            doc.fillColor('#ffffff').fontSize(16).text('Community Posts', { underline: true });
            doc.moveDown(0.5);
            posts.forEach((p, i) => {
                doc.fillColor('#00ffa3').fontSize(11).text(`${i + 1}. ${p.title}`);
                doc.fillColor('#666666').fontSize(9).text(`Community: ${p.community?.name || 'General'} | Date: ${new Date(p.createdAt).toLocaleDateString()}`);
                doc.fillColor('#333333').fontSize(10).text(p.content?.substring(0, 200) + (p.content?.length > 200 ? '...' : ''));
                doc.moveDown(0.5);
            });
            doc.moveDown();
        }

        // Challenges Section
        if (challenges.length > 0) {
            doc.fillColor('#ffffff').fontSize(16).text('Technical Challenges', { underline: true });
            doc.moveDown(0.5);
            challenges.forEach((c, i) => {
                doc.fillColor('#3498db').fontSize(11).text(`${i + 1}. ${c.title}`);
                doc.fillColor('#666666').fontSize(9).text(`Type: ${c.type || 'Standard'} | Difficulty: ${c.difficulty || 'Normal'}`);
                doc.fillColor('#333333').fontSize(10).text(c.description?.substring(0, 200) + (c.description?.length > 200 ? '...' : ''));
                doc.moveDown(0.5);
            });
            doc.moveDown();
        }

        // Comments Section
        if (comments.length > 0) {
            doc.fillColor('#ffffff').fontSize(16).text('Recent Comments', { underline: true });
            doc.moveDown(0.5);
            comments.forEach((c, i) => {
                doc.fillColor('#333333').fontSize(10).text(`"${c.content}"`);
                doc.fillColor('#666666').fontSize(9).text(`On: ${c.post?.title || 'Unknown Post'} | Date: ${new Date(c.createdAt).toLocaleDateString()}`);
                doc.moveDown(0.5);
            });
        }

        // Footer
        const pageCount = doc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
            doc.switchToPage(i);
            doc.fontSize(8).fillColor('#999999').text(
                `Generated by ClustAura on ${new Date().toLocaleString()} - Page ${i + 1}`,
                50,
                doc.page.height - 50,
                { align: 'center' }
            );
        }

        doc.end();

    } catch (error) {
        console.error('Export PDF Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Server Error during PDF export' });
        }
    }
};

module.exports = {
    getProfile,
    updateProfile,
    getUserProfileById,
    exportUserData
};
