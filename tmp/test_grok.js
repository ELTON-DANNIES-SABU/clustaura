const axios = require('axios');
require('dotenv').config({ path: 'c:/Users/risho/OneDrive/Desktop/clustaura_new/clustaura/server/.env' });

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_API_KEY = process.env.GROK_API_KEY;

async function testGroqProjectAnalysis() {
    console.log("Testing Groq Project Analysis...");
    const prompt = `You are an expert SDLC Architect. Analyze the project "E-commerce App".
    Description: A platform for selling electronics with user reviews and payment integration.
    Today: 2026-04-04
    
    Return STRICT JSON:
    1. projectTimeline: { startDate, endDate }
    2. modules: Array of { name, description }
    3. tickets: Array of { title, description, moduleName, priority, type, effort, skillsRequired, startDate, endDate }
    4. sprints: Array of { name, ticketTitles, startDate, endDate }
    5. recommendedTechnologies: Array of Strings
    
    Return ONLY JSON.`;

    try {
        const response = await axios.post(
            GROQ_API_URL,
            {
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: "You are an expert SDLC Architect. Return ONLY valid JSON." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.1
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${GROQ_API_KEY}`
                }
            }
        );

        console.log("Response Status:", response.status);
        const content = response.data.choices[0].message.content;
        console.log("Raw Content Preview:", content.substring(0, 100));
        
        const json = JSON.parse(content.replace(/```json|```/g, "").trim());
        console.log("Success: Parsed JSON for Project Analysis.");
        console.log("Modules found:", json.modules.length);
    } catch (error) {
        console.error("Test Failed:", error.response?.data || error.message);
    }
}

async function testGroqQuestionGeneration() {
    console.log("\nTesting Groq Question Generation...");
    const requirements = [{ category: "Javascript", difficulty: "Easy", count: 1 }];
    const prompt = `Generate assessment questions for a technical platform called Clustaura.
    Requirements: ${JSON.stringify(requirements)}
    
    Return the result as a STRICT JSON array of question objects with the following schema:
    {
        "title": "String",
        "description": "Markdown",
        "type": "MCQ" | "Coding",
        "difficulty": "Easy",
        "category": "Javascript",
        "marks": 5
    }
    Return ONLY JSON.`;

    try {
        const response = await axios.post(
            GROQ_API_URL,
            {
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: "You are a technical assessment architect. Return ONLY valid JSON." },
                    { role: "user", content: prompt }
                ],
                temperature: 0
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${GROQ_API_KEY}`
                }
            }
        );

        const content = response.data.choices[0].message.content;
        const json = JSON.parse(content.replace(/```json|```/g, "").trim());
        console.log("Success: Parsed JSON for Question Generation.");
        console.log("Question Title:", json[0].title);
    } catch (error) {
        console.error("Test Failed:", error.response?.data || error.message);
    }
}

async function runTests() {
    if (!GROQ_API_KEY) {
        console.error("GROK_API_KEY not found in .env");
        return;
    }
    await testGroqProjectAnalysis();
    await testGroqQuestionGeneration();
}

runTests();
