const Post = require('../models/Post');
const User = require('../models/User');

class RecommendationService {
    // Get recommended posts for a user
    async getRecommendations(userId, limit = 5) {
        try {
            const user = await User.findById(userId);
            if (!user) return [];

            // Simple logic: Find posts by authors with the same role, 
            // excluding posts the user has already liked or authored.

            const recommendations = await Post.find({
                author: { $ne: userId },    // Not my own posts
                likes: { $ne: userId },     // Not posts I liked
                // In a real app, we'd filter by role or interests matching
                // For now, let's just prioritize posts with media or project links 
                // to make them "interesting"
                $or: [
                    { projectLink: { $exists: true, $ne: '' } },
                    { 'media.0': { $exists: true } }
                ]
            })
                .sort({ createdAt: -1 })
                .limit(limit)
                .populate('author', 'firstName lastName avatar role')
                .lean();

            return recommendations;
        } catch (error) {
            console.error('Error fetching recommendations:', error);
            return [];
        }
    }
}

module.exports = new RecommendationService();
