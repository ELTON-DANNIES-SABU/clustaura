const mongoose = require('mongoose');

const uri = 'mongodb://127.0.0.1:27017/clustaura';

console.log('--- STARTING TEST ---');
console.log(`Target URI: ${uri}`);

mongoose.connect(uri)
    .then(async conn => {
        console.log('Connected!');
        console.log(`DB Name: ${conn.connection.name}`);

        const collections = await conn.connection.db.listCollections().toArray();
        console.log('Collections in DB:', collections.map(c => c.name));

        console.log('--- FINISHED ---');
        process.exit(0);
    })
    .catch(err => {
        console.error('CONNECTION FAILED:', err);
        process.exit(1);
    });
