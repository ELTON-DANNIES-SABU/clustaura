const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/clustaura').then(async () => {
    const Ticket = require('./models/Ticket');
    const Project = require('./models/Project');
    
    const t = await Ticket.findOne({ issueKey: { $exists: true } });
    if (t) {
        const p = await Project.findById(t.project);
        p.repositoryUrl = 'https://github.com/mock/repo';
        await p.save();
        
        t.ticketCode = t.issueKey;
        await t.save();
        
        console.log('Fixed Ticket:', t.issueKey);
    } else {
        console.log('No ticket found to mock');
    }
    process.exit(0);
});
