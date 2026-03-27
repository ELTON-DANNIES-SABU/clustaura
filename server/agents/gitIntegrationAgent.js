const Ticket = require('../models/Ticket');
const Project = require('../models/Project');
const ActivityLog = require('../models/ActivityLog');
const ApprovalRequest = require('../models/ApprovalRequest');
const User = require('../models/User');

const extractTicketCodes = (message) => {
    // Matches #PROJECT-123
    const regex = /#([A-Z]+-\d+)/g;
    const matches = [...message.matchAll(regex)];
    return [...new Set(matches.map(m => m[1]))];
};

// Security Check: verify commit author matches project member
const verifyCommitAuthor = async (email, projectId) => {
    if (!email) return null;
    const user = await User.findOne({ email });
    if (!user) return null;

    const project = await Project.findById(projectId);
    if (!project) return null;

    const isMember = project.members.some(m => m.user.toString() === user._id.toString());
    return isMember ? user._id : null;
};

// Simulate AI Decision Engine Confidence
const getAIConfidenceScore = () => {
    // In a real system, this would call an LLM or ML model.
    // For now, return a random score between 0.5 and 1.0 to simulate it.
    return (Math.random() * 0.5) + 0.5;
};

const processPushEvent = async (payload, io, projectId) => {
    const commits = payload.commits || [];
    if (commits.length === 0) return;

    for (const commit of commits) {
        const message = commit.message;
        const hash = commit.id;
        const timestamp = new Date(commit.timestamp);
        const authorEmail = commit.author?.email;

        const authorUserId = await verifyCommitAuthor(authorEmail, projectId);
        if (!authorUserId) {
            console.log(`[Security] Ignoring commit ${hash}: Author ${authorEmail} is not a valid project member.`);
            continue;
        }

        const ticketCodes = extractTicketCodes(message);

        for (const code of ticketCodes) {
            let ticket = await Ticket.findOne({ project: projectId, ticketCode: code });
            if (!ticket) continue;

            let progress = ticket.progressPercentage || 0;
            let proposedStatus = ticket.status;

            if (progress < 20) {
                progress = 20; 
                proposedStatus = 'In Progress';
            } else if (progress < 100) {
                progress = Math.min(progress + 10, 99);
            }

            const confidenceScore = getAIConfidenceScore();
            
            // Auto-approved updates rule: first commit or minor progress
            // Still requires confidence > 0.8
            if (confidenceScore > 0.8) {
                // Auto Apply Update
                ticket.progressPercentage = progress;
                ticket.status = proposedStatus;

                const commitExists = ticket.commits.find(c => c.hash === hash);
                if (!commitExists) {
                    ticket.commits.push({ hash, message, timestamp });
                }
                await ticket.save();

                await ActivityLog.create({
                    ticket: ticket._id,
                    action: `Commit pushed: ${message.substring(0, 50)}...`,
                    performedBy: authorUserId,
                    source: 'user'
                });

                if (io) {
                    io.emit('ticketProgressUpdated', { 
                        ticketId: ticket._id, 
                        progress: ticket.progressPercentage, 
                        status: ticket.status,
                        commits: ticket.commits 
                    });
                }
            } else {
                // Send for Approval
                await ApprovalRequest.create({
                    ticket: ticket._id,
                    project: projectId,
                    proposedStatus: proposedStatus,
                    proposedProgress: progress,
                    triggeredBy: 'system',
                    status: 'pending',
                    originalCommitMessage: message
                });

                if (io) {
                    io.emit('approvalRequested', { ticketId: ticket._id, projectId });
                }
            }
        }
    }
};

const processPullRequestEvent = async (payload, io, projectId) => {
    const pr = payload.pull_request;
    const action = payload.action;
    const title = pr.title;
    const body = pr.body || '';

    const authorEmail = pr.user?.email || payload.sender?.email; // PR sender
    const authorUserId = await verifyCommitAuthor(authorEmail, projectId);

    const ticketCodes = [...new Set([...extractTicketCodes(title), ...extractTicketCodes(body)])];

    for (const code of ticketCodes) {
        let ticket = await Ticket.findOne({ project: projectId, ticketCode: code });
        if (!ticket) continue;

        let proposedStatus = ticket.status;
        let proposedProgress = ticket.progressPercentage || 0;
        let originalMessage = action;

        if (action === 'opened' || action === 'reopened') {
            if (proposedProgress < 50) proposedProgress = 50;
            proposedStatus = 'Testing';
            originalMessage = `Pull Request opened: ${title}`;
        } else if (action === 'closed' && pr.merged) {
            proposedProgress = 100;
            proposedStatus = 'Completed';
            originalMessage = `Pull Request merged: ${title}`;
        } else if (action === 'submitted') {
             const reviewState = payload.review?.state;
             if (reviewState === 'approved' && proposedProgress < 80) {
                 proposedProgress = 80;
                 originalMessage = `Pull Request approved: ${title}`;
             } else {
                 continue; // Nothing to do
             }
        } else {
            continue; // Not an action we care about
        }

        // PR actions are ALWAYS Approval-required updates based on rules
        const confidenceScore = getAIConfidenceScore();

        // Moving to Testing, Completed, PR merge actions -> ALWAYS require approval
        const requiresApproval = true;

        if (!requiresApproval && confidenceScore > 0.8) {
             // Not hit due to rules, but kept for logical completeness
             ticket.progressPercentage = proposedProgress;
             ticket.status = proposedStatus;
             await ticket.save();

             await ActivityLog.create({
                 ticket: ticket._id,
                 action: originalMessage,
                 performedBy: authorUserId || null,
                 source: authorUserId ? 'user' : 'system'
             });

             if (io) {
                 io.emit('ticketProgressUpdated', { 
                     ticketId: ticket._id, 
                     progress: ticket.progressPercentage, 
                     status: ticket.status,
                     commits: ticket.commits 
                 });
             }
        } else {
            // Send for Approval
            await ApprovalRequest.create({
                ticket: ticket._id,
                project: projectId,
                proposedStatus: proposedStatus,
                proposedProgress: proposedProgress,
                triggeredBy: 'system',
                status: 'pending',
                originalCommitMessage: originalMessage
            });

            if (io) {
                io.emit('approvalRequested', { ticketId: ticket._id, projectId });
            }
        }
    }
};

module.exports = {
    extractTicketCodes,
    processPushEvent,
    processPullRequestEvent
};
