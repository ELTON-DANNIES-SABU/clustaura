const aiService = require('./server/services/aiService');

const requirements = [
    { category: 'Coding', difficulty: 'Intermediate', count: 1 }
];

async function testAI() {
    console.log('--- Testing AI Generation ---');
    try {
        const questions = await aiService.generateQuestionsAI(requirements);
        console.log(JSON.stringify(questions, null, 2));
    } catch (err) {
        console.error(err);
    }
}

testAI().then(() => process.exit(0));
