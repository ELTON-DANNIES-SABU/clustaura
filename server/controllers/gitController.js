const Project = require('../models/Project');
const { processPushEvent, processPullRequestEvent } = require('../agents/gitIntegrationAgent');

// @desc    Handle incoming Git webhooks
// @route   POST /api/git/webhook
// @access  Public (should use secret validation in production)
const handleWebhook = async (req, res) => {
    try {
        const payload = req.body;
        const io = req.app.get('io');

        // Identify the project from webhook URL or payload.
        // Easiest is to lookup by repositoryUrl.
        // For simplicity, let's look at the payload repository URL.
        const repoUrl = payload.repository?.url || payload.repository?.html_url;

        if (!repoUrl) {
            return res.status(400).json({ message: 'No repository URL in payload' });
        }

        // Find Project matching this URL
        // In a real scenario, you'd match branch too, but let's assume 1-1 repo to project mapping for now.
        const project = await Project.findOne({ repositoryUrl: { $regex: new RegExp(repoUrl, 'i') } });

        if (!project) {
            return res.status(404).json({ message: 'No project associated with this repository' });
        }

        // Determine event type
        // GitHub sends event type in headers: x-github-event
        const event = req.headers['x-github-event'] || req.headers['x-event-key'];

        if (event === 'push') {
            await processPushEvent(payload, io, project._id);
        } else if (event === 'pull_request') {
            await processPullRequestEvent(payload, io, project._id);
        }

        res.status(200).json({ success: true, message: 'Webhook processed' });
    } catch (error) {
        console.error('Webhook Error:', error);
        res.status(500).json({ message: 'Error processing webhook' });
    }
};

module.exports = {
    handleWebhook
};
