require('dotenv').config({ path: 'c:/Users/risho/OneDrive/Desktop/clustaura_new/clustaura/server/.env' });
const requirementAgent = require('./server/agents/requirementAgent');

async function debugImprovise() {
    const title = "Nexus-Auth";
    const existingPlan = {
        modules: [
            { name: "Chatbot API", description: "API for chatbots" }
        ],
        tickets: [
            { title: "Setup API", description: "Initial setup", moduleName: "Chatbot API" }
        ],
        sprints: [
            { name: "Sprint 1", ticketTitles: ["Setup API"] }
        ]
    };
    const query = "prepare a ai chatbot guide";

    try {
        console.log("Starting debug improvisation...");
        const result = await requirementAgent.improviseProject(title, existingPlan, query);
        console.log("Success! Result:", JSON.stringify(result, null, 2));
    } catch (error) {
        console.error("Debug Failed:", error.message);
    }
}

debugImprovise();
