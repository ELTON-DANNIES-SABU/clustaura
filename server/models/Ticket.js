const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    module: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProjectModule',
        required: true
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    priority: {
        type: String,
        enum: ['highest', 'high', 'medium', 'low', 'lowest'],
        default: 'medium'
    },
    type: {
        type: String,
        enum: ['task', 'story', 'bug'],
        default: 'task'
    },
    effort: {
        type: Number,
        default: 0
    },
    assignedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        default: 'To Do'
    },
    skillsRequired: [{
        type: String
    }],
    sprint: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sprint'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Ticket', TicketSchema);
