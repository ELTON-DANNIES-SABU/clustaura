const BASE_URL = 'http://localhost:5000/api';

async function debugPost() {
    try {
        // 1. Login to get token
        console.log('Logging in...');
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'demo@clustaura.com', password: 'Demo@2024' }) // Assuming demo user exists, otherwise will register
        });

        let token;
        if (loginRes.ok) {
            const data = await loginRes.json();
            token = data.token;
        } else {
            // Fallback to register if login fails
            console.log('Login failed, trying register...');
            const regRes = await fetch(`${BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ firstName: 'Debug', lastName: 'User', email: `debug_${Date.now()}@test.com`, password: 'password123' })
            });
            const data = await regRes.json();
            token = data.token;
        }

        console.log('Token acquired.');

        // 2. Send EXACT Frontend Payload
        const payload = {
            content: "Debug content",
            tags: [],
            projectLink: "",       // Empty string
            isCreatorPost: false,
            media: []              // Empty array
        };

        console.log('Sending Payload:', payload);

        const res = await fetch(`${BASE_URL}/posts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        console.log('Response Status:', res.status);
        const text = await res.text();
        console.log('Response Body:', text);

    } catch (e) {
        console.error('Debug Script Error:', e);
    }
}

debugPost();
