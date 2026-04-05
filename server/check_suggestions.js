const mongoose = require('mongoose');
require('dotenv').config();

const TeamSuggestions = require('./models/TeamSuggestions');

async function checkSuggestions() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const suggestions = await TeamSuggestions.find().populate('suggestedUsers.user', 'firstName lastName');
        console.log(`Found ${suggestions.length} suggestion groups.`);

        suggestions.forEach(s => {
            console.log(`Group: ${s.technology} | Tech: ${s.technology}`);
            console.log(`  - Users: ${s.suggestedUsers.length}`);
            s.suggestedUsers.forEach(u => {
                console.log(`    * User: ${u.user ? u.user.firstName : 'NULL'} | Score: ${u.matchScore}`);
            });
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSuggestions();
