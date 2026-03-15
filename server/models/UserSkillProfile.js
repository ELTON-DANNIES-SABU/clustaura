const mongoose = require('mongoose');

const UserSkillProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    skills: [{
        type: String
    }],
    experienceLevel: {
        type: String,
        enum: ['junior', 'intermediate', 'senior'],
        default: 'intermediate'
    },
    currentWorkload: {
        type: Number,
        default: 0
    },
    currentProjects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project'
    }],
    availabilityStatus: {
        type: String,
        enum: ['available', 'busy', 'unavailable'],
        default: 'available'
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('UserSkillProfile', UserSkillProfileSchema);
