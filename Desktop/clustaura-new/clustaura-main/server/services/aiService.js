const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AIzaSy..."); // Placeholder or from env

/**
 * Generates questions using AI based on requirements
 * @param {Array} requirements [{ category, difficulty, count }]
 * @returns {Array} List of generated question objects
 */
exports.generateQuestionsAI = async (requirements) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `Generate assessment questions for a technical platform called Clustaura.
        Requirements: ${JSON.stringify(requirements)}
        
        Return the result as a STRICT JSON array of question objects with the following schema:
        {
            "title": "Short title",
            "description": "Full question text",
            "type": "MCQ",
            "difficulty": "Easy" | "Intermediate" | "Hard",
            "category": "String",
            "marks": Number,
            "options": [
                { "text": "Option 1", "isCorrect": true },
                { "text": "Option 2", "isCorrect": false }
            ]
        }
        
        Ensure there are exactly the requested number of questions for each category.
        Do not include any text before or after the JSON.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Basic cleaning to handle potential markdown wrappers
        const cleanedJson = text.replace(/```json|```/g, "").trim();
        return JSON.parse(cleanedJson);
    } catch (error) {
        console.error("AI Generation Error:", error);
        throw new Error("Failed to generate questions via AI: " + error.message);
    }
};
