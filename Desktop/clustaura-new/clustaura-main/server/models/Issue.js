const mongoose = require('mongoose');

const IssueSchema = new mongoose.Schema({
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    issueKey: {
        type: String,
        required: true,
        unique: true // e.g., "WEB-101"
    },
    summary: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    type: {
        type: String,
        enum: ['epic', 'story', 'task', 'bug'],
        default: 'task'
    },
    status: {
        type: String,
        default: 'To Do'
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Issue',
        default: null
    },
    priority: {
        type: String,
        enum: ['highest', 'high', 'medium', 'low', 'lowest'],
        default: 'medium'
    },
    assignee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    sprint: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sprint'
    },
    storyPoints: {
        type: Number,
        default: 0
    },
    dependencies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Issue'
    }],
    startDate: {
        type: Date
    },
    dueDate: {
        type: Date
    },
    reporter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
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

module.exports = mongoose.model('Issue', IssueSchema);
