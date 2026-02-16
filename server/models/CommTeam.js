const mongoose = require('mongoose');

const commTeamSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    icon: {
        type: String,
        default: 'T'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('CommTeam', commTeamSchema);
