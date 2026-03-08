const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const TIMESTAMP = Date.now();
const USER_EMAIL = `ai_test_${TIMESTAMP}@test.com`;
const USER_PASS = 'password123';

async function register() {
    try {
        await axios.post(`${BASE_URL}/auth/register`, {
            firstName: 'AI',
            lastName: 'Tester',
            email: USER_EMAIL,
            password: USER_PASS
        });
        console.log('Registered User:', USER_EMAIL);
    } catch (e) {
        if (e.code === 'ECONNREFUSED') {
            console.error('Server is not running. Please start the server (npm run server) before verifying.');
            process.exit(1);
        }
        if (e.response?.status !== 400) console.error('Register Failed', e.message);
    }
}

async function login() {
    await register();
    try {
        const res = await axios.post(`${BASE_URL}/auth/login`, {
            email: USER_EMAIL,
            password: USER_PASS
        });
        return { token: res.data.token, userId: res.data.user._id };
    } catch (e) {
        console.error('Login Failed', e.response?.data || e.message);
        process.exit(1);
    }
}

async function runTest() {
    console.log('--- START AI SPRINT INTELLIGENCE TEST ---');
    const { token } = await login();
    const config = { headers: { Authorization: `Bearer ${token}` } };

    // 1. Get a Project & Sprint
    // Assuming at least one project exists
    let sprintId;
    try {
        // Need to find a project first, or just list sprints if there's a direct endpoint?
        // Let's assume we know a project or list projects.
        // Trying to get user projects
        // Since I don't have a direct "list all my projects" easy endpoint without ID, I'll rely on what I see in valid routes.
        // WorkplaceRoutes generally need project ID.
        // Let's try to fetch user profile or something to find a project? 
        // Or create a dummy project/sprint if needed. 
        // Actually, just fetching all projects for user if endpoint exists.
        // Let's use `search` or just assume one.
        // Harder to guess ID. I'll create one.

        console.log('Creating Test Project...');
        const projRes = await axios.post(`${BASE_URL}/workplace/projects`, {
            name: 'AI Test Project',
            key: 'AITEST' + Date.now().toString().substr(-4),
            description: 'For AI validation'
        }, config);
        const projectId = projRes.data._id;
        console.log(`Project Created: ${projectId}`);

        console.log('Creating Test Sprint...');
        const sprintRes = await axios.post(`${BASE_URL}/workplace/projects/${projectId}/sprints`, {
            name: 'Sprint 1',
            startDate: new Date(),
            endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 2 weeks
        }, config);
        sprintId = sprintRes.data._id;
        console.log(`Sprint Created: ${sprintId}`);

        // Create some Issues
        console.log('Seeding Issues...');
        // Issue 1: Stuck Task (Simulated via update? No easy way to backdate via API)
        // Issue 2: Normal Task
        await axios.post(`${BASE_URL}/workplace/issues`, {
            projectId,
            sprintId,
            summary: 'Stuck Task',
            type: 'task',
            priority: 'medium',
            assignee: '' // Unassigned
        }, config);

        // 2. Fetch AI Insights
        console.log('Fetching AI Insights...');
        const aiRes = await axios.get(`${BASE_URL}/ai/sprint/${sprintId}/insights`, config);

        console.log('\n--- AI INSIGHTS RESULT ---');
        console.log('Risk Level:', aiRes.data.health.riskLevel);
        console.log('Success Prob:', aiRes.data.health.probability + '%');
        console.log('Narrative:', aiRes.data.narrative);
        console.log('Bottlenecks:', aiRes.data.bottlenecks);
        console.log('Suggestions:', aiRes.data.suggestions);

    } catch (e) {
        console.error('Test Failed', e.response?.data || e.message);
    }

    console.log('--- TEST COMPLETE ---');
}

runTest();
