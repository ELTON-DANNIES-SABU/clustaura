const axios = require('axios');

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000';

/**
 * Service to bridge the Node.js backend with the Python AI Engine
 */
class RecommenderService {
    /**
     * Get expert recommendations for a specific problem statement
     * @param {Object} problemData - { problem_id, title, description, required_skills }
     */
    async getRecommendations(problemData) {
        try {
            const response = await axios.post(`${AI_ENGINE_URL}/recommend`, {
                problem_id: problemData.problem_id,
                title: problemData.title,
                description: problemData.description,
                required_skills: problemData.required_skills || [],
                candidate_ids: problemData.candidate_ids || null // Optional filter
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching recommendations from AI Engine:', error.message);
            return [];
        }
    }

    /**
     * Ingest or Update a user profile in the AI Engine's index
     * @param {Object} userData - { user_id, bio, skills, projects, posts }
     */
    async ingestUser(userData) {
        try {
            console.log('[RecommenderService] Ingesting user to AI engine:', {
                url: `${AI_ENGINE_URL}/ingest/user`,
                user_id: userData.user_id,
                skills: userData.skills,
                bio_length: userData.bio?.length || 0
            });

            const response = await axios.post(`${AI_ENGINE_URL}/ingest/user`, {
                user_id: userData.user_id,
                bio: userData.bio || '',
                skills: userData.skills || [],
                projects: userData.projects || [],
                posts: userData.posts || []
            });

            console.log('[RecommenderService] AI engine response:', response.data);
            return response.data;
        } catch (error) {
            console.error('[RecommenderService] Error ingesting user into AI Engine:', error.message);
            console.error('[RecommenderService] Error details:', error.response?.data || error);
            return null;
        }
    }
}

module.exports = new RecommenderService();
