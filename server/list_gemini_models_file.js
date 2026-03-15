const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

async function listModels() {
    const key = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

    try {
        const response = await axios.get(url);
        let output = "Available Models:\n";
        response.data.models.forEach(m => {
            output += `- ${m.name} (${m.displayName})\n`;
        });
        fs.writeFileSync('available_models.txt', output);
        console.log("Wrote models to available_models.txt");
    } catch (error) {
        console.error("Error:", error.message);
    }
}

listModels();
