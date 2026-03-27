const UserSkillProfile = require('../models/UserSkillProfile');
const User = require('../models/User');
const Post = require('../models/Post');
const { calculateMatchScore } = require('./matchingEngine');

class CommunitySuggestionService {
    /**
     * Get recommended contributors for a specific community post using HSVSM.
     * @param {String} postId 
     * @param {Number} limit 
     */
    async getRecommendedContributors(postId, limit = 5) {
        try {
            const post = await Post.findById(postId);
            if (!post) throw new Error('Post not found');

            // Find all potential users to recommend
            // Ideally we exclude the author of the post
            const profiles = await UserSkillProfile.find({ user: { $ne: post.author } })
                .populate('user', 'firstName lastName avatar email bio');

            const postData = {
                requiredSkills: post.tags || [],
                description: post.content || '',
                title: post.title || ''
            };

            const suggestions = profiles.map(profile => {
                const user = profile.user || {};

                const fullUserProfile = {
                    _id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    avatar: user.avatar,
                    email: user.email,
                    skills: profile.skills || [],
                    bio: user.bio || '',
                    posts: [] // we could fetch users' posts here but it's expensive to do for all users, so we skip for speed unless explicitly needed. Bio + skills provides enough context.
                };

                const engineResult = calculateMatchScore(fullUserProfile, postData);

                return {
                    userId: engineResult.userId,
                    name: engineResult.name,
                    avatar: engineResult.avatar,
                    matchScore: engineResult.matchScore,
                    semanticScore: engineResult.semanticScore,
                    cosineScore: engineResult.cosineScore,
                    expertise: engineResult.skills.slice(0, 3).join(', ') // Top 3 skills for "Expertise relevance" UI text
                };
            });

            // Filter out poor matches and sort
            const sortedSuggestions = suggestions
                .filter(s => s.matchScore > 0.1) // Minimum threshold
                .sort((a, b) => b.matchScore - a.matchScore)
                .slice(0, limit);

            return sortedSuggestions;
        } catch (error) {
            console.error('Error fetching recommended contributors:', error);
            return [];
        }
    }
}

module.exports = new CommunitySuggestionService();
