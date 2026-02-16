const User = require('../models/User');
const Challenge = require('../models/Challenge');

// @desc    Search users and challenges
// @route   GET /api/search
// @access  Private
const searchGlobal = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.trim() === '') {
            return res.status(400).json({ message: 'Search query is required' });
        }

        const query = q.trim();
        const regex = new RegExp(query, 'i'); // Case-insensitive regex

        // Parallel execution for better performance
        const [users, challenges] = await Promise.all([
            // Search Users
            User.find({
                $or: [
                    { firstName: regex },
                    { lastName: regex },
                    { email: regex }
                ]
            }).select('firstName lastName email _id').limit(5),

            // Search Challenges
            Challenge.find({
                $or: [
                    { title: regex },
                    { description: regex },
                    { tags: regex }
                ]
            })
                .populate('author', 'firstName lastName')
                .select('title difficulty tags _id author')
                .limit(5)
        ]);

        res.json({
            users: users,
            challenges: challenges
        });

    } catch (error) {
        console.error('Search Error:', error);
        res.status(500).json({ message: 'Server Error during search' });
    }
};

module.exports = {
    searchGlobal
};
