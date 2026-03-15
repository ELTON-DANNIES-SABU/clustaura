const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const UserSkillProfile = require('./models/UserSkillProfile');

async function seedProfiles() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/clustaura');
        console.log("Connected to MongoDB for seeding...");

        const users = await User.find();
        if (users.length === 0) {
            console.log("No users found to seed profiles for.");
            process.exit(0);
        }

        const skillsPool = [
            ["React", "Redux", "Javascript", "CSS3", "HTML5"],
            ["Node.js", "Express", "MongoDB", "Socket.io", "Redis"],
            ["Python", "Django", "PostgreSQL", "AWS", "Docker"],
            ["React Native", "Firebase", "Typescript", "GraphQL"],
            ["UI/UX", "Figma", "Adobe XD", "Design Systems"]
        ];

        const profilesToInsert = users.map((user, index) => {
            const skills = skillsPool[index % skillsPool.length];
            const levels = ['junior', 'intermediate', 'senior'];
            
            return {
                user: user._id,
                skills: skills,
                experienceLevel: levels[index % levels.length],
                currentWorkload: Math.floor(Math.random() * 5),
                availabilityStatus: index % 3 === 0 ? 'busy' : 'available'
            };
        });

        await UserSkillProfile.deleteMany({});
        await UserSkillProfile.insertMany(profilesToInsert);

        console.log(`Successfully seeded ${profilesToInsert.length} skill profiles.`);
        process.exit(0);
    } catch (error) {
        console.error("Seeding Error:", error);
        process.exit(1);
    }
}

seedProfiles();
