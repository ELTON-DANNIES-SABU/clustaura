const mongoose = require('mongoose');

const callSessionSchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true,
        index: true
    },
    channelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CommChannel',
        required: false
    },
    initiator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    callType: {
        type: String,
        enum: ['audio', 'video'],
        default: 'video'
    },
    status: {
        type: String,
        enum: ['active', 'ended'],
        default: 'active'
    },
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: {
        type: Date
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('CallSession', callSessionSchema);
