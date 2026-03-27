const mongoose = require('mongoose');
const UserSkillProfile = require('./models/UserSkillProfile');
const User = require('./models/User');

const uri = "mongodb+srv://clustaura_db_user:aura123@cluster0.ouumxnw.mongodb.net/clustaura?retryWrites=true&w=majority";

mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    const profiles = await UserSkillProfile.find().populate('user', 'firstName lastName email');
    const out = profiles.map(p => ({
        name: p.user ? `${p.user.firstName} ${p.user.lastName}` : 'Unknown',
        skills: p.skills
    }));
    require('fs').writeFileSync('c:/Users/risho/OneDrive/Desktop/clustaura_new/clustaura/server/debug_profiles.txt', JSON.stringify(out, null, 2));
    console.log("Done DB Profile Extraction");
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
