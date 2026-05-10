const mongoose = require('mongoose');
const User = require('./models/User');
const Profile = require('./models/Profile');
require('dotenv').config();

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ firstName: 'Donald', lastName: 'Deeju' });
        if (!user) {
            console.log('User Donald Deeju not found');
            process.exit(0);
        }
        
        const profile = await Profile.findOne({ user: user._id });
        if (!profile) {
            console.log('Profile for Donald Deeju not found');
            process.exit(0);
        }
        
        console.log('--- DONALD DEEJU PROFILE DATA ---');
        console.log('Email:', user.email);
        console.log('Embedding Status:', profile.embedding && profile.embedding.length > 0 ? `HAS EMBEDDING (${profile.embedding.length} dims)` : 'NO EMBEDDING');
        console.log('Last Embedded At:', profile.lastEmbeddedAt);
        console.log('Bio Length:', profile.bio?.length || 0);
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

check();
