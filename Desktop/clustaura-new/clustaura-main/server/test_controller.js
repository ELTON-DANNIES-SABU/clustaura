const mongoose = require('mongoose');
require('dotenv').config();
const Post = require('./models/Post');
const postController = require('./controllers/postController');

async function testController() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/clustaura');
        console.log('Connected to MongoDB');

        const req = {
            query: { page: 1, limit: 20 },
            app: { get: () => ({ emit: () => { } }) } // mock io
        };
        const res = {
            json: (data) => {
                console.log('Controller Response:', JSON.stringify(data, null, 2));
            },
            status: (code) => ({
                json: (data) => console.log(`Status ${code}:`, data)
            })
        };

        await postController.getFeed(req, res);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

testController();
