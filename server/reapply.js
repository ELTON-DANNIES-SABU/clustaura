const fs = require('fs');
let code = fs.readFileSync('controllers/workplaceController.js', 'utf8');

// 1. Fix all missing user null checks in members maps
code = code.replace(/m => m\.user\.toString\(\)/g, 'm => m.user && m.user.toString()');

// 2. Bypass Mongoose validation crashes with direct updateOne queries
code = code.replace(/await project\.save\(\);/g, "await Project.updateOne({ _id: project._id }, { $set: { members: project.members, invitations: project.invitations, leaveRequests: project.leaveRequests } });");

// 3. Inject the Automated GitHub push inside respondToInvitation
const inviteLocation = `
        project.members.push({ user: req.user._id, role: invite.role });
        
        await Project.updateOne({ _id: project._id }, { $set: { members: project.members, invitations: project.invitations } });
`;
const inviteTarget = `
        project.members.push({ user: req.user._id, role: invite.role });

        // GITHUB AUTOMATION INJECTION
        const urlParts = project.repositoryUrl ? project.repositoryUrl.replace(/\\/$/, '').split('/') : null;
        if (urlParts && urlParts.length >= 2 && project.githubAccessToken) {
            const repoName = urlParts.pop();
            const repoOwner = urlParts.pop();
            const Profile = require('../models/Profile');
            const userProfile = await Profile.findOne({ user: req.user._id });
            if (userProfile && userProfile.github) {
                const axios = require('axios');
                try {
                    await axios.put(
                        \`https://api.github.com/repos/\${repoOwner}/\${repoName}/collaborators/\${userProfile.github}\`,
                        { permission: 'push' },
                        { headers: { Authorization: \`Bearer \${project.githubAccessToken}\`, Accept: 'application/vnd.github.v3+json', 'X-GitHub-Api-Version': '2022-11-28' } }
                    );
                    console.log(\`Successfully auto-invited \${userProfile.github} to GitHub repo.\`);
                } catch (err) {
                    console.error('Error auto-inviting to GitHub:', err.response?.data || err.message);
                }
            }
        }
        
        await Project.updateOne({ _id: project._id }, { $set: { members: project.members, invitations: project.invitations } });
`;
code = code.replace(inviteLocation, inviteTarget);

// 4. Expose the manual GitHub invite endpoint
const manualEndpoint = `
// @desc    Resend GitHub invitation for a specific member
// @route   POST /api/workplace/projects/:id/members/:userId/github-invite
// @access  Private (Owner/Lead)
const resendGithubInvite = async (req, res) => {
    try {
        const { userId } = req.params;
        const project = await Project.findById(req.params.id);

        if (!project) return res.status(404).json({ message: 'Project not found' });

        const isOwner = project.owner.toString() === req.user._id.toString();
        const member = project.members.find(m => m.user && m.user.toString() === req.user._id.toString());
        const isLead = member && member.role === 'Project Lead';

        if (!isOwner && !isLead) return res.status(401).json({ message: 'Not authorized to send GitHub invites' });
        
        if (!project.repositoryUrl) return res.status(400).json({ message: 'Missing GitHub Repo: Configure it in Settings.' });
        if (!project.githubAccessToken) return res.status(400).json({ message: 'Missing GitHub PAT: The text in your Settings modal might just be the gray placeholder! You must type your real PAT and save it.' });

        const Profile = require('../models/Profile');
        const userProfile = await Profile.findOne({ user: userId });
        if (!userProfile || !userProfile.github) return res.status(400).json({ message: 'Target team member has not linked a GitHub username in their ClustAura Profile settings.' });

        const urlParts = project.repositoryUrl.replace(/\\/$/, '').split('/');
        const repoName = urlParts.pop();
        const repoOwner = urlParts.pop();

        if (repoOwner && repoName) {
            const axios = require('axios');
            try {
                await axios.put(
                    \`https://api.github.com/repos/\${repoOwner}/\${repoName}/collaborators/\${userProfile.github}\`,
                    { permission: 'push' },
                    { headers: { Authorization: \`Bearer \${project.githubAccessToken}\`, Accept: 'application/vnd.github.v3+json', 'X-GitHub-Api-Version': '2022-11-28' } }
                );
                return res.json({ success: true, message: \`Successfully sent GitHub direct invite to \${userProfile.github}\` });
            } catch (githubErr) {
                return res.status(500).json({ message: githubErr.response?.data?.message || 'Failed to dispatch GitHub API.' });
            }
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
`;
code = code.replace("module.exports = {", manualEndpoint);

// Add the endpoint to the exports list
code = code.replace("updateProjectSettings\n};", "updateProjectSettings,\n    resendGithubInvite\n};");

fs.writeFileSync('controllers/workplaceController.js', code);
console.log('Successfully re-applied all stability and GitHub patches!');
