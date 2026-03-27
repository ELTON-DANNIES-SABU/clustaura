const fs = require('fs');
const { calculateMatchScore } = require('c:/Users/risho/OneDrive/Desktop/clustaura_new/clustaura/server/services/matchingEngine');

const user1 = {
    _id: '1',
    firstName: 'Alice',
    skills: ['React', 'Node.js', 'MongoDB'],
    bio: 'I am a full stack developer'
};

const user2 = {
    _id: '2',
    firstName: 'Bob',
    skills: ['Java', 'Spring'],
    bio: 'Backend Java developer'
};

const user3 = {
    _id: '3',
    firstName: 'Charlie',
    skills: [], // No skills
    bio: ''
};

const task = {
    requiredSkills: ['React'],
    description: 'Need React developer for frontend'
};

const out = {
    alice: calculateMatchScore(user1, task),
    bob: calculateMatchScore(user2, task),
    charlie: calculateMatchScore(user3, task)
};

fs.writeFileSync('c:/Users/risho/OneDrive/Desktop/clustaura_new/clustaura/server/debug_out.txt', JSON.stringify(out, null, 2));
console.log("Done");
