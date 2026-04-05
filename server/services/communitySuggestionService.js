const UserSkillProfile = require('../models/UserSkillProfile');
const User = require('../models/User');
const Post = require('../models/Post');
const profileMatchingEngine = require('./profileMatchingEngine');

class CommunitySuggestionService {
    /**
     * Get recommended contributors for a specific community post using the new Profile Intelligence engine.
     * @param {String} postId 
     * @param {Number} limit 
     */
    async getRecommendedContributors(postId, limit = 5) {
        try {
            const post = await Post.findById(postId);
            if (!post) throw new Error('Post not found');

            // Find all potential users to recommend
            const profiles = await UserSkillProfile.find({ user: { $ne: post.author } })
                .populate('user', 'firstName lastName avatar email bio');

            const postData = {
                requiredSkills: post.tags || [],
                description: post.content || '',
                title: post.title || ''
            };

            const suggestionsPromises = profiles.map(async (profile) => {
                const user = profile.user || {};

                // Fetch real user evidence for matching
                const userPosts = await Post.find({ author: user._id })
                    .limit(10)
                    .select('title content');

                const fullUserProfile = {
                    _id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    avatar: user.avatar,
                    email: user.email,
                    skills: profile.skills || [],
                    bio: user.bio || '',
                    posts: userPosts
                };

                const engineResult = profileMatchingEngine.calculateMatchScore(fullUserProfile, postData);

                return {
                    userId: engineResult.userId,
                    name: engineResult.name,
                    avatar: engineResult.avatar,
                    matchScore: engineResult.matchScore,
                    ontologyScore: engineResult.ontologyScore,
                    bioScore: engineResult.bioScore,
                    postScore: engineResult.postScore,
                    expertise: engineResult.skills.slice(0, 3).join(', ')
                };
            });

            const suggestions = await Promise.all(suggestionsPromises);

            // Filter out poor matches and sort
            const sortedSuggestions = suggestions
                .filter(s => s.matchScore > 0.05) // Minimum threshold
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
