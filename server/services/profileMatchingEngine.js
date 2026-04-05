/**
 * Profile Intelligence Matching Engine
 * Implements a hybrid ontology + semantic matching model for Clustaura.
 */

const { skillOntology, findCategory } = require('../utils/skillOntology');

/**
 * Normalizes text for comparison
 */
const normalizeText = (text) => text.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();

/**
 * Creates a term frequency vector
 */
const vectorize = (text) => {
    const tokens = text.toLowerCase().split(/\W+/).filter(t => t.length > 2);
    const vector = {};
    for (const token of tokens) {
        vector[token] = (vector[token] || 0) + 1;
    }
    return vector;
};

/**
 * Computes Cosine Similarity between two text blocks
 */
const cosineSimilarity = (text1, text2) => {
    if (!text1 || !text2) return 0;
    
    const vec1 = vectorize(text1);
    const vec2 = vectorize(text2);

    const allTokens = new Set([...Object.keys(vec1), ...Object.keys(vec2)]);
    
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (const token of allTokens) {
        const v1 = vec1[token] || 0;
        const v2 = vec2[token] || 0;
        dotProduct += v1 * v2;
        norm1 += v1 * v1;
        norm2 += v2 * v2;
    }

    if (norm1 === 0 || norm2 === 0) return 0;
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
};

/**
 * Calculates Ontology-Based Skill Match Score (Weight: 0.5)
 */
const getOntologyMatch = (requiredSkills, userSkills) => {
    if (!requiredSkills || requiredSkills.length === 0) return 1.0; 
    if (!userSkills || userSkills.length === 0) return 0.0;

    let totalScore = 0;
    const userSkillsLower = userSkills.map(s => s.toLowerCase());

    requiredSkills.forEach(req => {
        const reqLower = req.toLowerCase();
        let skillScore = 0;
        
        // 1. Exact Match
        if (userSkillsLower.includes(reqLower)) {
            skillScore = 1.0;
        } 
        // 2. Semantic/Ontology Match
        else {
            const category = findCategory(reqLower);
            if (category && userSkillsLower.some(us => findCategory(us) === category)) {
                skillScore = 0.6;
            }
            // 3. Substring match
            else if (userSkillsLower.some(us => us.includes(reqLower) || reqLower.includes(us))) {
                skillScore = 0.3;
            }
        }

        // --- Specialization Bonus (Differentiator) ---
        // If they have the skill, give them a bonus for other skills in the same category
        if (skillScore > 0) {
            const category = findCategory(reqLower);
            if (category) {
                const sameCategorySkills = userSkillsLower.filter(us => findCategory(us) === category && us !== reqLower);
                // Boost of 0.05 per related skill, capped at 0.15 total bonus
                const specializationBonus = Math.min(sameCategorySkills.length * 0.05, 0.15); 
                skillScore += specializationBonus;
            }
        }

        totalScore += Math.min(skillScore, 1.25); // Cap individual skill score after bonus
    });

    return totalScore / requiredSkills.length;
};

/**
 * Calculates Bio Semantic & Ontology Relevance Score (Weight: 0.2)
 */
const getBioSemanticScore = (bio, requiredSkills, taskDescription) => {
    if (!bio) return 0;
    
    // 1. Semantic Similarity
    const baseSimilarity = cosineSimilarity(bio, taskDescription);
    
    // 2. Ontology Match in Bio
    // Check if the bio mentions the required skills or related category skills
    let ontologyMatchCount = 0;
    const bioLower = bio.toLowerCase();
    
    requiredSkills.forEach(req => {
        const reqLower = req.toLowerCase();
        const category = findCategory(reqLower);
        
        // Exact or category match in bio
        if (bioLower.includes(reqLower)) {
            ontologyMatchCount += 1.0;
        } else if (category && bioLower.split(/\W+/).some(word => findCategory(word) === category)) {
            ontologyMatchCount += 0.5;
        }
    });
    
    const ontologyBonus = requiredSkills.length > 0 ? (ontologyMatchCount / requiredSkills.length) : 0;
    
    // 3. Profile Maturity Factor
    const maturityFactor = Math.min(bio.length, 600) / 600; 
    
    return Math.min((baseSimilarity * 0.4) + (ontologyBonus * 0.4) + (maturityFactor * 0.2), 1.0);
};

/**
 * Calculates Post-Based Work Evidence & Experience Score (Weight: 0.2)
 */
const getPostRelevanceScore = (posts, requiredSkills) => {
    if (!posts || posts.length === 0) return 0;
    
    let totalOntologyScore = 0;
    const requiredSkillsLower = requiredSkills.map(s => s.toLowerCase());

    posts.forEach(post => {
        const postContent = `${post.title || ''} ${post.content || ''}`.toLowerCase();
        
        requiredSkillsLower.forEach(req => {
            const category = findCategory(req);
            if (postContent.includes(req)) {
                totalOntologyScore += 1.0;
            } else if (category && postContent.split(/\W+/).some(word => findCategory(word) === category)) {
                totalOntologyScore += 0.4;
            }
        });
    });

    // Evidence Depth & Experience (Post Volume)
    // Preference for users who have more posts (experience)
    const experienceFactor = Math.min(posts.length / 10, 1.0); // Reward up to 10 posts
    const accuracyFactor = requiredSkills.length > 0 ? Math.min(totalOntologyScore / (requiredSkills.length * 2), 1.0) : 0.5;
    
    return (accuracyFactor * 0.7) + (experienceFactor * 0.3);
};

/**
 * Calculates Availability/Workload Score (Weight: 0.2)
 * Preference for users with less numbers of pending tickets.
 */
const getAvailabilityScore = (pendingTicketCount) => {
    // 0 tickets = 1.0, 5 tickets = 0.5, 10+ tickets = 0
    const score = Math.max(0, 1 - (pendingTicketCount / 10));
    return score;
};

/**
 * Main function to calculate the combined match score
 * 
 * @param {Object} userProfile - { _id, firstName, lastName, skills: [], bio: "", posts: [] }
 * @param {Object} taskData - { requiredSkills: [], description: "", pendingTicketCount: 0 }
 */
const calculateMatchScore = (userProfile, taskData) => {
    const requiredSkills = taskData.requiredSkills || [];
    const taskDescription = taskData.description || "";
    const pendingTicketCount = taskData.pendingTicketCount || 0;
    
    const userSkills = userProfile.skills || [];
    const userBio = userProfile.bio || "";
    const userPosts = userProfile.posts || [];

    // 1. Direct Skills Ontology Score (0.4)
    const ontologyScore = getOntologyMatch(requiredSkills, userSkills);

    // 2. Bio Semantic & Ontology Score (0.2)
    const bioScore = getBioSemanticScore(userBio, requiredSkills, taskDescription);

    // 3. Post Evidence & Experience Score (0.2)
    const postScore = getPostRelevanceScore(userPosts, requiredSkills);

    // 4. Availability Score (0.2)
    const availabilityScore = getAvailabilityScore(pendingTicketCount);

    // Combine Weighted Scores
    let finalScore = 
        (0.4 * ontologyScore) + 
        (0.2 * bioScore) + 
        (0.2 * postScore) + 
        (0.2 * availabilityScore);
    
    // Normalize and cap
    finalScore = Math.min(parseFloat(finalScore.toFixed(4)), 1.0);

    return {
        userId: userProfile._id,
        name: `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim(),
        avatar: userProfile.avatar,
        matchScore: finalScore,
        ontologyScore: parseFloat(ontologyScore.toFixed(4)),
        bioScore: parseFloat(bioScore.toFixed(4)),
        postScore: parseFloat(postScore.toFixed(4)),
        availabilityScore: parseFloat(availabilityScore.toFixed(4)),
        pendingTickets: pendingTicketCount,
        skills: userSkills.slice(0, 5)
    };
};

module.exports = {
    calculateMatchScore,
    getOntologyMatch,
    getBioSemanticScore,
    getPostRelevanceScore
};
