const creditService = require('../services/creditService');

// @desc    Get current user's credit stats
// @route   GET /api/credits/me
// @access  Private
const getMyCredits = async (req, res) => {
    try {
        const stats = await creditService.getUserCreditStats(req.user._id);
        res.json(stats);
    } catch (error) {
        console.error('Error fetching credits:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get specific user's public stars
// @route   GET /api/credits/:userId/stars
// @access  Public
const getUserStars = async (req, res) => {
    try {
        const stats = await creditService.getUserCreditStats(req.params.userId);
        if (!stats) return res.status(404).json({ message: 'User not found' });
        res.json({
            stars: stats.creditStars,
            tier: stats.starTier
        });
    } catch (error) {
        console.error('Error fetching stars:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Endorse a collaborator
// @route   POST /api/projects/endorse
// @access  Private
const endorseUser = async (req, res) => {
    try {
        const { projectId, collaboratorId, amount } = req.body;

        // In a real app we'd verify project ownership here
        // const project = await Project.findById(projectId);
        // if (project.owner.toString() !== req.user.id) ...

        await creditService.endorseCollaborator(req.user.id, collaboratorId, projectId, amount);
        res.status(200).json({ message: 'Endorsement successful' });
    } catch (error) {
        console.error('Error endorsing user:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Calculate theoretical payoff (Simulation)
// @route   POST /api/credits/calculate
// @access  Private
const calculatePayoffSimulator = async (req, res) => {
    try {
        const payoff = creditService.calculatePayoff(req.body);
        res.json({ calculatedCredits: payoff });
    } catch (error) {
        console.error('Error calculating payoff:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get project impact stats
// @route   GET /api/projects/:id/impact
// @access  Public
const getProjectImpact = async (req, res) => {
    try {
        // Placeholder: In a real app, this would aggregate likes/comments/shares
        res.json({
            impactScore: 100,
            engagement: 'High',
            communityReach: 500
        });
    } catch (error) {
        console.error('Error fetching impact:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getMyCredits,
    getUserStars,
    endorseUser,
    calculatePayoffSimulator,
    getProjectImpact
};
