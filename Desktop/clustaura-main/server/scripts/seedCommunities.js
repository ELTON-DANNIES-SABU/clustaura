const mongoose = require('mongoose');
require('dotenv').config();

const Community = require('../models/Community');
const Post = require('../models/Post');
const User = require('../models/User');

async function seedDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // Find a user to be the author (pick the first one)
        const user = await User.findOne();
        if (!user) {
            console.error('No user found in DB. Please register a user first.');
            process.exit(1);
        }

        const communitiesData = [
            {
                name: 'Programming',
                slug: 'programming',
                description: 'A community for developers to share knowledge, ask questions, and discuss programming topics.',
                icon: '💻',
                color: '#2EFFC7',
                members: [user._id],
                moderators: [user._id]
            },
            {
                name: 'Web Dev',
                slug: 'webdev',
                description: 'Everything related to web development, from frontend to backend.',
                icon: '🌐',
                color: '#FF6B9D',
                members: [user._id],
                moderators: [user._id]
            },
            {
                name: 'ReactJS',
                slug: 'reactjs',
                description: 'Dedicated to the React ecosystem and library.',
                icon: '⚛️',
                color: '#61DAFB',
                members: [user._id],
                moderators: [user._id]
            },
            {
                name: 'AI & ML',
                slug: 'ai',
                description: 'Discussing the latest in Artificial Intelligence and Machine Learning.',
                icon: '🧠',
                color: '#FF4D4D',
                members: [user._id],
                moderators: [user._id]
            }
        ];

        console.log('Seeding communities...');
        const createdCommunities = await Community.insertMany(communitiesData);

        const postsData = [
            {
                title: 'How to build a professional community with React?',
                content: 'I am looking for best practices for building a scalable community platform using React and Node.js. What are your tips?',
                community: createdCommunities[0]._id,
                author: user._id,
                tags: ['react', 'webdev', 'community'],
                votes: [user._id]
            },
            {
                title: 'The future of AI in 2026',
                content: 'AI is evolving faster than ever. What do you think will be the biggest breakthrough this year?',
                community: createdCommunities[3]._id,
                author: user._id,
                tags: ['ai', 'future', 'technology'],
                votes: [user._id]
            },
            {
                title: 'State Management in 2026: Zustand vs Redux',
                content: 'Zustand has been taking over the React community. Is there any reason to stick with Redux anymore?',
                community: createdCommunities[2]._id,
                author: user._id,
                tags: ['react', 'zustand', 'redux'],
                votes: [user._id]
            }
        ];

        console.log('Seeding posts...');
        await Post.insertMany(postsData);

        console.log('Database seeded successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error during database seeding:', error);
        process.exit(1);
    }
}

seedDB();
