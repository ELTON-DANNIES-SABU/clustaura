const mongoose = require('mongoose');
require('dotenv').config();
const syncService = require('./services/syncService');
const connectDB = require('./config/db');

const runSync = async () => {
    try {
        await connectDB();
        console.log('✅ Connected to DB');

        // Give it a moment
        setTimeout(async () => {
            await syncService.syncUsersToAI();
            console.log('✅ Manual Sync Complete');
            process.exit(0);
        }, 1000);
    } catch (error) {
        console.error('❌ Sync Failed', error);
        process.exit(1);
    }
};

runSync();
