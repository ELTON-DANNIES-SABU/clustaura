const Project = require('../models/Project');
const Issue = require('../models/Issue');
const Sprint = require('../models/Sprint');
const User = require('../models/User');

// @desc    Create a new sprint
// @route   POST /api/workplace/sprints
// @access  Private
const createSprint = async (req, res) => {
    try {
        const { name, goal, projectId, startDate, endDate } = req.body;

        const sprint = await Sprint.create({
            name,
            goal,
            project: projectId,
            startDate,
            endDate
        });

        res.status(201).json(sprint);
    } catch (error) {
        console.error('Error creating sprint:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get sprints for a project
// @route   GET /api/workplace/projects/:id/sprints
// @access  Private
const getProjectSprints = async (req, res) => {
    try {
        // Get active and future sprints
        const sprints = await Sprint.find({
            project: req.params.id,
            status: { $ne: 'closed' }
        }).sort({ createdAt: 1 });

        res.json(sprints);
    } catch (error) {
        console.error('Error fetching sprints:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Move issue to sprint or backlog
// @route   PUT /api/workplace/issues/:id/move
// @access  Private
const moveIssue = async (req, res) => {
    try {
        const { sprintId, startDate, dueDate } = req.body;
        // sprintId can be null (Backlog) or a valid ID

        const issue = await Issue.findById(req.params.id);
        if (!issue) {
            return res.status(404).json({ message: 'Issue not found' });
        }

        if (sprintId !== undefined) issue.sprint = sprintId || null;
        if (startDate !== undefined) issue.startDate = startDate;
        if (dueDate !== undefined) issue.dueDate = dueDate;

        await issue.save();

        res.json(issue);
    } catch (error) {
        console.error('Error moving issue:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update sprint status (start/complete)
// @route   PUT /api/workplace/sprints/:id/status
// @access  Private
const updateSprintStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const sprint = await Sprint.findById(req.params.id);

        if (!sprint) {
            return res.status(404).json({ message: 'Sprint not found' });
        }

        sprint.status = status;
        await sprint.save();

        res.json(sprint);
    } catch (error) {
        console.error('Error updating sprint status:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a new project
// @route   POST /api/workplace/projects
// @access  Private
const createProject = async (req, res) => {
    try {
        const { name, key, description } = req.body;

        // Check if key exists
        const existingProject = await Project.findOne({ key: key.toUpperCase() });
        if (existingProject) {
            return res.status(400).json({ message: 'Project key already exists' });
        }

        const project = await Project.create({
            name,
            key: key.toUpperCase(),
            description,
            owner: req.user._id,
            members: [req.user._id] // Owner is automatically a member
        });

        res.status(201).json(project);
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all projects for current user
// @route   GET /api/workplace/projects
// @access  Private
const getProjects = async (req, res) => {
    try {
        const projects = await Project.find({
            members: req.user._id
        }).sort({ createdAt: -1 });

        res.json(projects);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get single project details
// @route   GET /api/workplace/projects/:id
// @access  Private
const getProjectById = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('owner', 'firstName lastName email')
            .populate('members', 'firstName lastName email profileImageUrl');

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check if user is member
        if (!project.members.some(member => member._id.toString() === req.user._id.toString())) {
            return res.status(401).json({ message: 'Not authorized to view this project' });
        }

        res.json(project);
    } catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a new issue
// @route   POST /api/workplace/issues
// @access  Private
const createIssue = async (req, res) => {
    try {
        const { projectId, summary, description, type, priority, assignee, sprintId, startDate, dueDate, parent } = req.body;

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Generate Issue Key (e.g., WEB-1, WEB-2)
        const lastIssue = await Issue.findOne({ project: projectId })
            .sort({ createdAt: -1 })
            .limit(1);

        let nextNum = 1;
        if (lastIssue) {
            const parts = lastIssue.issueKey.split('-');
            if (parts.length === 2) {
                nextNum = parseInt(parts[1]) + 1;
            }
        }

        const issueKey = `${project.key}-${nextNum}`;

        const issue = await Issue.create({
            project: projectId,
            issueKey,
            summary,
            description,
            type,
            priority,
            assignee: assignee || req.user._id,
            sprint: sprintId || null,
            startDate,
            dueDate,
            parent: parent || null,
            reporter: req.user._id
        });

        const populatedIssue = await Issue.findById(issue._id)
            .populate('assignee', 'firstName lastName profileImageUrl')
            .populate('reporter', 'firstName lastName');

        res.status(201).json(populatedIssue);
    } catch (error) {
        console.error('Error creating issue:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get issues for a project (optionally filtered by sprint)
// @route   GET /api/workplace/projects/:id/issues
// @access  Private
const getProjectIssues = async (req, res) => {
    try {
        const { sprint } = req.query;
        let query = { project: req.params.id };

        if (sprint === 'null') {
            query.sprint = null; // Backlog
        } else if (sprint) {
            query.sprint = sprint;
        }

        const issues = await Issue.find(query)
            .populate('assignee', 'firstName lastName profileImageUrl')
            .populate('reporter', 'firstName lastName')
            .populate('sprint') // Populate sprint info
            .sort({ createdAt: -1 });

        res.json(issues);
    } catch (error) {
        console.error('Error fetching issues:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update issue status (drag and drop)
// @route   PUT /api/workplace/issues/:id/status
// @access  Private
const updateIssueStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const issue = await Issue.findById(req.params.id);

        if (!issue) {
            return res.status(404).json({ message: 'Issue not found' });
        }

        issue.status = status;
        await issue.save();

        res.json(issue);
    } catch (error) {
        console.error('Error updating issue status:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Add member to project
// @route   POST /api/workplace/projects/:id/members
// @access  Private
const addProjectMember = async (req, res) => {
    try {
        const { email } = req.body;
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check if user is owner
        if (project.owner.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to add members' });
        }

        const userToAdd = await User.findOne({ email });
        if (!userToAdd) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if already member
        if (project.members.includes(userToAdd._id)) {
            return res.status(400).json({ message: 'User is already a member' });
        }

        project.members.push(userToAdd._id);
        await project.save();

        const updatedProject = await Project.findById(project._id)
            .populate('owner', 'firstName lastName email')
            .populate('members', 'firstName lastName email profileImageUrl');

        res.json(updatedProject);
    } catch (error) {
        console.error('Error adding member:', error);
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
    addProjectMember
};
