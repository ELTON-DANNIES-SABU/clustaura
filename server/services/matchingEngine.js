/**
 * Hybrid Semantic-Vector Skill Matching (HSVSM) Engine
 * Centralized service for recommending users across Workspace and Community.
 */

// Basic Ontology mapping for semantic similarity expansion
const ONTOLOGY = {
    'react': ['javascript', 'frontend', 'ui', 'typescript', 'reactjs', 'jsx'],
    'node.js': ['javascript', 'backend', 'nodejs', 'express', 'server'],
    'python': ['backend', 'data', 'ml', 'ai', 'django', 'flask', 'fastapi'],
    'go': ['golang', 'backend', 'systems', 'microservices'],
    'java': ['backend', 'enterprise', 'spring', 'springboot'],
    'mongodb': ['database', 'nosql', 'mongoose', 'db'],
    'postgresql': ['database', 'sql', 'postgres', 'db', 'rdbms'],
    'aws': ['cloud', 'infrastructure', 'devops', 'deployment'],
    'docker': ['devops', 'container', 'deployment', 'kubernetes'],
    'kubernetes': ['devops', 'container', 'orchestration', 'k8s'],
    'vue': ['javascript', 'frontend', 'ui', 'vuejs'],
    'angular': ['javascript', 'frontend', 'ui', 'typescript'],
};

/**
 * Normalizes text for comparison (lowercase, alphanumeric only, trimmed)
 */
const normalizeToken = (token) => token.toLowerCase().replace(/[^a-z0-9]/g, '').trim();

/**
 * Creates a term frequency vector for a given text
 */
const vectorizeText = (text) => {
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
const computeCosineSimilarity = (userText, taskText) => {
    const userVec = vectorizeText(userText);
    const taskVec = vectorizeText(taskText);

    const allTokens = new Set([...Object.keys(userVec), ...Object.keys(taskVec)]);
    
    let dotProduct = 0;
    let normUser = 0;
    let normTask = 0;

    for (const token of allTokens) {
        const u = userVec[token] || 0;
        const t = taskVec[token] || 0;
        dotProduct += u * t;
        normUser += u * u;
        normTask += t * t;
    }

    if (normUser === 0 || normTask === 0) return 0;
    return dotProduct / (Math.sqrt(normUser) * Math.sqrt(normTask));
};

/**
 * Expands a skill using the predefined ontology
 */
const expandSkill = (skill) => {
    const normalized = skill.toLowerCase();
    const expanded = new Set([normalized]);
    
    // Exact or partial ontology matches
    for (const [key, related] of Object.entries(ONTOLOGY)) {
        if (key.includes(normalized) || normalized.includes(key)) {
            expanded.add(key);
            related.forEach(r => expanded.add(r));
        }
    }
    
    return Array.from(expanded);
};

const computeSemanticSimilarity = (userSkills, taskSkills) => {
    if (!taskSkills || taskSkills.length === 0) return 0.5; // neutral if no skills required
    if (!userSkills || userSkills.length === 0) return 0.0;
    
    let totalScore = 0;

    taskSkills.forEach(reqSkill => {
        const reqLower = reqSkill.toLowerCase();
        const expandedReq = expandSkill(reqSkill);
        
        let bestMatchForReq = 0;
        
        userSkills.forEach(us => {
            const usLower = us.toLowerCase();
            const expandedUs = expandSkill(us);
            
            // 1. Exact Match
            if (reqLower === usLower) {
                bestMatchForReq = Math.max(bestMatchForReq, 1.0);
            } 
            // 2. Substring Match (e.g., 'React' and 'React.js')
            else if (reqLower.includes(usLower) || usLower.includes(reqLower)) {
                bestMatchForReq = Math.max(bestMatchForReq, 0.9);
            } 
            // 3. Ontology Match via Jaccard Similarity
            else {
                const intersection = expandedReq.filter(x => expandedUs.includes(x));
                const unionSize = new Set([...expandedReq, ...expandedUs]).size;
                
                const jaccard = intersection.length / unionSize;
                
                // Scale up Jaccard to give realistic partial credit
                // e.g., React & Vue share [javascript, frontend, ui] -> Jaccard ~0.33 -> Score ~0.82
                // e.g., React & Node share [javascript] -> Jaccard ~0.08 -> Score ~0.20
                bestMatchForReq = Math.max(bestMatchForReq, Math.min(jaccard * 2.5, 0.85));
            }
        });
        
        totalScore += bestMatchForReq;
    });

    return totalScore / taskSkills.length;
};

/**
 * Core function to evaluate match score between a user profile and task/context
 * 
 * @param {Object} userProfile - { _id, firstName, lastName, skills: [], bio: "", posts: [{title, content}] }
 * @param {Object} taskData - { requiredSkills: [], description: "", topic: "", title: "" }
 * @returns {Object} result - Contains match scores
 */
const calculateMatchScore = (userProfile, taskData) => {
    // 1. Prepare Text Data
    const postsText = (userProfile.posts || []).map(p => `${p.title || ''} ${p.content || ''}`).join(' ');
    const userText = `${(userProfile.skills || []).join(' ')} ${userProfile.bio || ''} ${postsText}`.trim();
    
    const taskTags = taskData.tags || [];
    const taskSkills = taskData.requiredSkills || taskTags; // standardized input handling
    
    const taskText = `${taskSkills.join(' ')} ${taskData.topic || taskData.title || ''} ${taskData.description || ''}`.trim();

    // 2. Compute Cosine Similarity (Vector)
    const cosineScore = computeCosineSimilarity(userText, taskText);

    // 3. Compute Semantic Similarity (Skills/Tags Ontology)
    const semanticScore = computeSemanticSimilarity(userProfile.skills || [], taskSkills);

    // 4. Combine Scores
    // finalScore = 0.6 * semanticSimilarity + 0.4 * cosineSimilarity
    const matchScore = (0.6 * semanticScore) + (0.4 * cosineScore);
    
    return {
        userId: userProfile._id || userProfile.user?._id || userProfile.user,
        name: `${userProfile.firstName || userProfile.user?.firstName || ''} ${userProfile.lastName || userProfile.user?.lastName || ''}`.trim(),
        avatar: userProfile.avatar || userProfile.user?.avatar,
        matchScore: parseFloat(matchScore.toFixed(4)),
        semanticScore: parseFloat(semanticScore.toFixed(4)),
        cosineScore: parseFloat(cosineScore.toFixed(4)),
        skills: userProfile.skills || []
    };
};

module.exports = {
    calculateMatchScore,
    computeCosineSimilarity,
    computeSemanticSimilarity,
    expandSkill
};
