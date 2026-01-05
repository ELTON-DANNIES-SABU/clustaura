const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    bio: {
        type: String,
        maxLength: 500
    },
    skills: [{
        type: String,
        trim: true
    }],
    location: {
        type: String,
        trim: true
    },
    website: {
        type: String,
        trim: true
    },
    github: {
        type: String,
        trim: true
    },
    twitter: {
        type: String,
        trim: true
    },
    profileImageUrl: {
        type: String
    }
}, {
    timestamps: true
});

const Profile = mongoose.model('Profile', profileSchema);

module.exports = Profile;
