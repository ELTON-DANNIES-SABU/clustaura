const fs = require('fs');
let code = fs.readFileSync('controllers/workplaceController.js', 'utf8');

const target = `            if (!isAlreadyMember) {
                project.members.push({
                    user: req.user._id,
                    role: project.invitations[invitationIndex].role || 'Member'
                });
            }`;

const injection = `            if (!isAlreadyMember) {
                project.members.push({
                    user: req.user._id,
                    role: project.invitations[invitationIndex].role || 'Member'
                });

                // GitHub Automation Injection
                if (project.repositoryUrl && project.githubAccessToken) {
                    const urlParts = project.repositoryUrl.replace(/\\/$/, '').split('/');
                    if (urlParts.length >= 2) {
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
                                    {
                                        headers: {
                                            'Authorization': \`Bearer \${project.githubAccessToken}\`,
                                            'Accept': 'application/vnd.github.v3+json',
                                            'X-GitHub-Api-Version': '2022-11-28'
                                        }
                                    }
                                );
                                console.log(\`[GitHub API] Auto-invited \${userProfile.github} to \${repoOwner}/\${repoName}\`);
                            } catch (githubErr) {
                                console.error('[GitHub API] Auto-invite failed:', githubErr.response?.data?.message || githubErr.message);
                            }
                        }
                    }
                }
            }`;

// Handle possible \r\n line endings by normalising first
code = code.replace(/\r\n/g, '\n');

if (code.includes(target)) {
    code = code.replace(target, injection);
    fs.writeFileSync('controllers/workplaceController.js', code);
    console.log('Successfully injected GitHub auto-invite!');
} else {
    console.log('Target block not found in workplaceController.js!');
}
