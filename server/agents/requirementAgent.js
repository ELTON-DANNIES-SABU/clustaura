const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Analyzes project requirements using Gemini API.
 * @param {string} title - Project Title
 * @param {string} description - Project Description
 * @returns {Object} { modules, tickets, sprints, recommendedTechnologies }
 */
const analyzeProject = async (title, description) => {
    console.log("Analyzing project with Gemini...");
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.error("CRITICAL: GEMINI_API_KEY is missing in process.env!");
    } else {
        console.log(`Using API Key starting with: ${key.substring(0, 8)}...`);
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `You are an expert SDLC Architect. Analyze the following project and generate a structured development plan.
        
        Project Title: ${title}
        Project Description: ${description}
        
        Generate the following in STRICT JSON format:
        1. modules: Array of { name, description }
        2. tickets: Array of { title, description, moduleName, priority, type, effort, skillsRequired }
        3. sprints: Array of { name, ticketTitles }
        4. recommendedTechnologies: Array of Strings
        
        Constraints:
        - effort should be story points (1, 2, 3, 5, 8).
        - priority should be 'highest', 'high', 'medium', 'low', or 'lowest'.
        - type should be 'task', 'story', or 'bug'.
        - skillsRequired should be specific technical skills (e.g., 'React', 'Node.js', 'Socket.io').
        - tickets should be linked to moduleName.
        - Group tickets into logical sprints.
        
        Return ONLY the JSON object. No markdown, no explanation.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        console.log("RAW Gemini Response:", text);

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const cleanedJson = jsonMatch ? jsonMatch[0] : text;
        return JSON.parse(cleanedJson);
    } catch (error) {
        console.error("Requirement Agent Error:", error);
        throw new Error("Failed to analyze project requirements: " + error.message);
    }
};

module.exports = { analyzeProject };
