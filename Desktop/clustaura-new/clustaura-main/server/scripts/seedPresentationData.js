const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Community = require('../models/Community');
const Project = require('../models/Project');
const Post = require('../models/Post');
const Challenge = require('../models/Challenge');
const Issue = require('../models/Issue');
const Comment = require('../models/Comment');

async function seedPresentationData() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('🚀 Connected to MongoDB for seeding...');

        // Clear existing data
        console.log('🧹 Clearing existing data...');
        await Promise.all([
            User.deleteMany({}),
            Community.deleteMany({}),
            Project.deleteMany({}),
            Post.deleteMany({}),
            Challenge.deleteMany({}),
            Issue.deleteMany({}),
            Comment.deleteMany({})
        ]);

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        // 1. Create Users
        console.log('👥 Creating users...');
        const usersData = [
            { firstName: 'Arjun', lastName: 'Sharma', email: 'arjun@clustaura.com', password: hashedPassword, role: 'Tech Lead', credits: 1250, starTier: 'Neon', creditStars: 45 },
            { firstName: 'Priya', lastName: 'Patel', email: 'priya@clustaura.com', password: hashedPassword, role: 'Designer', credits: 850, starTier: 'Silver', creditStars: 28 },
            { firstName: 'Marcus', lastName: 'Miller', email: 'marcus@clustaura.com', password: hashedPassword, role: 'Developer', credits: 620, starTier: 'Bronze', creditStars: 15 },
            { firstName: 'Sarah', lastName: 'Chen', email: 'sarah@clustaura.com', password: hashedPassword, role: 'PM', credits: 940, starTier: 'Silver', creditStars: 32 },
            { firstName: 'Demo', lastName: 'User', email: 'user@test.com', password: hashedPassword, role: 'Developer', credits: 100, starTier: 'Bronze', creditStars: 5 }
        ];
        const users = await User.insertMany(usersData);

        // 2. Create Communities
        console.log('🏘️ Creating communities...');
        const communitiesData = [
            { name: 'React Ecosystem', slug: 'react-ecosystem', description: 'Advanced patterns and performance in modern React development.', members: users.map(u => u._id) },
            { name: 'Node.js Backend', slug: 'backend-systems', description: 'Scalable backend architectures, security best-practices, and DevOps.', members: users.map(u => u._id) },
            { name: 'AI & Data Science', slug: 'ai-data-science', description: 'Discussing LLMs, fine-tuning, and the future of agentic AI.', members: users.map(u => u._id) },
            { name: 'UI/UX Design', slug: 'ui-ux-design', description: 'Focusing on accessibility, motion design, and developer-friendly handoffs.', members: users.map(u => u._id) }
        ];
        const communities = await Community.insertMany(communitiesData);

        // 3. Create Projects
        console.log('📁 Creating projects...');
        const projectsData = [
            { name: 'ClustAura Dashboard', key: 'CAD', description: 'Main application dashboard with real-time analytics.', owner: users[0]._id, members: [users[0]._id, users[1]._id, users[3]._id], community: communities[0]._id },
            { name: 'Neural Engine', key: 'NEU', description: 'AI-powered recommendation and search core.', owner: users[0]._id, members: [users[0]._id, users[2]._id], community: communities[2]._id }
        ];
        const projects = await Project.insertMany(projectsData);

        // 4. Create Issues (Tasks)
        console.log('🎫 Creating workplace tasks...');
        const issuesData = [
            { project: projects[0]._id, issueKey: 'CAD-1', summary: 'Implement Real-time WebSocket Sync', status: 'Done', type: 'task', priority: 'highest', assignee: users[0]._id, reporter: users[3]._id, description: 'Need real-time updates for the community feed components.' },
            { project: projects[0]._id, issueKey: 'CAD-2', summary: 'Refactor Glassmorphism UI Components', status: 'In Progress', type: 'story', priority: 'high', assignee: users[1]._id, reporter: users[3]._id, description: 'Make UI pop with better transparency and blur effects.' },
            { project: projects[0]._id, issueKey: 'CAD-3', summary: 'Fix Mobile Header Positioning', status: 'To Do', type: 'bug', priority: 'medium', assignee: users[2]._id, reporter: users[3]._id },
            { project: projects[1]._id, issueKey: 'NEU-1', summary: 'Fine-tune Llama-3 for Tech Docs', status: 'Done', type: 'task', priority: 'highest', assignee: users[0]._id, reporter: users[3]._id }
        ];
        const issues = await Issue.insertMany(issuesData);

        // 5. Create Challenges (Problem Statements)
        console.log('🎯 Creating technical challenges...');
        const challengesData = [
            {
                title: 'Solving Hydration Mismatch in Next.js Server Actions',
                description: 'We are seeing persistent hydration errors when using complex form states with server actions. Has anyone found a reliable way to sync dynamic client states?',
                author: users[0]._id,
                tags: ['react', 'nextjs', 'ssr'],
                difficulty: 'Advanced',
                type: 'problem',
                views: 245
            },
            {
                title: 'Best approach for Horizontal Auto-scaling with WebSockets?',
                description: 'When scaling out our Node.js instances, we lose socket affinity. Should we stick with Redis Pub/Sub or move to a specialized gateway?',
                author: users[2]._id,
                tags: ['nodejs', 'scalability', 'websockets'],
                difficulty: 'Expert',
                type: 'question',
                views: 182
            }
        ];
        const challenges = await Challenge.insertMany(challengesData);

        // 6. Create Posts (Experiences & Updates)
        console.log('📝 Creating community posts...');
        const postsData = [
            {
                author: users[3]._id,
                title: 'Project Update: Neural Engine Milestone Beta',
                content: 'Successfully reduced inference latency by 45% using quantized weights. Ready for load testing next week!',
                community: communities[2]._id,
                type: 'Update',
                tags: ['milestone', 'ai', 'performance'],
                views: 89,
                likes: [users[0]._id, users[2]._id]
            },
            {
                author: users[1]._id,
                title: 'Design Philosophy for 2026',
                content: 'Interaction over static visuals. Motion should be functional, not just decorative. Discussing micro-transitions in the new layout.',
                community: communities[3]._id,
                type: 'Experience',
                tags: ['design', 'ux', 'motion'],
                views: 112,
                likes: [users[3]._id]
            }
        ];
        const posts = await Post.insertMany(postsData);

        // 7. Workplace Posts (Auto-posts from completed tasks)
        console.log('🏢 Creating workplace-linked posts...');
        const workplacePosts = [
            {
                author: users[0]._id,
                title: `Task Completed: ${issues[0].summary}`,
                content: `🚀 I just finished working on ${issues[0].summary} for project ${projects[0].name}. The system now supports real-time synchronization!`,
                community: projects[0].community,
                type: 'Project',
                tags: ['auto-post', 'milestone', 'workplace'],
                views: 45
            },
            {
                author: users[0]._id,
                title: `Task Completed: ${issues[3].summary}`,
                content: `🚀 I just finished working on ${issues[3].summary} for project ${projects[1].name}. Accuracy improved by 12% on technical benchmarks.`,
                community: projects[1].community,
                type: 'Project',
                tags: ['auto-post', 'ai', 'workplace'],
                views: 67
            }
        ];
        await Post.insertMany(workplacePosts);

        // 8. Comments
        console.log('💬 Adding realistic discussions...');
        const commentsData = [
            { content: 'Have you tried the `suppressHydrationWarning` prop as a temporary fix, or is it deeper than that?', author: users[2]._id, post: posts[0]._id },
            { content: 'Wait, this lateny reduction is incredible. Is this using 4-bit quantization?', author: users[0]._id, post: posts[0]._id },
            { content: 'The motion design in the dashboard is slick. Loving the spring physics!', author: users[0]._id, post: posts[1]._id }
        ];
        await Comment.insertMany(commentsData);

        console.log('✨ Data seeding complete for presentation! ✨');
        console.log('🔑 Credentials: All passwords are "password123"');
        console.log(`Arjun: arjun@clustaura.com`);
        console.log(`Demo: user@test.com`);

        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
}

seedPresentationData();
