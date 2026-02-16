const mongoose = require('mongoose');

const SprintSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    goal: {
        type: String
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ['future', 'active', 'closed'],
        default: 'future'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Sprint', SprintSchema);
