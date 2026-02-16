const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/auth';
const TEST_USER = {
    firstName: 'Debug',
    lastName: 'User',
    email: `debug_login_${Date.now()}@example.com`,
    password: 'password123'
};

const runTest = async () => {
    try {
        console.log('1. Testing Registration...');
        try {
            const registerRes = await axios.post(`${BASE_URL}/register`, TEST_USER);
            console.log('✅ Registration Successful:', registerRes.status);
            console.log('User ID:', registerRes.data._id);
        } catch (error) {
            console.error('❌ Registration Failed:', error.response?.data || error.message);
            // If user already exists (unlikely with timestamp), we proceed to login anyway
        }

        console.log('\n2. Testing Login...');
        try {
            const loginRes = await axios.post(`${BASE_URL}/login`, {
                email: TEST_USER.email,
                password: TEST_USER.password
            });
            console.log('✅ Login Successful:', loginRes.status);
            console.log('Token received:', !!loginRes.data.token);
        } catch (error) {
            console.error('❌ Login Failed:', error.response?.data || error.message);
        }

    } catch (error) {
        console.error('Unexpected error:', error.message);
    }
};

runTest();
