const express = require('express');
const router = express.Router();
const {
    createProject,
    getProjects,
    getProjectById,
    createIssue,
    getProjectIssues,
    updateIssueStatus,
    createSprint,
    getProjectSprints,
    moveIssue,
    updateSprintStatus,
    addProjectMember,
    respondToInvitation,
    leaveProject,
    removeProjectMember,
    getProjectLeaveRequests,
    respondToLeaveRequest,
    getPendingInvitations,
    updateMemberRole
} = require('../controllers/workplaceController');
const { protect } = require('../middleware/authMiddleware');

// Project Routes
router.post('/projects', protect, createProject);
router.get('/projects', protect, getProjects);
router.get('/projects/:id', protect, getProjectById);
router.get('/projects/:id/leave-requests', protect, getProjectLeaveRequests);
router.post('/projects/:id/leave-requests/:userId/respond', protect, respondToLeaveRequest);
router.post('/projects/:id/invitations/respond', protect, respondToInvitation);
router.get('/invitations', protect, getPendingInvitations);

// Issue Routes
router.post('/issues', protect, createIssue);
router.get('/projects/:id/issues', protect, getProjectIssues);
router.put('/issues/:id/status', protect, updateIssueStatus);
router.put('/issues/:id/move', protect, moveIssue);

// Sprint Routes
router.post('/projects/:id/sprints', protect, createSprint);
router.post('/sprints', protect, createSprint); // Keep original if needed by other features
router.get('/projects/:id/sprints', protect, getProjectSprints);
router.put('/sprints/:id/status', protect, updateSprintStatus);
router.post('/projects/:id/members', protect, addProjectMember);
router.delete('/projects/:id/leave', protect, leaveProject);
router.delete('/projects/:id/members/:userId', protect, removeProjectMember);
router.put('/projects/:id/members/:userId/role', protect, updateMemberRole);

module.exports = router;
