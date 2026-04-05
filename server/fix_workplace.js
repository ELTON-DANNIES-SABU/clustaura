const fs = require('fs');

const code = fs.readFileSync('controllers/workplaceController.js', 'utf8');
const lines = code.split('\n');
const endOfUpdateSettings = lines.findIndex(l => l.includes('// @desc    Resend GitHub invitation for a specific member'));

let cleanLines = lines.slice(0, endOfUpdateSettings);
if (cleanLines[cleanLines.length - 1] === '') {
    cleanLines.pop();
}

const finalCode = cleanLines.join('\n') + `

// @desc    Resend GitHub invitation for a specific member
// @route   POST /api/workplace/projects/:id/members/:userId/github-invite
// @access  Private (Owner/Lead)
const resendGithubInvite = async (req, res) => {
    try {
        const { userId } = req.params;
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const isOwner = project.owner.toString() === req.user._id.toString();
        const member = project.members.find(m => m.user && m.user.toString() === req.user._id.toString());
        const isLead = member && member.role === 'Project Lead';

        if (!isOwner && !isLead) {
            return res.status(401).json({ message: 'Not authorized to send GitHub invites' });
        }

        if (!project.repositoryUrl) {
            return res.status(400).json({ message: 'Project Settings missing: Please configure the GitHub Repository URL in Settings first.' });
        }

        if (!project.githubAccessToken) {
            return res.status(400).json({ message: 'Missing GitHub PAT: The text in your Settings modal might just be the gray placeholder! You must type your real PAT and save it.' });
        }

        const Profile = require('../models/Profile');
        const userProfile = await Profile.findOne({ user: userId });

        if (!userProfile || !userProfile.github) {
            return res.status(400).json({ message: 'Target team member has not linked a GitHub username in their ClustAura Profile settings.' });
        }

        const urlParts = project.repositoryUrl.replace(/\\/$/, '').split('/');
        const repoName = urlParts.pop();
        const repoOwner = urlParts.pop();

        if (repoOwner && repoName) {
            const axios = require('axios');
            try {
                await axios.put(
                    \`https://api.github.com/repos/\${repoOwner}/\${repoName}/collaborators/\${userProfile.github}\`,
                    { permission: 'push' },
                    {
                        headers: {
                            'Authorization': \`Bearer \${project.githubAccessToken}\`,
                            'Accept': 'application/vnd.github.v3+json',
                            'X-GitHub-Api-Version': '2022-11-28'
                        }
                    }
                );
                return res.json({ success: true, message: \`Successfully sent GitHub direct invite to \${userProfile.github}\` });
            } catch (githubErr) {
                console.error('Error auto-inviting to GitHub repository:', githubErr.response?.data || githubErr.message);
                return res.status(500).json({ message: githubErr.response?.data?.message || 'Failed to dispatch GitHub API.' });
            }
        } else {
            return res.status(400).json({ message: 'Invalid repository structure.' });
        }

    } catch (error) {
        console.error('Error syncing GitHub:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
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
    updateMemberRole,
    updateProjectSettings,
    resendGithubInvite
};
`;

fs.writeFileSync('controllers/workplaceController.js', finalCode);
console.log('Fixed workplaceController.js');
