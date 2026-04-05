const profileMatchingEngine = require('../services/profileMatchingEngine');

const mockTask = {
    requiredSkills: ['Node.js', 'React', 'MongoDB'],
    description: 'Looking for a fullstack developer to build a modern web application with Node.js and React.'
};

const mockUsers = [
    {
        _id: '1',
        firstName: 'Alice',
        lastName: 'Fullstacker',
        skills: ['Node.js', 'React', 'MongoDB'],
        bio: 'Expert fullstack developer with deep knowledge in Node.js and React.',
        posts: [
            { title: 'Working with React', content: 'In this post I discuss how to optimize React apps.' },
            { title: 'Node.js Backend', content: 'Creating scalable APIs with Express and Node.js.' }
        ]
    },
    {
        _id: '2',
        firstName: 'Bob',
        lastName: 'Backender',
        skills: ['Express', 'PostgreSQL', 'Python'],
        bio: 'I build robust server-side applications.',
        posts: [
            { title: 'Python Web', content: 'Django is great for rapid development.' }
        ]
    },
    {
        _id: '3',
        firstName: 'Charlie',
        lastName: 'Newbie',
        skills: ['HTML', 'CSS'],
        bio: 'Just starting my journey as a developer.',
        posts: []
    }
];

console.log('--- Profile Intelligence Matching Engine Test ---\n');

mockUsers.forEach(user => {
    const result = profileMatchingEngine.calculateMatchScore(user, mockTask);
    console.log(`User: ${result.name}`);
    console.log(`Overall Match: ${(result.matchScore * 100).toFixed(1)}%`);
    console.log(`- Ontology Score (Skills): ${(result.ontologyScore * 100).toFixed(1)}%`);
    console.log(`- Bio Semantic Score: ${(result.bioScore * 100).toFixed(1)}%`);
    console.log(`- Post Evidence Score: ${(result.postScore * 100).toFixed(1)}%`);
    console.log('------------------------------------------\n');
});
