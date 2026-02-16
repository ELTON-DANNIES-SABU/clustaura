class FeedRankingService {
    calculateScore(post) {
        let score = 0;
        const now = new Date();
        const postDate = new Date(post.createdAt);

        // 1. Recency (Decay) - Heavy weight
        // Simple linear decay: lost 1 point per hour, max 100 points based on recency
        const hoursOld = (now - postDate) / (1000 * 60 * 60);
        const recencyScore = Math.max(0, 100 - (hoursOld * 2));
        score += recencyScore;

        // 2. Engagement
        // Likes = 10 pts, Comments = 15 pts
        const likesCount = post.likes ? post.likes.length : 0;
        const commentsCount = post.comments ? post.comments.length : 0;
        const engagementScore = (likesCount * 10) + (commentsCount * 15);
        // Cap engagement impact to prevent viral posts from staying forever
        score += Math.min(engagementScore, 1000);

        // 3. Post Type
        if (post.isCreatorPost) score += 50;
        if (post.projectLink) score += 30; // Project showcases are valuable
        if (post.media && post.media.length > 0) score += 20;

        return score;
    }

    async getRankedFeed(posts) {
        // In-memory ranking for MVP. 
        // Logic:
        // 1. Calculate score for each post
        // 2. Sort by score desc
        if (!posts || posts.length === 0) return [];

        const scoredPosts = posts.map(post => {
            // If it's a lean object, we might need to handle properties carefully
            const score = this.calculateScore(post);
            return {
                ...post,
                rankingScore: score
            };
        });

        return scoredPosts.sort((a, b) => b.rankingScore - a.rankingScore);
    }
}

module.exports = new FeedRankingService();
