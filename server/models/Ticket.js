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
    },
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    }
});

TicketSchema.post('save', async function(doc) {
    const Sprint = mongoose.model('Sprint');
    const ProjectModule = mongoose.model('ProjectModule');

    if (doc.sprint) {
        await Sprint.findByIdAndUpdate(doc.sprint, { $addToSet: { tickets: doc._id } });
    }
    if (doc.module) {
        await ProjectModule.findByIdAndUpdate(doc.module, { $addToSet: { tickets: doc._id } });
    }
});

// For deletion, use post 'findOneAndDelete' as it's common for deleteMany or fineOneAndDelete
TicketSchema.post('findOneAndDelete', async function(doc) {
    if (doc) {
        const Sprint = mongoose.model('Sprint');
        const ProjectModule = mongoose.model('ProjectModule');

        if (doc.sprint) {
            await Sprint.findByIdAndUpdate(doc.sprint, { $pull: { tickets: doc._id } });
        }
        if (doc.module) {
            await ProjectModule.findByIdAndUpdate(doc.module, { $pull: { tickets: doc._id } });
        }
    }
});

module.exports = mongoose.model('Ticket', TicketSchema);
