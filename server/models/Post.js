const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        trim: true
    },
    media: [{
        type: String, // URLs to images/videos
        trim: true
    }],
    projectLink: {
        type: String,
        trim: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    comments: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        text: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    isCreatorPost: {
        type: Boolean,
        default: false
    },
    // Intelligent Features
    isHidden: {
        type: Boolean,
        default: false
    },
    flags: [{
        reason: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    analysis: {
        sentiment: String, // Changed to String to support labels like 'neutral'
        score: Number
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true // Adds updatedAt automatically
});

module.exports = mongoose.model('Post', PostSchema);
