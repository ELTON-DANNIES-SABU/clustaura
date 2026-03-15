const { GoogleGenerativeAI } = require("@google/generative-ai");
const mongoose = require('mongoose');
require('dotenv').config();

// Mocking models to avoid DB connection for now, or just test the logic
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function debugAnalysis() {
    console.log("Starting debug analysis...");
    const title = "Fintech Dashboard";
    const description = "Build a web-based fintech dashboard that allows users to connect their bank accounts, track spending across categories, and receive AI-driven investment advice.";

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
        
        Return ONLY the JSON object. No markdown, no explanation.`;

        console.log("Calling Gemini...");
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        console.log("RAW response length:", text.length);
        
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const cleanedJson = jsonMatch ? jsonMatch[0] : text;
        const plan = JSON.parse(cleanedJson);
        console.log("Plan parsed successfully!");
        console.log("Modules count:", plan.modules.length);
        console.log("Tickets count:", plan.tickets.length);
        console.log("Sprints count:", plan.sprints.length);
        
        // Test logic in agentController
        const createdModules = plan.modules.map(m => ({ moduleName: m.name, description: m.description }));
        
        const sprintShells = plan.sprints.map(s => ({
            name: s.name,
            status: 'future'
        }));

        const ticketsToInsert = plan.tickets.map(t => {
            const module = createdModules.find(m =>
                m.moduleName.toLowerCase() === (t.moduleName || '').toLowerCase()
            );

            const sprint = sprintShells.find(s => {
                const sprintDef = plan.sprints.find(sd => sd.name === s.name);
                return sprintDef && Array.isArray(sprintDef.ticketTitles) && sprintDef.ticketTitles.includes(t.title);
            });

            return {
                title: t.title,
                module: module ? module.moduleName : null,
                sprint: sprint ? sprint.name : null
            };
        });

        console.log("Ticket mapping test passed!");
        console.log("Sample mapped ticket:", ticketsToInsert[0]);

    } catch (error) {
        console.error("DEBUG ERROR:", error);
    }
}

debugAnalysis();
