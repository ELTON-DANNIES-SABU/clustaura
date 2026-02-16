const mongoose = require('mongoose');

const CreditLedgerSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    amount: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['bounty', 'post_creation', 'post_impact', 'collaboration', 'penalty', 'daily_login'],
        required: true
    },
    source: {
        type: mongoose.Schema.Types.Mixed, // Can be PostId, CommentId, or system string
        default: 'system'
    },
    description: {
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('CreditLedger', CreditLedgerSchema);
