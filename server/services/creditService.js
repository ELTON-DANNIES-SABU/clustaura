const User = require('../models/User');
const CreditLedger = require('../models/CreditLedger');

// Game Theory Coefficients
const ALPHA_EFFORT = 10;   // Base multiplier for effort
const BETA_IMPACT = 2;     // Multiplier for community impact (likes/comments)
const DELTA_LOYALTY = 0.1; // Multiplier for logic streak/consistency
const GAMMA_CONTRIB = 5;   // Reward for collaborators

// Star Tier Thresholds
const TIERS = {
    BRONZE: 0,
    SILVER: 21, // 21 Stars (Note: Logic might map credits -> stars)
    NEON: 51    // 51 Stars
};

const CREDITS_PER_STAR = 100; // 100 Credits = 1 Star

/**
 * Calculate and award credits for creating a post.
 * Payoff = α · EffortScore
 */
/**
 * Calculate and award credits for creating a post.
 * Payoff = α · EffortScore + δ · LoyaltyScore
 */
const awardPostCreationCredits = async (userId, post) => {
    try {
        // Effort Score Calculation
        let effortScore = 1;

        // Length factor
        if (post.content && post.content.length > 500) effortScore += 1;
        if (post.content && post.content.length > 1500) effortScore += 1;

        // Multimedia factor
        if (post.media && post.media.length > 0) effortScore += 2;

        // Type factor
        if (post.type === 'Project') effortScore += 5;       // Projects are high effort
        if (post.type === 'Challenge') effortScore += 3;
        if (post.type === 'Solution') effortScore += 4;      // Solutions are valuable

        // Loyalty Score (Consistency) - scalable based on user history (simplified here)
        // In a full system, we'd query recent activity streaks
        const loyaltyScore = 1;

        // Total Payoff: ΔCredit_creator = α·EffortScore + δ·LoyaltyScore
        // Note: Impact (β) is added incrementally via interactions
        const credits = Math.round((ALPHA_EFFORT * effortScore) + (DELTA_LOYALTY * loyaltyScore * 100));

        await addCredits(userId, credits, 'post_creation', post._id, `Created ${post.type}: ${post.title || 'Update'}`);
        return credits;
    } catch (error) {
        console.error('Error awarding post credits:', error);
    }
};

/**
 * Calculate and award credits for impact (likes/comments).
 * Payoff = β · ImpactScore
 * This is usually called incrementally.
 */
const awardImpactCredits = async (authorId, postId, type) => {
    try {
        const credits = BETA_IMPACT; // 2 credits per like/comment
        await addCredits(authorId, credits, 'post_impact', postId, `Received ${type} on post`);
    } catch (error) {
        console.error('Error awarding impact credits:', error);
    }
};

/**
 * Calculate and award credits for contributing (commenting/solving).
 * Payoff = γ · Contribution_j
 */
const awardContributionCredits = async (userId, targetId, type) => {
    try {
        let credits = GAMMA_CONTRIB; // 5 credits base

        // Solutions usually worth more
        if (type === 'Solution') credits += 10;

        await addCredits(userId, credits, 'collaboration', targetId, `Contributed ${type}`);
    } catch (error) {
        console.error('Error awarding contribution credits:', error);
    }
};

/**
 * Endorse a collaborator (Project Owner -> Helper)
 * Payoff = η · CreatorEndorsement
 */
const endorseCollaborator = async (endorserId, collaboratorId, projectId, amount = 10) => {
    try {
        // Verify endorser owns the project (in controller usually, but safe to check)
        // For now, assume validation happened in controller

        // Fixed endorsement bonus or custom amount capped
        const bonus = Math.min(amount, 50); // Cap at 50 credits per endorsement

        await addCredits(collaboratorId, bonus, 'collaboration', projectId, `Endorsed by Project Creator`);

        // Optional: Small reward for the endorser for being a good leader?
        // await addCredits(endorserId, 2, 'loyalty', projectId, 'Endorsed a collaborator');
    } catch (error) {
        console.error('Error endorsing collaborator:', error);
    }
};

/**
 * Calculate theoretical payoff (Dry Run)
 */
const calculatePayoff = (params) => {
    const { effort, impact, loyalty, isCollaborator, contribution } = params;

    if (isCollaborator) {
        // ΔCredit_j = γ·Contribution_j + η·CreatorEndorsement + θ·EngagementGenerated
        // Simplified for dry run
        return (GAMMA_CONTRIB * (contribution || 1));
    } else {
        // ΔCredit_creator = α·EffortScore + β·ImpactScore + δ·LoyaltyScore
        return (ALPHA_EFFORT * (effort || 1)) + (BETA_IMPACT * (impact || 0)) + (DELTA_LOYALTY * (loyalty || 0) * 100);
    }
};

/**
 * Core function to add credits, update ledger, and recalc stars.
 */
const addCredits = async (userId, amount, type, sourceId, description) => {
    // Debug Log
    console.log(`[CreditService] addCredits called: User=${userId}, Amount=${amount}, Type=${type}`);

    const user = await User.findById(userId);
    if (!user) {
        console.error(`[CreditService] User not found: ${userId}`);
        return;
    }

    // 1. Update User Credits
    const oldCredits = user.credits;
    if (typeof user.credits !== 'number') user.credits = 0;
    user.credits += amount;

    // 2. Update Breakdown
    if (!user.creditBreakdown) {
        user.creditBreakdown = {
            projects: 0,
            impact: 0,
            collaborations: 0,
            loyalty: 0
        };
    }
    // Ensure sub-fields exist in case of partial object
    if (typeof user.creditBreakdown.projects !== 'number') user.creditBreakdown.projects = 0;
    if (typeof user.creditBreakdown.impact !== 'number') user.creditBreakdown.impact = 0;
    if (typeof user.creditBreakdown.collaborations !== 'number') user.creditBreakdown.collaborations = 0;
    if (typeof user.creditBreakdown.loyalty !== 'number') user.creditBreakdown.loyalty = 0;

    if (type === 'post_creation') user.creditBreakdown.projects += amount;
    if (type === 'post_impact') user.creditBreakdown.impact += amount;
    if (type === 'collaboration') user.creditBreakdown.collaborations += amount;
    if (type === 'daily_login') user.creditBreakdown.loyalty += amount;

    // 3. Recalculate Stars & Tier
    const totalStars = Math.floor(user.credits / CREDITS_PER_STAR);
    user.creditStars = totalStars;

    if (totalStars >= TIERS.NEON) user.starTier = 'Neon';
    else if (totalStars >= TIERS.SILVER) user.starTier = 'Silver';
    else user.starTier = 'Bronze';

    // Mark modified to ensure mongoose saves mixed/nested changes
    user.markModified('creditBreakdown');
    await user.save();

    // 4. Record in Ledger
    await CreditLedger.create({
        user: userId,
        amount,
        type,
        source: sourceId,
        description
    });
};

/**
 * Get user credit stats
 */
const getUserCreditStats = async (userId) => {
    const user = await User.findById(userId).select('credits creditStars starTier creditBreakdown');
    return user;
};

module.exports = {
    awardPostCreationCredits,
    awardImpactCredits,
    awardContributionCredits,
    endorseCollaborator,
    calculatePayoff,
    addCredits,
    getUserCreditStats
};
