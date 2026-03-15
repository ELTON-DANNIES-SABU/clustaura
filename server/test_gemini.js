const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function test() {
    console.log("Testing Gemini API with key:", process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 10) + "..." : "MISSING");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Hello, respond with 'SUCCESS'");
        console.log("Response:", result.response.text());
    } catch (error) {
        console.error("API Test Error:", error);
    }
}

listModels();
