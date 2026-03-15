const mongoose = require('mongoose');

const TeamRequirementSchema = new mongoose.Schema({
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
    currentDevelopers: {
        type: Number,
        default: 0
    },
    gap: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('TeamRequirement', TeamRequirementSchema);
