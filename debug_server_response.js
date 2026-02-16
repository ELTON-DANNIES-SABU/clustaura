// Using native fetch in Node 18+

async function debugProfile() {
    const baseUrl = 'http://localhost:5000/api';
    const uniqueId = Date.now();
    const email = `debug_${uniqueId}@test.com`;
    const password = 'password123';

    try {
        console.log('1. Registering test user...');
        let res = await fetch(`${baseUrl}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ firstName: 'Debug', lastName: 'User', email, password })
        });
        let data = await res.json();

        if (!res.ok) {
            console.log('Registration failed/User exists, trying login...');
            res = await fetch(`${baseUrl}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            data = await res.json();
        }

        if (!data.token) {
            console.error('Failed to get token:', data);
            return;
        }

        console.log('2. Got token. Attempting Profile Update with LARGE payload...');
        const token = data.token;

        // Create a large fake base64 image (~2MB)
        const largeImage = 'data:image/jpeg;base64,' + 'a'.repeat(2 * 1024 * 1024);

        res = await fetch(`${baseUrl}/profile/me`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                bio: 'Debug Bio with Large Image',
                skills: ['DebugSkill'],
                location: 'Debug Land',
                profileImageUrl: largeImage
            })
        });

        const status = res.status;
        const responseText = await res.text();

        console.log(`Response Status: ${status}`);
        // Only print first 200 chars of body to avoid spamming console if it returns the image back
        console.log('Response Body Preview:', responseText.substring(0, 200));

    } catch (err) {
        console.error('Script error:', err);
    }
}

debugProfile();
