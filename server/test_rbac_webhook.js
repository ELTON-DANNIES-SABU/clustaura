const mongoose = require('mongoose');
const axios = require('axios');

async function runTest() {
    try {
        await mongoose.connect('mongodb://localhost:27017/clustaura');
        console.log('✅ Connected to DB');

        const User = require('./models/User');
        const Project = require('./models/Project');
        const Ticket = require('./models/Ticket');

        // 1. Find a valid user who belongs to a project
        const project = await Project.findOne({ 'members.0': { $exists: true } }).populate('members.user');
        if (!project) {
            console.log('❌ No projects with members found in the Database.');
            process.exit(1);
        }

        const member = project.members[0];
        const user = member.user;
        const userEmail = user.email;

        // Ensure the project has a repository URL to match webhook routing
        const repoUrl = 'https://github.com/mock/repo';
        project.repositoryUrl = repoUrl;
        
        // Ensure user is Lead/Owner to see the Approve button
        member.role = 'lead';
        await project.save();

        // 2. Find or create a ticket
        let ticket = await Ticket.findOne({ project: project._id });
        if (!ticket) {
            ticket = await Ticket.create({
                title: 'Test Integration Ticket',
                project: project._id,
                status: 'To Do',
                progressPercentage: 0,
                ticketCode: 'TEST-1'
            });
        } else {
            // Reset ticket for test
            ticket.ticketCode = 'TEST-1';
            ticket.status = 'To Do';
            ticket.progressPercentage = 0;
            ticket.requiresApproval = false;
            await ticket.save();
        }

        console.log('\n=========================================');
        console.log(`🎯 TARGET READY`);
        console.log(`👤 Test User Email: ${userEmail}`);
        console.log(`📁 Project Name: ${project.name}`);
        console.log(`🎫 Ticket Code: ${ticket.ticketCode}`);
        console.log('=========================================\n');
        
        console.log('⏳ PLEASE LOG IN TO CLUSTAURA AS THIS USER:');
        console.log(`Email: ${userEmail}`);
        console.log(`Go to the Kanban Board for project: "${project.name}"`);
        console.log('\nWaiting 10 seconds for you to open the board (script will auto-continue)...\n');

        await new Promise(resolve => setTimeout(resolve, 10000));

        // 3. Trigger High Confidence Commit (Auto Approve)
        console.log('🚀 Phase 1: Simulating an Auto-Approved Push Event...');
        const pushPayload = {
            ref: "refs/heads/main",
            commits: [
                {
                    id: "hash" + Date.now().toString().slice(-4),
                    message: "fix minor styling #TEST-1",
                    timestamp: new Date().toISOString(),
                    author: { name: user.firstName, email: userEmail }
                }
            ],
            repository: { html_url: repoUrl }
        };

        try {
            await axios.post('http://localhost:5000/api/git/webhook', pushPayload, {
                headers: { 'x-github-event': 'push' }
            });
            console.log("✅ Push Webhook Triggered! The ticket should now move to 'In Progress' with 20% progress on your board instantly.");
        } catch (e) {
            console.error("❌ Failed to send push webhook:", e.message);
        }

        console.log('\nWaiting 5 seconds before next phase...\n');
        await new Promise(resolve => setTimeout(resolve, 5000));

        // 4. Trigger Pull Request (Requires Approval)
        console.log('🚀 Phase 2: Simulating a Pull Request Event (Requires Human Approval)...');
        const prPayload = {
            action: "opened",
            pull_request: {
                title: "Add major feature #TEST-1",
                body: "This fixes a lot of things. Ref #TEST-1",
                user: { email: userEmail }
            },
            repository: { html_url: repoUrl }
        };

        try {
            await axios.post('http://localhost:5000/api/git/webhook', prPayload, {
                headers: { 'x-github-event': 'pull_request' }
            });
            console.log("✅ PR Webhook Triggered! Check your board:");
            console.log("👉 You should see a yellow 'Pending Approval' badge on the ticket.");
            console.log("👉 An 'Approvals (1)' button should appear at the top-right toolbar.");
            console.log("👉 Click it and click 'Approve' to manually authorize the change.");
        } catch (e) {
            console.error("❌ Failed to send PR webhook:", e.message);
        }

        console.log('\n✅ Test Script Complete! Verify the UI interactions on the browser.\n');
        process.exit(0);

    } catch (error) {
        console.error('Error in test script:', error);
        process.exit(1);
    }
}

runTest();
