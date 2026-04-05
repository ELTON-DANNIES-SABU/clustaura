const Project = require('../models/Project');
const Ticket = require('../models/Ticket');
const Issue = require('../models/Issue');
const Sprint = require('../models/Sprint');
const ActivityLog = require('../models/ActivityLog');

// Helper to check if user has approval rights (Lead or Owner)
const hasApprovalRights = async (projectId, userId) => {
    const project = await Project.findById(projectId);
    if (!project) return false;
    
    // Check if owner
    if (project.owner.toString() === userId.toString()) return true;

    // Check member role
    const member = project.members.find(m => m.user.toString() === userId.toString());
    if (member && (member.role === 'owner' || member.role === 'lead' || member.role.toLowerCase().includes('lead'))) {
        return true;
    }
    return false;
};

// Helper to get status distribution for a set of tickets
const getStatusDistribution = (tickets) => {
    const statuses = ['To Do', 'In Progress', 'Testing', 'Completed'];
    return statuses.map(status => ({
        name: status,
        value: tickets.filter(t => t.status === status).length
    }));
};

// @desc    Get comprehensive analytics for a project
// @route   GET /api/analytics/project/:projectId/members
// @access  Private
const getProjectMemberAnalytics = async (req, res) => {
    try {
        const { projectId } = req.params;
        
        const canView = await hasApprovalRights(projectId, req.user._id);
        if (!canView) {
            return res.status(403).json({ message: 'Must be a Project Lead or Owner to view analytics.' });
        }

        const project = await Project.findById(projectId).populate('members.user', 'firstName lastName email avatar role');
        if (!project) return res.status(404).json({ message: 'Project not found' });

        // Fetch both Ticket and Issue models to ensure full board coverage across all sprints
        const [tickets, issues] = await Promise.all([
            Ticket.find({ project: projectId }),
            Issue.find({ project: projectId })
        ]);

        // Normalize work items from both sources for unified metric calculation
        const allWorkItems = [
            ...tickets.map(t => ({ 
                ...t.toObject(), 
                assigneeId: t.assignedUser?.toString(),
            })),
            ...issues.map(i => ({ 
                ...i.toObject(), 
                assigneeId: (i.assignee?._id || i.assignee)?.toString(),
            }))
        ];
        
        let totalMembers = project.members?.length || 0;
        let totalTaskCompletionPercentage = 0;

        const membersList = project.members.map(memberObj => {
            const user = memberObj.user;
            if (!user) return null;

            const userId = user._id.toString();

            // Find work items assigned to this user from any source
            const userWorkItems = allWorkItems.filter(item => item.assigneeId === userId);
            
            const totalTasks = userWorkItems.length;
            const activeTasks = userWorkItems.filter(t => t.status === 'To Do' || t.status === 'In Progress').length;
            const completedTasks = userWorkItems.filter(t => t.status === 'Completed' || t.status === 'Done').length;
            
            // Count of tickets in 'Testing' status (for "Tickets Pushed")
            const ticketsPushed = userWorkItems.filter(t => t.status === 'Testing').length;

            const completionPercentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
            
            totalTaskCompletionPercentage += completionPercentage;

            // Skills based on role or data if available
            const skills = memberObj.role?.toLowerCase().includes('lead') || user.role?.toLowerCase().includes('lead')
                ? ['Management', 'Strategy']
                : ['Development', 'Logic'];

            return {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                avatar: user.avatar,
                role: memberObj.role || user.role,
                skills,
                metrics: {
                    activeTasks: { count: activeTasks, total: totalTasks, trend: 'pending' },
                    tasksCompleted: { count: completedTasks, trend: `${completionPercentage}%`, subtitle: 'assigned task completion' },
                    ticketsPushed: { count: ticketsPushed, trend: 'testing', subtitle: 'under testing' },
                    statusDistribution: getStatusDistribution(userWorkItems)
                }
            };
        }).filter(m => m !== null);

        const avgTaskCompletion = totalMembers === 0 ? 0 : Math.round(totalTaskCompletionPercentage / totalMembers);

        // Calculate a more meaningful health status based on project completion 
        let healthStatus = 'Project Initiated';
        if (avgTaskCompletion > 0 && avgTaskCompletion <= 30) healthStatus = 'Early Progress';
        else if (avgTaskCompletion > 30 && avgTaskCompletion <= 70) healthStatus = 'Active Development';
        else if (avgTaskCompletion > 70 && avgTaskCompletion <= 99) healthStatus = 'Nearing Milestone';
        else if (avgTaskCompletion === 100) healthStatus = 'Goal Reached';

        res.json({
            overview: {
                totalMembers,
                projectName: project.name,
                avgTaskCompletion: { value: avgTaskCompletion, trend: healthStatus },
                projectStatusDistribution: getStatusDistribution(allWorkItems)
            },
            members: membersList
        });



    } catch (error) {
        console.error('Analytics Error:', error);
        res.status(500).json({ message: 'Failed to generate analytics' });
    }
};

module.exports = {
    getProjectMemberAnalytics
};
