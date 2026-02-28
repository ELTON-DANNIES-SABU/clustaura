const mongoose = require('mongoose');

const attemptSchema = new mongoose.Schema({
    testId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Test',
        required: true
    },
    candidateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: {
        type: Date
    },
    status: {
        type: String,
        enum: ['In-Progress', 'Submitted', 'Evaluated'],
        default: 'In-Progress'
    },
    answers: [{
        questionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Question'
        },
        selectedOptions: [Number], // Indices for MCQ
        textResponse: String,     // For Subjective/Fill-in-blanks
        codeResponse: {
            code: String,
            language: String,
            verdict: String,      // Passed, Failed, TLE, MLE, CE
            executedTestCases: Number,
            totalTestCases: Number
        },
        marksObtained: { type: Number, default: 0 },
        isEvaluated: { type: Boolean, default: false },
        feedback: String
    }],
    violations: [{
        type: { type: String }, // 'tab-switch', 'exit-fullscreen'
        timestamp: { type: Date, default: Date.now }
    }],
    totalScore: {
        type: Number,
        default: 0
    },
    rankSnapshot: Number
}, {
    timestamps: true
});

module.exports = mongoose.model('Attempt', attemptSchema);
