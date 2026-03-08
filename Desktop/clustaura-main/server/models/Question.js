const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Question title is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Question description is required']
    },
    type: {
        type: String,
        enum: ['MCQ', 'True/False', 'Fill-in-the-blanks', 'Subjective', 'Coding'],
        required: true
    },
    difficulty: {
        type: String,
        enum: ['Easy', 'Intermediate', 'Hard'],
        default: 'Intermediate'
    },
    marks: {
        type: Number,
        required: true,
        default: 1
    },
    // MCQ specific
    options: [{
        text: String,
        isCorrect: Boolean
    }],
    // Fill-in-the-blanks specific
    acceptedAnswers: [String],
    // Coding specific
    codingConfig: {
        languageTemplates: {
            python: String,
            javascript: String,
            cpp: String,
            java: String
        },
        testCases: [{
            input: String,
            expectedOutput: String,
            isVisible: { type: Boolean, default: false }
        }],
        constraints: {
            timeLimit: { type: Number, default: 2000 }, // ms
            memoryLimit: { type: Number, default: 512 } // MB
        }
    },
    category: String,
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Question', questionSchema);
