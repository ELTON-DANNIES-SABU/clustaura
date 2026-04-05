const axios = require("axios");
require('dotenv').config();

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_API_KEY = process.env.GROK_API_KEY; // The user provided gsk_ key is actually for Groq

/**
 * Generates questions using Groq AI based on requirements
 * @param {Array} requirements [{ category, difficulty, count }]
 * @returns {Array} List of generated question objects
 */
exports.generateQuestionsAI = async (requirements) => {
    try {
        const prompt = `Generate assessment questions for a technical platform called Clustaura.
        Requirements: ${JSON.stringify(requirements)}
        
        Return the result as a STRICT JSON array of question objects with the following schema:
        {
            "title": "String",
            "description": "Full markdown-formatted description following LeetCode style: 
                - Problem Title
                - Problem Description
                - Input Format
                - Output Format
                - Constraints
                - Example Test Cases with Explanations",
            "type": "MCQ" | "Coding",
            "difficulty": "Easy" | "Intermediate" | "Hard",
            "category": "String",
            "marks": Number,
            "options": [{ "text": "Option 1", "isCorrect": true }], // Only for MCQ
            "codingConfig": { // Only for Coding
                "languageTemplates": {
                    "javascript": "function solution(args) { \\n  // Write your code here \\n}",
                    "python": "def solution(args):\\n    # Write your code here\\n    pass"
                },
                "testCases": [
                    { "input": "input_as_string_or_json", "expectedOutput": "output_as_string", "isVisible": true },
                    { "input": "hidden_input", "expectedOutput": "hidden_output", "isVisible": false }
                ]
            }
        }
        
        For Coding questions, the 'description' field MUST contain the Problem Title, Description, Input/Output formats, Constraints, and at least 2 Examples.
        Ensure there are exactly the requested number of questions for each category.
        Do not include any text before or after the JSON.`;

        const response = await axios.post(
            GROQ_API_URL,
            {
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: "You are a technical assessment architect. Return ONLY valid JSON." },
                    { role: "user", content: prompt }
                ],
                temperature: 0,
                stream: false,
                response_format: { type: "json_object" }
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${GROQ_API_KEY}`
                }
            }
        );

        const text = response.data.choices[0].message.content;

        // Basic cleaning to handle potential markdown wrappers
        const cleanedJson = text.replace(/```json|```/g, "").trim();
        return JSON.parse(cleanedJson);
    } catch (error) {
        console.error("Groq AI Generation Error:", error.response?.data || error.message);
        
        // Unblock User: Fallback mock data if API fails
        if (error.response?.status === 429 || error.message.includes('Quota')) {
            console.log("Fallback: Returning mock questions due to API limit.");
            return [
                {
                    "title": "Two Sum",
                    "description": `### Problem Description
Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

### Input Format
- \`nums\`: List of integers
- \`target\`: Integer

### Output Format
- Return indices of two numbers → \`List[int]\`

### Constraints
- 2 ≤ nums.length ≤ 10⁴
- -10⁹ ≤ nums[i] ≤ 10⁹

### Example 1
**Input:** nums = [2,7,11,15], target = 9  
**Output:** [0,1]  
**Explanation:** nums[0] + nums[1] = 2 + 7 = 9

### Function Signature
\`\`\`javascript
function solution(obj) { // { nums, target }
    const { nums, target } = obj;
}
\`\`\``,
                    "type": "Coding",
                    "difficulty": "Easy",
                    "category": "Coding",
                    "marks": 5,
                    "codingConfig": {
                        "languageTemplates": {
                            "javascript": "function solution(obj) {\n  const { nums, target } = obj;\n  // Write your code here\n}",
                            "python": "def solution(obj):\n    nums = obj['nums']\n    target = obj['target']\n    # Write your code here\n    pass"
                        },
                        "testCases": [
                            { "input": '{"nums": [2,7,11,15], "target": 9}', "expectedOutput": "[0,1]", "isVisible": true },
                            { "input": '{"nums": [3,2,4], "target": 6}', "expectedOutput": "[1,2]", "isVisible": true },
                            { "input": '{"nums": [3,3], "target": 6}', "expectedOutput": "[0,1]", "isVisible": false }
                        ]
                    }
                }
            ];
        }
        
        throw new Error("Failed to generate questions via Groq: " + (error.response?.data?.error?.message || error.message));
    }
};

/**
 * Generates invitation description and work details using Groq AI
 * @param {Object} project Project details
 * @param {String} userRole Role being offered
 * @param {Object} userProfile (Optional) Candidate profile information
 * @returns {Object} { description, workDetails }
 */
exports.generateInvitationDetailsAI = async (project, userRole, userProfile) => {
    try {
        const prompt = `You are a professional hiring lead for a high-tech project called "${project.name}".
        You are inviting a candidate for the role of "${userRole}".
        
        Project Description: ${project.description || "A collaborative software development project."}
        ${userProfile ? `Candidate Bio: ${userProfile.bio || "No bio provided."}` : ""}
        ${userProfile ? `Candidate Skills: ${userProfile.skills?.join(', ') || "Not specified."}` : ""}

        Task: Generate a personalized and professional invitation message divided into two specific parts:
        1. "description": A high-level, exciting explanation of the project and why this project is a great opportunity. Explain why we are looking for someone like them (or someone in this role).
        2. "workDetails": A specific, task-oriented breakdown of what their daily contributions and first big milestones would look like.

        Return the result as a STRICT JSON object:
        {
            "description": "The project context and 'why' (markdown allowed)",
            "workDetails": "The technical work and 'what' (markdown list allowed)"
        }
        
        Keep it professional, engaging, and concise (max 150 words per section).
        Do not include any text before or after the JSON.`;

        const response = await axios.post(
            GROQ_API_URL,
            {
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: "You are a professional technical recruiter. Return ONLY valid JSON." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7,
                response_format: { type: "json_object" }
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${GROQ_API_KEY}`
                }
            }
        );

        const text = response.data.choices[0].message.content;
        return JSON.parse(text);
    } catch (error) {
        console.error("AI Invitation Generation Error:", error.message);
        
        // Fallback if AI fails
        return {
            description: `We are working on ${project.name}, a visionary project designed to push boundaries. We need a talented ${userRole} to help us scale and refine our current architecture.`,
            workDetails: `As a ${userRole}, you will be responsible for implementing core features, optimizing performance, and collaborating with our cross-functional team to deliver high-quality code.`
        };
    }
};
