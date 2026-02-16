const axios = require('axios');

async function testFeed() {
    try {
        // We need a token if it's protected.
        // For simplicity, let's check if we can bypass or if we need a real token.
        // In postRoutes.js: router.use(protect);
        // So we need a token.

        console.log('Fetching feed from http://localhost:5000/api/posts/feed');
        // Since I don't have a token easily handy for curl without login, 
        // I'll check if I can find a user to login or if I can just check the DB again with more detail.

        // Actually, let's just use the server's internal Post model in a script again.
    } catch (err) {
        console.error(err);
    }
}
testFeed();
