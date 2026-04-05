const Test = require('../models/Test');
const Question = require('../models/Question');
const Attempt = require('../models/Attempt');
const User = require('../models/User');
const aiService = require('../services/aiService');
const codeExecutionService = require('../services/CodeExecutionService');

// @desc    Create a new question
// @route   POST /api/assessment/questions
// @access  Private (Creator/Admin)
exports.createQuestion = async (req, res) => {
    try {
        const question = await Question.create({
            ...req.body,
            author: req.user.id
        });
        res.status(201).json({ success: true, data: question });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Create a new test
// @route   POST /api/assessment/tests
// @access  Private (Creator/Admin)
exports.createTest = async (req, res) => {
    try {
        const { title, description, duration, passMarks, sections, totalMarks, rules, invitedUsers } = req.body;
        const test = await Test.create({
            title,
            description,
            duration,
            passMarks,
            sections,
            totalMarks,
            rules,
            invitedUsers,
            creator: req.user.id
        });
        res.status(201).json({ success: true, data: test });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Get all tests
// @route   GET /api/assessment/tests
// @access  Private
exports.getTests = async (req, res) => {
    try {
        const tests = await Test.find({
            $or: [
                { creator: req.user.id },
                { invitedUsers: req.user.id }
            ]
        }).populate('creator', 'firstName lastName');

        // Identify tests already completed by this user
        const completedAttempts = await Attempt.find({
            candidateId: req.user.id,
            status: { $in: ['Submitted', 'Evaluated'] }
        });

        const completedTestIds = completedAttempts.map(a => a.testId.toString());

        // Filter: Keep test if user is creator OR user has NOT completed it
        const filteredTests = tests.filter(test => {
            const isCreator = test.creator._id.toString() === req.user.id.toString() ||
                test.creator.toString() === req.user.id.toString();
            const isCompleted = completedTestIds.includes(test._id.toString());

            return isCreator || !isCompleted;
        });

        res.status(200).json({ success: true, data: filteredTests });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Helper to shuffle an array
const shuffleArray = (array) => {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
};

// @desc    Start technical test attempt
// @route   POST /api/assessment/tests/:id/start
// @access  Private
exports.startTest = async (req, res) => {
    try {
        const test = await Test.findById(req.params.id);
        if (!test) return res.status(404).json({ message: 'Test not found' });

        // Check if already submitted (completed)
        const completedAttempt = await Attempt.findOne({
            testId: test._id,
            candidateId: req.user.id,
            status: { $in: ['Submitted', 'Evaluated'] }
        });

        if (completedAttempt) {
            return res.status(400).json({ message: 'You have already completed this assessment' });
        }

        // Check for in-progress attempt
        const existingAttempt = await Attempt.findOne({
            testId: test._id,
            candidateId: req.user.id,
            status: 'In-Progress'
        });

        if (existingAttempt) {
            return res.status(200).json({ success: true, data: existingAttempt });
        }

        // Create flattened shuffled order if enabled
        let questionOrder = [];
        try {
            test.sections.forEach(section => {
                if (section.questions && section.questions.length > 0) {
                    let sectionQs = [...section.questions];
                    if (test.rules?.shuffleQuestions) {
                        sectionQs = shuffleArray(sectionQs);
                    }
                    questionOrder.push(...sectionQs);
                }
            });
        } catch (err) {
            console.error("Shuffle algorithm error:", err);
            // Fallback: Use questions in original order if they exist
            test.sections.forEach(s => {
                if (s.questions) questionOrder.push(...s.questions);
            });
        }

        const attempt = await Attempt.create({
            testId: test._id,
            candidateId: req.user.id,
            status: 'In-Progress',
            shuffledOrder: questionOrder
        });

        res.status(201).json({ success: true, data: attempt });
    } catch (error) {
        console.error("StartTest Error:", error);
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Submit question answer
// @route   POST /api/assessment/attempts/:id/submit-answer
// @access  Private
exports.submitAnswer = async (req, res) => {
    try {
        const { questionId, selectedOptions, textResponse, codeResponse } = req.body;
        
        const answerData = {
            questionId,
            selectedOptions: selectedOptions || [],
            textResponse,
            codeResponse: typeof codeResponse === 'string' ? { code: codeResponse } : codeResponse
        };

        // Attempt atomic update if answer exists
        let attempt = await Attempt.findOneAndUpdate(
            { _id: req.params.id, status: 'In-Progress', "answers.questionId": questionId },
            { $set: { "answers.$": answerData } },
            { new: true }
        );

        // If not found (either attempt missing, not in progress, or answer doesn't exist yet)
        if (!attempt) {
            attempt = await Attempt.findOneAndUpdate(
                { _id: req.params.id, status: 'In-Progress' },
                { $push: { answers: answerData } },
                { new: true }
            );
        }

        if (!attempt) return res.status(404).json({ message: 'Attempt not found or already submitted' });

        // Refetch attempt to handle order consistency in response if needed
        res.status(200).json({ success: true, data: attempt });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Finalize test attempt and calculate score (Auto-grading)
// @route   POST /api/assessment/attempts/:id/finalize
// @access  Private
exports.finalizeAttempt = async (req, res) => {
    try {
        const attempt = await Attempt.findById(req.params.id).populate('testId');
        if (!attempt) return res.status(404).json({ message: 'Attempt not found' });
        if (attempt.status !== 'In-Progress') return res.status(400).json({ message: 'Already submitted' });

        const test = attempt.testId;
        const allQuestions = await Question.find({
            _id: { $in: test.sections.reduce((acc, s) => [...acc, ...s.questions], []) }
        });

        let totalScore = 0;

        // Automated Scoring
        for (const answer of attempt.answers) {
            const question = allQuestions.find(q => q._id.toString() === answer.questionId.toString());
            if (!question) continue;

            try {
                if (question.type === 'MCQ') {
                    const correctIndices = question.options
                        .map((opt, idx) => opt.isCorrect ? idx : null)
                        .filter(idx => idx !== null);

                    const isCorrect = correctIndices.length === answer.selectedOptions.length &&
                        correctIndices.every(idx => answer.selectedOptions.includes(idx));

                    if (isCorrect) {
                        answer.marksObtained = question.marks || 1;
                        totalScore += answer.marksObtained;
                    }
                    answer.isEvaluated = true;
                } else if (question.type === 'Coding') {
                    const codeData = answer.codeResponse || {};
                    const code = codeData.code || '';
                    const language = codeData.language || 'javascript';
                    const testCases = question.codingConfig.testCases;

                    if (testCases && testCases.length > 0 && code) {
                        const results = await codeExecutionService.execute(language, code, testCases);
                        const passCount = results.filter(r => r.status === 'PASS').length;
                        
                        const score = (passCount / testCases.length) * (question.marks || 5);
                        answer.marksObtained = Math.round(score * 100) / 100;
                        answer.testResults = results;
                        totalScore += answer.marksObtained;
                    }
                    answer.isEvaluated = true;
                }
            } catch (err) {
                console.error(`Scoring error for question ${question._id}:`, err);
                answer.feedback = "System failed to evaluate this response automatically.";
            }
        }

        attempt.totalScore = totalScore;
        attempt.status = 'Submitted';
        attempt.endTime = new Date();

        await attempt.save();

        res.status(200).json({
            success: true,
            data: {
                totalScore: attempt.totalScore,
                testTotalMarks: test.totalMarks,
                passMarks: test.passMarks,
                status: attempt.status,
                answers: attempt.answers
            }
        });
    } catch (error) {
        console.error("Finalize Error:", error);
        res.status(500).json({ success: false, message: "Server error during submission. Please contact support." });
    }
};

// @desc    Run candidate code against test cases
// @route   POST /api/assessment/attempts/:id/run-code
// @access  Private
exports.runCode = async (req, res) => {
    try {
        const { questionId, code, language } = req.body;
        
        const question = await Question.findById(questionId);
        if (!question) return res.status(404).json({ message: 'Question not found' });

        // Run ALL test cases internal and visible
        const allTestCases = question.codingConfig.testCases;
        const rawResults = await codeExecutionService.execute(language, code, allTestCases);

        // Mask hidden test cases in the response for the candidate
        const maskedResults = rawResults.map((result, index) => {
            const isVisible = allTestCases[index].isVisible;
            if (isVisible) return result;
            
            // Mask hidden case data
            return {
                status: result.status,
                error: result.error,
                isVisible: false,
                caseIndex: index + 1
            };
        });

        const answerData = {
            questionId,
            codeResponse: { code, language },
            testResults: maskedResults,
            selectedOptions: []
        };

        // Atomic update for attempt (temporary storage of results)
        let attempt = await Attempt.findOneAndUpdate(
            { _id: req.params.id, status: 'In-Progress', "answers.questionId": questionId },
            { $set: { "answers.$": answerData } },
            { new: true }
        );

        if (!attempt) {
            attempt = await Attempt.findOneAndUpdate(
                { _id: req.params.id, status: 'In-Progress' },
                { $push: { answers: answerData } },
                { new: true }
            );
        }

        res.status(200).json({ success: true, data: maskedResults });
    } catch (error) {
        console.error("RunCode Error:", error);
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Log a violation
// @route   POST /api/assessment/attempts/:id/violation
// @access  Private
exports.logViolation = async (req, res) => {
    try {
        const { type } = req.body;
        const attempt = await Attempt.findById(req.params.id);

        if (!attempt) return res.status(404).json({ message: 'Attempt not found' });

        attempt.violations.push({ type });
        await attempt.save();

        res.status(200).json({ success: true, message: 'Violation logged' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Get user results
// @route   GET /api/assessment/my-results
// @access  Private
exports.getMyResults = async (req, res) => {
    try {
        const attempts = await Attempt.find({ candidateId: req.user.id })
            .populate('testId', 'title totalMarks duration')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: attempts });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Get test by ID
// @route   GET /api/assessment/tests/:id
// @access  Private
exports.getTestById = async (req, res) => {
    try {
        const test = await Test.findById(req.params.id)
            .populate('sections.questions');
        if (!test) return res.status(404).json({ message: 'Test not found' });
        res.status(200).json({ success: true, data: test });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Auto-generate a test based on requirements
// @desc    Auto-generate a test based on requirements (AI Powered)
// @route   POST /api/assessment/tests/auto-generate
// @access  Private
exports.autoGenerateTest = async (req, res) => {
    try {
        const { title, description, duration, requirements, rules, passMarks } = req.body;

        // 1. Generate Questions via AI
        const generatedQuestions = await aiService.generateQuestionsAI(requirements);

        // 2. Save generated questions to DB and group by category into sections
        let sections = [];
        let totalMarks = 0;

        // Grouping logic for sections
        const grouped = generatedQuestions.reduce((acc, q) => {
            if (!acc[q.category]) acc[q.category] = [];
            acc[q.category].push(q);
            return acc;
        }, {});

        for (const category in grouped) {
            const qs = grouped[category];
            const savedQs = await Question.insertMany(qs.map(q => ({
                ...q,
                author: req.user.id
            })));

            sections.push({
                title: category,
                questions: savedQs.map(q => q._id)
            });

            totalMarks += savedQs.reduce((sum, q) => sum + (q.marks || 0), 0);
        }

        const test = await Test.create({
            title,
            description,
            duration,
            totalMarks,
            passMarks: passMarks || Math.ceil(totalMarks * 0.4),
            creator: req.user.id,
            rules: rules || {
                shuffleQuestions: true,
                fullScreenEnforcement: true,
                tabSwitchDetection: true
            },
            sections,
            invitedUsers: req.body.invitedUsers || []
        });

        res.status(201).json({
            success: true,
            data: test
        });
    } catch (error) {
        console.error("AutoGenerate Error:", error);
        res.status(400).json({ success: false, message: error.message });
    }
};
// @desc    Get test analytics (for creator)
// @route   GET /api/assessment/tests/:id/analytics
// @access  Private (Creator only)
exports.getTestAnalytics = async (req, res) => {
    try {
        const test = await Test.findById(req.params.id).populate('invitedUsers', 'firstName lastName email profilePicture');
        if (!test) return res.status(404).json({ message: 'Test not found' });

        if (test.creator.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'Unauthorized access to analytics' });
        }

        const attempts = await Attempt.find({ testId: test._id }).populate('candidateId', 'firstName lastName email profilePicture');

        const attendees = attempts.map(attempt => ({
            userId: attempt.candidateId._id,
            name: `${attempt.candidateId.firstName} ${attempt.candidateId.lastName}`,
            email: attempt.candidateId.email,
            profilePicture: attempt.candidateId.profilePicture,
            score: attempt.totalScore,
            maxScore: test.totalMarks,
            status: attempt.status,
            submittedAt: attempt.endTime || attempt.updatedAt,
            violations: attempt.violations.length
        }));

        const attendeeIds = attendees.map(a => a.userId.toString());
        const nonAttendees = test.invitedUsers.filter(user => !attendeeIds.includes(user._id.toString())).map(user => ({
            userId: user._id,
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            profilePicture: user.profilePicture
        }));

        res.status(200).json({
            success: true,
            data: {
                testTitle: test.title,
                stats: {
                    totalInvited: test.invitedUsers.length,
                    totalAttended: attendees.length,
                    averageScore: attendees.length > 0 ? (attendees.reduce((s, a) => s + a.score, 0) / attendees.length).toFixed(2) : 0
                },
                attendees,
                nonAttendees
            }
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
// @desc    Delete a test
// @route   DELETE /api/assessment/tests/:id
// @access  Private
exports.deleteTest = async (req, res) => {
    try {
        const test = await Test.findById(req.params.id);
        if (!test) return res.status(404).json({ message: 'Test not found' });

        // Authorization check: Only creator can delete
        if (test.creator.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'Only the creator can delete this test' });
        }

        // Delete associated attempts first
        await Attempt.deleteMany({ testId: test._id });

        // Delete the test itself
        await Test.findByIdAndDelete(test._id);

        res.status(200).json({ success: true, message: 'Test deleted successfully' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
