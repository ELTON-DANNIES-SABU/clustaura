const { improviseProject } = require('./agents/requirementAgent');
require('dotenv').config();

async function testImprovisation() {
    const title = "Headless CMS AI Plugin";
    const existingPlan = {
        modules: [
            { name: "Content ingestion", description: "Handles foundatonal CMS plugin architecture" },
            { name: "LLM & AI Engine", description: "Logic for LLM interaction and categorization" }
        ],
        tickets: [
            { title: "Setup Vector DB", description: "Integrate Pinecone", moduleName: "LLM & AI Engine" },
            { title: "API Design", description: "REST API for content", moduleName: "Content ingestion" }
        ],
        sprints: [
            { name: "Sprint 1", ticketTitles: ["API Design", "Setup Vector DB"] }
        ]
    };
    const query = "i need a chatbot to guide through the project";

    console.log("Starting realistic test improvisation...");
    try {
        const result = await improviseProject(title, existingPlan, query);
        console.log("Improvisation Result (Modules):", result.modules.map(m => m.name));
    } catch (error) {
        console.error("Test Failed:", error.message);
    }
}

testImprovisation();
