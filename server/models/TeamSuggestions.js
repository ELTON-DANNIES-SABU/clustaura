const mongoose = require('mongoose');

const TeamSuggestionsSchema = new mongoose.Schema({
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    technology: {
        type: String,
        required: true
    },
    requiredDevelopers: {
        type: Number,
        default: 0
    },
    suggestedUsers: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        matchScore: {
            type: Number
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('TeamSuggestions', TeamSuggestionsSchema);
