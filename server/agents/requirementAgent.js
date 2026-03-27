const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Analyzes project requirements using Gemini API.
 * @param {string} title - Project Title
 * @param {string} description - Project Description
 * @returns {Object} { modules, tickets, sprints, recommendedTechnologies }
 */

const sanitizePlan = (plan) => {
    if (!plan) return plan;
    
    // Valid enums based on Ticket.js
    const validPriorities = ['highest', 'high', 'medium', 'low', 'lowest'];
    const validTypeMap = {
        'task': 'task',
        'story': 'story',
        'bug': 'bug',
        'feature': 'story',
        'improvement': 'task'
    };

    if (Array.isArray(plan.tickets)) {
        plan.tickets = plan.tickets.map(ticket => {
            // 1. Sanitize Effort (must be Number)
            let effort = ticket.effort;
            if (typeof effort === 'string') {
                const digitMatch = effort.match(/\d+/);
                effort = digitMatch ? parseInt(digitMatch[0]) : 1; // Default to 1 if no digits found
            }
            if (isNaN(effort)) effort = 1;

            // 2. Sanitize Priority (strict enum)
            let priority = (ticket.priority || 'medium').toLowerCase();
            if (!validPriorities.includes(priority)) {
                priority = 'medium';
            }

            // 3. Sanitize Type (strict enum)
            let type = (ticket.type || 'task').toLowerCase();
            type = validTypeMap[type] || 'task';

            return {
                ...ticket,
                effort,
                priority,
                type
            };
        });
    }

    return plan;
};

const delay = (ms) => new Promise(res => setTimeout(res, ms));

const MODELS = ["gemini-2.0-flash", "gemini-flash-latest", "gemini-pro-latest"];

/**
 * Generic helper to call Gemini with retries and model fallback
 */
const callGemini = async (prompt, modelIndex = 0, retries = 2) => {
    const modelName = MODELS[modelIndex] || MODELS[0];
    console.log(`Calling Gemini [${modelName}] (Retries: ${retries})...`);

    try {
        const model = genAI.getGenerativeModel({ 
            model: modelName,
            generationConfig: {
                maxOutputTokens: 8192,
                responseMimeType: "application/json"
            }
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Find JSON block
        const jsonStartIndex = text.indexOf('{');
        const jsonEndIndex = text.lastIndexOf('}');
        
        if (jsonStartIndex === -1 || jsonEndIndex === -1) {
            throw new Error("Invalid JSON structure returned by AI");
        }

        const cleanedJson = text.substring(jsonStartIndex, jsonEndIndex + 1);
        return JSON.parse(cleanedJson);

    } catch (error) {
        // Handle Rate Limits (429)
        if (error.status === 429) {
            if (retries > 0) {
                const waitTime = (3 - retries) * 2000;
                console.warn(`Quota Exceeded (429) for ${modelName}. Retrying in ${waitTime}ms...`);
                await delay(waitTime);
                return callGemini(prompt, modelIndex, retries - 1);
            } else if (modelIndex < MODELS.length - 1) {
                console.log(`Switching from ${modelName} to fallback model: ${MODELS[modelIndex + 1]}`);
                return callGemini(prompt, modelIndex + 1, 2);
            }
        }

        console.error(`Gemini Error [${modelName}]:`, error.message);
        throw error;
    }
};

const analyzeProject = async (title, description) => {
    const currentDate = new Date().toISOString().split('T')[0];
    const prompt = `You are an expert SDLC Architect. Analyze the project "${title}".
    Description: ${description}
    Today: ${currentDate}
    
    Return STRICT JSON:
    1. projectTimeline: { startDate, endDate }
    2. modules: Array of { name, description }
    3. tickets: Array of { title, description, moduleName, priority, type, effort, skillsRequired, startDate, endDate }
    4. sprints: Array of { name, ticketTitles, startDate, endDate }
    5. recommendedTechnologies: Array of Strings
    
    Constraints:
    - Start: ${currentDate}.
    - Priority: highest|high|medium|low|lowest. Type: task|story|bug. 
    - Effort: Story points (1,2,3,5,8).
    - ensure realistic sequential dates based on dependencies (DB -> API -> UI).
    
    Return ONLY JSON.`;

    try {
        const plan = await callGemini(prompt);
        return sanitizePlan(plan);
    } catch (error) {
        throw new Error("AI Generation failed. All models are currently at capacity. Please try again in 1 minute.");
    }
};

const improviseProject = async (title, existingPlan, improvisationQuery) => {
    const currentDate = new Date().toISOString().split('T')[0];
    const prompt = `You are an expert SDLC Architect. Refine project "${title}".
    
    EXISTING: ${JSON.stringify(existingPlan)}
    NEW REQS: "${improvisationQuery}"
    Today: ${currentDate}
    
    TASK: Expand plan. Add/update modules and tickets. Ensure realistic sequential dates.
    
    Return UPDATED plan in STRICT JSON (same schema as analyze).
    Return ONLY JSON.`;

    try {
        const plan = await callGemini(prompt);
        return sanitizePlan(plan);
    } catch (error) {
        throw new Error("AI Refinement failed. All models are currently at capacity. Please try again in 1 minute.");
    }
};

module.exports = { analyzeProject, improviseProject };
