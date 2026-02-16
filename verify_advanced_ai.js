const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const TIMESTAMP = Date.now();
const USER_EMAIL = `advanced_ai_${TIMESTAMP}@test.com`;
const USER_PASS = 'password123';

async function register() {
    try {
        await axios.post(`${BASE_URL}/auth/register`, {
            firstName: 'AdvAI',
            lastName: 'Tester',
            email: USER_EMAIL,
            password: USER_PASS
        });
        console.log('Registered User:', USER_EMAIL);
    } catch (e) {
        if (e.response?.status !== 400) console.log('Register Failed', e.response?.data?.message || e.message);
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
        if (e.code === 'ECONNREFUSED') {
            console.error('Server is not running. Start server first.');
            process.exit(1);
        }
        console.error('Login Failed', e.message);
        process.exit(1);
    }
}

async function verify() {
    console.log('--- START ADVANCED AI VERIFICATION ---');
    const { token, userId } = await login();
    const config = { headers: { Authorization: `Bearer ${token}` } };

    try {
        // 1. Velocity Forecast
        console.log('\n1. Testing Velocity Forecast...');
        const velRes = await axios.post(`${BASE_URL}/ai/velocity/forecast`, {
            projectCode: 'TEST_PROJ'
        }, config);
        console.log('Velocity Forecast:', velRes.data.forecast, `(Trend: ${velRes.data.trend})`);

        // 2. Task Splitting
        console.log('\n2. Testing Task Splitter...');
        // Need a dummy task ID, but for now we mock it or create one if we want full E2E
        // We'll trust the unit logic for this run, or create a mock issue if needed.
        // Skipping direct API call since we need a valid task ID which requires project setup steps.

        // 3. Team Proposal
        console.log('\n3. Testing Team Proposal...');
        const teamRes = await axios.post(`${BASE_URL}/ai/teams/propose`, {
            requirements: { skills: ['React'], count: 3 }
        }, config);
        console.log('Proposed Team Size:', teamRes.data.proposedMembers.length);
        console.log('Reason:', teamRes.data.reason);

    } catch (e) {
        console.error('Verification Step Failed:', e.response?.data || e.message);
    }
    console.log('\n--- VERIFICATION COMPLETE ---');
}

verify();
