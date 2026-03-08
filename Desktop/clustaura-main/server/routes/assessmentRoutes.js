const express = require('express');
const router = express.Router();
const {
    createQuestion,
    createTest,
    getTests,
    startTest,
    submitAnswer,
    logViolation,
    finalizeAttempt,
    getTestAnalytics,
    deleteTest
} = require('../controllers/assessmentController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

router.post('/questions', createQuestion);
router.post('/tests', createTest);
router.get('/tests', getTests);
router.post('/tests/auto-generate', require('../controllers/assessmentController').autoGenerateTest);
router.get('/tests/:id', require('../controllers/assessmentController').getTestById);
router.get('/my-results', require('../controllers/assessmentController').getMyResults);
router.post('/tests/:id/start', startTest);
router.post('/attempts/:id/submit-answer', submitAnswer);
router.post('/attempts/:id/violation', logViolation);
router.post('/attempts/:id/finalize', finalizeAttempt);
router.get('/tests/:id/analytics', getTestAnalytics);
router.delete('/tests/:id', deleteTest);

module.exports = router;
