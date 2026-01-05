const mongoose = require('mongoose');

const commMessageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Only for DMs
    },
    channelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CommChannel',
        required: false // Only for channel messages
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    reactions: [{
        emoji: String,
        users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    }],
    attachments: [{
        name: String,
        url: String,
        fileType: String
    }],
    isRead: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('CommMessage', commMessageSchema);
