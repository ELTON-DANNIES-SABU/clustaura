const mongoose = require('mongoose');
const Challenge = require('./models/Challenge');
require('dotenv').config();

const checkDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/clustaura');
        console.log('Connected to DB');
        const count = await Challenge.countDocuments();
        console.log('Total challenges:', count);
        const challenges = await Challenge.find().limit(5);
        console.log('Sample challenges:', JSON.stringify(challenges, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkDB();
