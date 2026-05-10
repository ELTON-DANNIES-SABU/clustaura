const mongoose = require('mongoose');
const Profile = require('../models/Profile');
const Post = require('../models/Post');
const axios = require('axios');
require('dotenv').config();

// Global variable to store the model pipeline
let extractor = null;

/**
 * Loads the SBERT model lazily
 */
const getExtractor = async () => {
    if (!extractor) {
        // Dynamic import if needed, but Xenova v2 supports require
        const { pipeline } = await import('@xenova/transformers');
        extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }
    return extractor;
};

/**
 * Generates an embedding for a given text
 * @param {String} text 
 * @returns {Array} Vector of numbers
 */
const generateEmbedding = async (text) => {
    try {
        if (!text || text.trim().length === 0) return [];
        
        const pipe = await getExtractor();
        const output = await pipe(text, { pooling: 'mean', normalize: true });
        return Array.from(output.data);
    } catch (error) {
        console.error('[AI Matching] Embedding Generation Error:', error.message);
        return [];
    }
};

/**
 * Computes Cosine Similarity between two vectors
 */
const cosineSimilarity = (vecA, vecB) => {
    if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    
    const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    return isNaN(similarity) ? 0 : similarity;
};

/**
 * Combines profile data into a single searchable text string
 */
const getCombinedText = async (profile) => {
    const skillsText = profile.skills ? profile.skills.join(', ') : '';
    const bioText = profile.bio || '';
    
    // Fetch last 5 posts for deeper semantic context
    const latestPosts = await Post.find({ author: profile.user })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title content');
        
    const postsText = latestPosts.map(p => `${p.title} ${p.content}`).join(' ');
    
    return `Skills: ${skillsText}. Bio: ${bioText}. Recent Work: ${postsText}`.trim();
};

/**
 * Updates a user's embedding in the database
 */
const updateUserEmbedding = async (userId) => {
    try {
        const profile = await Profile.findOne({ user: userId });
        if (!profile) return null;
        
        const text = await getCombinedText(profile);
        const embedding = await generateEmbedding(text);
        
        if (embedding.length > 0) {
            profile.embedding = embedding;
            profile.lastEmbeddedAt = new Date();
            await profile.save();
            console.log(`[AI Matching] Embedded user: ${userId}`);
        }
        
        return embedding;
    } catch (error) {
        console.error(`[AI Matching] Update Failed for ${userId}:`, error.message);
        return null;
    }
};

/**
 * Recommends top matching users for a given target user
 */
const recommendUsers = async (targetUserId, topN = 5) => {
    try {
        const targetProfile = await Profile.findOne({ user: targetUserId });
        if (!targetProfile || !targetProfile.embedding || targetProfile.embedding.length === 0) {
            // Try to generate on the fly if missing
            await updateUserEmbedding(targetUserId);
            return recommendUsers(targetUserId, topN); // Recurse once
        }
        
        const targetVector = targetProfile.embedding;
        
        // Find all other profiles with embeddings
        const candidates = await Profile.find({ 
            user: { $ne: targetUserId },
            embedding: { $exists: true, $not: { $size: 0 } }
        }).populate('user', 'firstName lastName avatar role');
        
        const matches = candidates.map(cand => {
            const similarity = cosineSimilarity(targetVector, cand.embedding);
            return {
                userId: cand.user._id,
                name: `${cand.user.firstName} ${cand.user.lastName}`,
                role: cand.user.role,
                avatar: cand.user.avatar,
                skills: cand.skills,
                bio: cand.bio,
                similarityScore: parseFloat(similarity.toFixed(4))
            };
        });
        
        // Sort by similarity descending
        return matches.sort((a, b) => b.similarityScore - a.similarityScore).slice(0, topN);
    } catch (error) {
        console.error('[AI Matching] Recommendation Error:', error.message);
        return [];
    }
};

/**
 * Uses Groq to explain why two users are a good match
 */
const explainMatch = async (userA, userB) => {
    const GROQ_API_KEY = process.env.GROK_API_KEY;
    if (!GROQ_API_KEY) return "Semantic similarity based on shared skills and industry focus.";
    
    try {
        const prompt = `Explain why these two professionals are a great semantic match in one short sentence (max 20 words).
        
        Person 1: ${userA.name} - Skills: ${userA.skills.join(', ')}. Bio: ${userA.bio}.
        Person 2: ${userB.name} - Skills: ${userB.skills.join(', ')}. Bio: ${userB.bio}.
        
        Return ONLY the sentence.`;
        
        const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.5
        }, {
            headers: { "Authorization": `Bearer ${GROQ_API_KEY}` }
        });
        
        return response.data.choices[0].message.content.trim();
    } catch (error) {
        return "Matched based on cross-functional technical expertise and profile alignment.";
    }
};

/**
 * Calculates a detailed hybrid match score for a specific requirement
 * @param {Object} userProfile - { _id, firstName, lastName, skills: [], bio: "", posts: [] }
 * @param {Object} taskData - { requiredSkills: [], description: "", pendingTicketCount: 0 }
 * @param {Array} requirementEmbedding - (Optional) Pre-computed embedding for the task description
 */
const calculateAIMatchScore = async (userProfile, taskData, requirementEmbedding = null) => {
    const { requiredSkills = [], description = "", pendingTicketCount = 0 } = taskData;
    const { skillOntology, findCategory } = require('../utils/skillOntology');

    // 1. Ontology/Keyword Skill Match (Weight: 0.4)
    let ontologyScore = 0;
    if (requiredSkills.length > 0) {
        const userSkillsLower = (userProfile.skills || []).map(s => s.toLowerCase());
        let totalSkillScore = 0;

        requiredSkills.forEach(req => {
            const reqLower = req.toLowerCase();
            if (userSkillsLower.includes(reqLower)) {
                totalSkillScore += 1.0;
            } else {
                const category = findCategory(reqLower);
                if (category && userSkillsLower.some(us => findCategory(us) === category)) {
                    totalSkillScore += 0.6;
                } else if (userSkillsLower.some(us => us.includes(reqLower) || reqLower.includes(us))) {
                    totalSkillScore += 0.3;
                }
            }
        });
        ontologyScore = totalSkillScore / requiredSkills.length;
    } else {
        ontologyScore = 1.0;
    }

    // 2. Semantic Bio/Post Match (Weight: 0.4)
    let bioSemanticScore = 0;
    try {
        const profile = await Profile.findOne({ user: userProfile._id });
        let userVector = profile?.embedding;

        // Lazy generation if missing
        if (!userVector || userVector.length === 0) {
            userVector = await updateUserEmbedding(userProfile._id);
        }

        if (userVector && userVector.length > 0) {
            // Use pre-computed req vector or generate now
            const taskVector = requirementEmbedding || await generateEmbedding(description);
            bioSemanticScore = cosineSimilarity(userVector, taskVector);
        }
    } catch (err) {
        console.error('[AI Matching] Semantic Calculation Error:', err.message);
    }

    // 3. Availability Score (Weight: 0.2)
    const availabilityScore = Math.max(0, 1 - (pendingTicketCount / 10));

    // Combine Weighted Scores
    const finalScore = (0.4 * ontologyScore) + (0.4 * bioSemanticScore) + (0.2 * availabilityScore);

    return {
        userId: userProfile._id,
        name: `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim(),
        matchScore: parseFloat(Math.min(finalScore, 1.0).toFixed(4)),
        ontologyScore: parseFloat(ontologyScore.toFixed(4)),
        bioScore: parseFloat(bioSemanticScore.toFixed(4)),
        postScore: parseFloat(bioSemanticScore.toFixed(4)), // Aliased for UI compatibility
        availabilityScore: parseFloat(availabilityScore.toFixed(4)),
        pendingTickets: pendingTicketCount,
        skills: (userProfile.skills || []).slice(0, 5)
    };
};

module.exports = {
    generateEmbedding,
    updateUserEmbedding,
    recommendUsers,
    explainMatch,
    cosineSimilarity,
    calculateAIMatchScore
};
