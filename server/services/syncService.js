const User = require('../models/User');
const Profile = require('../models/Profile');
const Post = require('../models/Post');
const recommenderService = require('./recommenderService');

/**
 * Service to synchronize diverse data sources with the AI Engine
 */
class SyncService {
    /**
     * Synchronize all users from MongoDB to the AI Engine
     */
    async syncUsersToAI() {
        console.log('🔄 [SyncService] Starting full user synchronization...');
        try {
            const users = await User.find({});
            console.log(`[SyncService] Found ${users.length} users to sync.`);

            let successCount = 0;
            let failCount = 0;

            for (const user of users) {
                try {
                    // Fetch profile and posts for this user
                    const profile = await Profile.findOne({ user: user._id });
                    const posts = await Post.find({ author: user._id });

                    const userData = {
                        user_id: user._id.toString(),
                        bio: profile ? (profile.bio || '') : '',
                        skills: profile ? (profile.skills || []) : [],
                        projects: [], // We can extend this if we have a Project model
                        posts: posts.map(p => ({
                            id: p._id.toString(),
                            title: p.title || '',
                            content: p.content || '',
                            description: p.description || '' // Handle different post schemas
                        }))
                    };

                    await recommenderService.ingestUser(userData);
                    successCount++;
                } catch (err) {
                    console.error(`[SyncService] Failed to sync user ${user._id}:`, err.message);
                    failCount++;
                }
            }

            console.log(`✅ [SyncService] Sync complete. Success: ${successCount}, Failed: ${failCount}`);
        } catch (error) {
            console.error('❌ [SyncService] Error during user sync:', error);
        }
    }
}

module.exports = new SyncService();
