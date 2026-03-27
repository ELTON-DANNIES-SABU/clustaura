const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
    getApprovals, 
    approveRequest, 
    rejectRequest, 
    overrideTicket 
} = require('../controllers/approvalController');

// All routes require authentication
router.use(protect);

router.get('/:projectId', getApprovals);
router.post('/approve/:id', approveRequest);
router.post('/reject/:id', rejectRequest);
router.post('/override/:ticketId', overrideTicket);

module.exports = router;
