const axios = require("axios");
require('dotenv').config();

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_API_KEY = process.env.GROK_API_KEY; // Using the provided gsk_ key

/**
 * Analyzes project requirements using Groq AI API.
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

/**
 * Generic helper to call Groq with retries
 */
const callGroq = async (prompt, retries = 2) => {
    console.log(`Calling Groq (Retries: ${retries})...`);

    try {
        const response = await axios.post(
            GROQ_API_URL,
            {
                model: "llama-3.3-70b-versatile",
                messages: [
                    { 
                        role: "system", 
                        content: "You are an expert SDLC Architect. You MUST return ONLY valid JSON that matches the requested schema precisely. No conversational text." 
                    },
                    { role: "user", content: prompt }
                ],
                temperature: 0.1,
                stream: false,
                response_format: { type: "json_object" }
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${GROQ_API_KEY}`
                }
            }
        );

        const text = response.data.choices[0].message.content;
        
        // Find JSON block
        const jsonStartIndex = text.indexOf('{');
        const jsonEndIndex = text.lastIndexOf('}');
        
        if (jsonStartIndex === -1 || jsonEndIndex === -1) {
            throw new Error("Invalid JSON structure returned by AI");
        }

        const cleanedJson = text.substring(jsonStartIndex, jsonEndIndex + 1);
        return JSON.parse(cleanedJson);

    } catch (error) {
        const status = error.response?.status;
        console.error(`Groq Error:`, error.response?.data || error.message);

        // Handle Rate Limits (429)
        if (status === 429 && retries > 0) {
            const waitTime = (3 - retries) * 2000;
            console.warn(`Quota Exceeded (429). Retrying in ${waitTime}ms...`);
            await delay(waitTime);
            return callGroq(prompt, retries - 1);
        }

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
        const plan = await callGroq(prompt);
        return sanitizePlan(plan);
    } catch (error) {
        console.error("Analyze Project Failure:", error.message);
        throw new Error("Groq AI Generation failed: " + error.message);
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
        const plan = await callGroq(prompt);
        return sanitizePlan(plan);
    } catch (error) {
        console.error("Improvise Project Failure:", error.message);
        throw new Error("Groq AI Refinement failed: " + error.message);
    }
};

module.exports = { analyzeProject, improviseProject };
