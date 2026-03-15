const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function test() {
    console.log("Starting verbose test...");
    let logOutput = "";
    const log = (msg) => {
        console.log(msg);
        logOutput += msg + "\n";
    };

    log("Testing Gemini API with key: " + (process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 10) + "..." : "MISSING"));

    try {
        const modelName = "gemini-1.0-pro"; // Trying older stable name
        log("Model: " + modelName);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello, respond with 'SUCCESS'");
        log("Response: " + result.response.text());
    } catch (error) {
        log("API Test Error Name: " + error.name);
        log("API Test Error Message: " + error.message);
        if (error.stack) log("Stack: " + error.stack);
        if (error.response) {
            log("Response Status: " + error.response.status);
            log("Response Data: " + JSON.stringify(error.response.data));
        }
    }

    fs.writeFileSync('gemini_test_log.txt', logOutput);
    console.log("Logged results to gemini_test_log.txt");
}

test();
