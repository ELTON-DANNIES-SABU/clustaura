const axios = require('axios');
require('dotenv').config();

async function test() {
    const key = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;

    console.log("Testing Gemini API via AXIOS...");

    try {
        const response = await axios.post(url, {
            contents: [{
                parts: [{ text: "SUCCESS" }]
            }]
        });

        console.log("Response Status:", response.status);
        console.log("Response Data:", JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error("Axios Error Status:", error.response?.status);
        console.error("Axios Error Data:", JSON.stringify(error.response?.data, null, 2));
    }
}

test();
