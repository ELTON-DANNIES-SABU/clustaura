const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Test title is required'],
        trim: true
    },
    description: {
        type: String
    },
    duration: {
        type: Number, // in minutes
        required: true
    },
    sections: [{
        title: String,
        questions: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Question'
        }]
    }],
    totalMarks: {
        type: Number,
        default: 0
    },
    passMarks: {
        type: Number,
        default: 0
    },
    startTime: Date,
    endTime: Date,
    isPublished: {
        type: Boolean,
        default: false
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project'
    },
    invitedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    rules: {
        shuffleQuestions: { type: Boolean, default: true },
        allowMultipleAttempts: { type: Boolean, default: false },
        negativeMarking: { type: Number, default: 0 },
        fullScreenEnforcement: { type: Boolean, default: true },
        tabSwitchDetection: { type: Boolean, default: true }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Test', testSchema);
