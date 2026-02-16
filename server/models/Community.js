const mongoose = require('mongoose');

const CommunitySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    moderators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    rules: [{ type: String }],
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Community', CommunitySchema);
