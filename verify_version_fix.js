const mongoose = require('mongoose');
const Attempt = require('./server/models/Attempt');
const Question = require('./server/models/Question');
const dotenv = require('dotenv');

dotenv.config({ path: './server/.env' });

async function verifyVersionFix() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Create a dummy attempt
    const attempt = await Attempt.create({
        testId: new mongoose.Types.ObjectId(),
        candidateId: new mongoose.Types.ObjectId(),
        status: 'In-Progress',
        answers: []
    });

    console.log("Created Attempt:", attempt._id);

    const questionId = new mongoose.Types.ObjectId();

    // Simulate concurrent updates
    console.log("Simulating concurrent updates...");
    
    const update1 = {
        questionId: questionId,
        codeResponse: { code: 'console.log("First")', language: 'javascript' }
    };

    const update2 = {
        questionId: questionId,
        codeResponse: { code: 'console.log("Second")', language: 'javascript' }
    };

    // We use the new logic: findOneAndUpdate
    const p1 = Attempt.findOneAndUpdate(
        { _id: attempt._id, status: 'In-Progress' },
        { $push: { answers: update1 } },
        { new: true }
    );

    const p2 = Attempt.findOneAndUpdate(
        { _id: attempt._id, status: 'In-Progress' },
        { $push: { answers: update2 } },
        { new: true }
    );

    try {
        const [res1, res2] = await Promise.all([p1, p2]);
        console.log("Concurrent updates successful!");
        console.log("Answers length:", res2.answers.length);
    } catch (err) {
        console.error("Concurrent updates failed:", err.message);
    }

    // Cleanup
    await Attempt.findByIdAndDelete(attempt._id);
    await mongoose.connection.close();
}

verifyVersionFix().catch(console.error);
