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

const analyzeProject = async (title, description) => {
    console.log("Analyzing project with Gemini...");
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.error("CRITICAL: GEMINI_API_KEY is missing in process.env!");
    } else {
        console.log(`Using API Key starting with: ${key.substring(0, 8)}...`);
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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
        console.log("RAW Gemini Response (length):", text.length);
        
        // Find JSON block more reliably
        let cleanedJson = "";
        
        // Strategy 1: Find largest block between { and }
        const jsonStartIndex = text.indexOf('{');
        const jsonEndIndex = text.lastIndexOf('}');
        
        if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
            cleanedJson = text.substring(jsonStartIndex, jsonEndIndex + 1);
        } else {
            cleanedJson = text;
        }

        try {
            // First pass
            let parsed = JSON.parse(cleanedJson);
            
            // Basic validation
            if (!parsed.modules || !Array.isArray(parsed.modules)) parsed.modules = [];
            if (!parsed.tickets || !Array.isArray(parsed.tickets)) parsed.tickets = [];
            if (!parsed.sprints || !Array.isArray(parsed.sprints)) parsed.sprints = [];
            
            console.log("Successfully parsed and validated Gemini response JSON");
            return sanitizePlan(parsed);
        } catch (parseError) {
            console.error("Primary JSON Parse Error. Attempting regex extraction...");
            
            // Strategy 2: Regex for markdown blocks
            const markdownMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (markdownMatch) {
                try {
                    return JSON.parse(markdownMatch[1]);
                } catch (e) {}
            }

            // Strategy 3: Regex for any {} structure
            const anyJsonMatch = text.match(/\{[\s\S]*\}/);
            if (anyJsonMatch) {
                try {
                    return JSON.parse(anyJsonMatch[0]);
                } catch (e) {}
            }
            
            throw new Error("Gemini returned invalid JSON structure: " + parseError.message);
        }
    } catch (error) {
        console.error("Requirement Agent Error:", error);
        throw new Error("Failed to analyze project requirements: " + error.message);
    }
};

/**
 * Improvises/Refines existing project plan based on new requirements.
 * @param {string} title - Project Title
 * @param {Object} existingPlan - The current SDLC plan (modules, tickets, etc.)
 * @param {string} improvisationQuery - New features/improvements requested
 * @returns {Object} Updated SDLC plan
 */
const improviseProject = async (title, existingPlan, improvisationQuery) => {
    console.log("Improvising project with Gemini. Query:", improvisationQuery);
    console.log("Existing Plan Stats: Modules:", existingPlan.modules?.length, "Tickets:", existingPlan.tickets?.length);
    
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `You are an expert SDLC Architect. You previously generated a development plan for the project: "${title}".
        
        EXISTING PLAN:
        ${JSON.stringify(existingPlan, null, 2)}
        
        NEW REQUIREMENTS/IMPROVEMENTS:
        "${improvisationQuery}"
        
        TASK:
        Modify and expand the EXISTING PLAN to incorporate the NEW REQUIREMENTS.
        - Add NEW modules if necessary.
        - Add NEW tickets to both existing and new modules.
        - Update existing modules/tickets if the new requirements fundamentally change them.
        - Ensure logical sprint grouping for any new tickets.
        - Update recommended technologies if new features require them.
        
        Generate the UPDATED plan in STRICT JSON format:
        1. modules: Array of { name, description }
        2. tickets: Array of { title, description, moduleName, priority, type, effort, skillsRequired }
        3. sprints: Array of { name, ticketTitles }
        4. recommendedTechnologies: Array of Strings
        
        Return ONLY the UPDATED JSON object. No markdown, no explanation.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Find JSON block more reliably
        let cleanedJson = text;
        const jsonStartIndex = text.indexOf('{');
        const jsonEndIndex = text.lastIndexOf('}');
        
        if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
            cleanedJson = text.substring(jsonStartIndex, jsonEndIndex + 1);
        }

        try {
            const sanitized = sanitizePlan(JSON.parse(cleanedJson));
            return sanitized;
        } catch (parseError) {
            console.error("JSON Parse Error during improvisation:", text.substring(0, 100));
            throw new Error("Gemini returned invalid JSON for improvisation");
        }
    } catch (error) {
        console.error("Improvisation Agent Error:", error);
        throw new Error("Failed to improvise project: " + error.message);
    }
};

module.exports = { analyzeProject, improviseProject };
