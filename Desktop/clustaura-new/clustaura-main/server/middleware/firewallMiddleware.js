/**
 * Showcase vs Challenge Firewall
 * Responsibilities:
 * - Prevent Professional usage in Challenge domain and vice-versa
 * - Enforce moderation rules
 */

const protectDomainIntegrity = (req, res, next) => {
    // Assuming req.body has 'type' or 'domain' and route gives context
    // This runs on POST creation routes

    const { type, domain, tags } = req.body;
    const targetCollection = req.baseUrl.includes('post') ? 'SHOWCASE' : (req.baseUrl.includes('challenge') ? 'CHALLENGE' : 'UNKNOWN');

    // Rule 1: No "Challenge" or "Help" tags in Showcase
    if (targetCollection === 'SHOWCASE') {
        const forbiddenTags = ['help', 'challenge', 'fix', 'bug', 'issue'];
        if (tags && tags.some(t => forbiddenTags.includes(t.toLowerCase()))) {
            return res.status(400).json({
                message: 'Showcase Violation: Please use the Challenge domain for help requests or bug fixes.'
            });
        }
    }

    // Rule 2: No "Hiring" or "Job" tags in Challenges (Showcase/Prof only)
    if (targetCollection === 'CHALLENGE') {
        const forbiddenTags = ['hiring', 'job', 'vacancy', 'offer'];
        if (tags && tags.some(t => forbiddenTags.includes(t.toLowerCase()))) {
            return res.status(400).json({
                message: 'Challenge Violation: Job offers belong in the Professional Showcase stream.'
            });
        }
    }

    next();
};

module.exports = { protectDomainIntegrity };
