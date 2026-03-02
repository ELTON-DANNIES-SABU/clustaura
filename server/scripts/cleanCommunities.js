const mongoose = require('mongoose');
require('dotenv').config();

const Community = require('../models/Community');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

async function cleanDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const communityCount = await Community.countDocuments();
        const postCount = await Post.countDocuments();
        const commentCount = await Comment.countDocuments();

        console.log(`Deleting ${communityCount} communities, ${postCount} posts, and ${commentCount} comments...`);

        await Community.deleteMany({});
        await Post.deleteMany({});
        await Comment.deleteMany({});

        console.log('Database cleaned successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error during database cleanup:', error);
        process.exit(1);
    }
}

cleanDB();
