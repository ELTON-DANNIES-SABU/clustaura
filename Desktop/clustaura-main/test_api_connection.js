const BASE_URL = 'http://localhost:5000/api';

async function testAPI() {
    try {
        console.log('1. Testing Health Check...');
        try {
            const health = await fetch(`${BASE_URL}/health`);
            console.log('✅ Health Check Status:', health.status);
            const data = await health.json();
            console.log('   Response:', data);
        } catch (e) {
            console.error('❌ Health Check Failed:', e.message);
        }

        console.log('\n2. Registering User...');
        const email = `testuser_${Date.now()}@example.com`;
        const password = 'password123';
        let token = '';

        try {
            const registerRes = await fetch(`${BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName: 'Test',
                    lastName: 'User',
                    email,
                    password
                })
            });

            if (!registerRes.ok) {
                const errorText = await registerRes.text();
                throw new Error(`Status ${registerRes.status}: ${errorText}`);
            }

            const data = await registerRes.json();
            token = data.token;
            console.log('✅ Registration Successful. Token received.');
        } catch (e) {
            console.error('❌ Registration Failed:', e.message);
            return;
        }

        console.log('\n3. Creating Post...');
        try {
            const postRes = await fetch(`${BASE_URL}/posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    content: 'This is a test post from script',
                    tags: ['test']
                })
            });

            if (!postRes.ok) {
                const errorText = await postRes.text();
                throw new Error(`Status ${postRes.status}: ${errorText}`);
            }

            const data = await postRes.json();
            console.log('✅ Create Post Successful:', data._id);
        } catch (e) {
            console.error('❌ Create Post Failed:', e.message);
        }

        console.log('\n4. Fetching Feed...');
        try {
            const feedRes = await fetch(`${BASE_URL}/posts/feed`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!feedRes.ok) {
                const errorText = await feedRes.text();
                throw new Error(`Status ${feedRes.status}: ${errorText}`);
            }

            const data = await feedRes.json();
            console.log(`✅ Fetch Feed Successful. Got ${data.posts.length} posts.`);
        } catch (e) {
            console.error('❌ Fetch Feed Failed:', e.message);
        }

    } catch (error) {
        console.error('Unexpected Error:', error);
    }
}

testAPI();
