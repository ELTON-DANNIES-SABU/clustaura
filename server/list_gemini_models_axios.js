const axios = require('axios');
require('dotenv').config();

async function listModels() {
    const key = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

    console.log("Listing available models via AXIOS...");

    try {
        const response = await axios.get(url);
        console.log("Available Models:");
        response.data.models.forEach(m => {
            console.log(`- ${m.name} (${m.displayName})`);
        });
    } catch (error) {
        console.error("Axios List Error Status:", error.response?.status);
        console.error("Axios List Error Data:", JSON.stringify(error.response?.data, null, 2));
    }
}

listModels();
