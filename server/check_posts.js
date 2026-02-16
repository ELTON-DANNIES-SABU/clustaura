const mongoose = require('mongoose');
require('dotenv').config();
const Post = require('./models/Post');

async function checkPosts() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/clustaura');
        console.log('Connected to MongoDB');

        const allPosts = await Post.find({});
        console.log(`Total posts: ${allPosts.length}`);

        const visiblePosts = await Post.find({ isHidden: { $ne: true } });
        console.log(`Visible posts: ${visiblePosts.length}`);

        if (allPosts.length > 0) {
            console.log('First post sample:', JSON.stringify(allPosts[0], null, 2));
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkPosts();
