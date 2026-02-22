const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    host: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    scheduledAt: {
        type: Date,
        required: true
    },
    duration: {
        type: Number, // In minutes
        default: 30
    },
    meetingLink: {
        type: String,
        unique: true
    },
    lobby: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    status: {
        type: String,
        enum: ['scheduled', 'ongoing', 'ended', 'cancelled'],
        default: 'scheduled'
    },
    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CommTeam'
    },
    channelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CommChannel'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Meeting', meetingSchema);
