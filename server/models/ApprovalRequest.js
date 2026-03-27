const mongoose = require('mongoose');

const ApprovalRequestSchema = new mongoose.Schema({
    ticket: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ticket',
        required: true
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    proposedStatus: {
        type: String
    },
    proposedProgress: {
        type: Number
    },
    triggeredBy: {
        type: String,
        default: 'system'
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    originalCommitMessage: {
        type: String
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ApprovalRequest', ApprovalRequestSchema);
