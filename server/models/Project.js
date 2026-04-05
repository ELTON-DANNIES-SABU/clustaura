const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    key: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    description: {
        type: String
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        role: {
            type: String,
            enum: ['owner', 'lead', 'developer', 'Developer', 'Member', 'Project Owner', 'Project Lead'], // Broadened for compatibility
            default: 'developer'
        }
    }],
    leaveRequests: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        requestDate: {
            type: Date,
            default: Date.now
        }
    }],
    invitations: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        role: String,
        description: String,
        workDetails: String,
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected'],
            default: 'pending'
        },
        sentAt: {
            type: Date,
            default: Date.now
        }
    }],

    columns: {
        type: [String],
        default: ['To Do', 'In Progress', 'Done']
    },
    community: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Community'
    },
    repositoryUrl: {
        type: String
    },
    githubAccessToken: {
        type: String
    },
    repositoryProvider: {
        type: String,
        default: 'github'
    },
    webhookSecret: {
        type: String
    },
    technologies: [{
        type: String
    }],
    modules: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProjectModule'
    }],
    sprints: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sprint'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    recommendedTechnologies: [{
        type: String
    }]
});

module.exports = mongoose.model('Project', ProjectSchema);
