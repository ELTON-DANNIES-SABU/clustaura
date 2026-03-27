const mongoose = require('mongoose');
const axios = require('axios');

mongoose.connect('mongodb://localhost:27017/clustaura').then(async () => {
    const Ticket = require('./models/Ticket');
    const Project = require('./models/Project');
    
    // Find any ticket
    const t = await Ticket.findOne({});
    if (t) {
        const p = await Project.findById(t.project || t.projectId);
        p.repositoryUrl = 'https://github.com/mock/repo';
        await p.save();
        
        t.ticketCode = 'TICK-1';
        await t.save();
        
        console.log('Fixed Ticket associated with project:', p.name);

        const payload = {
            ref: "refs/heads/main",
            commits: [
                {
                    id: "mock123hash" + Date.now().toString().slice(-4),
                    message: "fix bug - ticket #TICK-1",
                    timestamp: new Date().toISOString(),
                    author: { name: "Test User" }
                }
            ],
            repository: {
                html_url: "https://github.com/mock/repo" 
            }
        };

        const res = await axios.post('http://localhost:5000/api/git/webhook', payload, {
            headers: { 'x-github-event': 'push' }
        });
        console.log("Webhook triggered successfully:", res.data);
    } else {
        console.log('No ticket found in DB');
    }
    process.exit(0);
});
