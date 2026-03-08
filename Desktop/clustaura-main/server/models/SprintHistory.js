const mongoose = require('mongoose');

const SprintHistorySchema = new mongoose.Schema({
    teamOrProjectCode: { type: String, required: true }, // Identifier for the group
    sprintId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sprint' },
    sprintName: { type: String },
    totalPointsCommitted: { type: Number, default: 0 },
    totalPointsCompleted: { type: Number, default: 0 },

    // Domain-wise breakdown for adaptive learning
    breakdown: {
        frontend: { type: Number, default: 0 },
        backend: { type: Number, default: 0 },
        design: { type: Number, default: 0 },
        other: { type: Number, default: 0 }
    },

    completedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SprintHistory', SprintHistorySchema);
