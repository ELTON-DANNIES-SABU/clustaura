import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../../styles.css';
import './BoardSidebar.css';
import TicketDetailModal from './components/TicketDetailModal';

const Backlog = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [issues, setIssues] = useState([]);
    const [sprints, setSprints] = useState([]);
    const [showCreateSprint, setShowCreateSprint] = useState(false);
    const [showCreateIssue, setShowCreateIssue] = useState(false);
    const [selectedIssueDetail, setSelectedIssueDetail] = useState(null);

    // Auto-scroll state
    const scrollContainerRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);

    // Get today's date in YYYY-MM-DD format for date constraints
    const today = new Date().toISOString().split('T')[0];

    // Forms
    const [newSprint, setNewSprint] = useState({ name: '', goal: '' });
    const [newIssue, setNewIssue] = useState({
        summary: '',
        description: '',
        startDate: '',
        dueDate: '',
        type: 'story',
        priority: 'medium',
        assignee: ''
    });

    useEffect(() => {
        fetchData();
    }, [projectId]);

    // Auto-scroll logic
    useEffect(() => {
        if (!isDragging) return;

        let scrollInterval;
        const scrollSpeed = 10;
        const scrollZoneHeight = 100; // px from top/bottom

        const handleDragOver = (e) => {
            e.preventDefault(); // Necessary to allow dropping and for events to fire continuously
            const container = scrollContainerRef.current;
            if (!container) return;

            const { top, bottom, height } = container.getBoundingClientRect();
            const mouseY = e.clientY;

            // Clear previous interval to avoid stacking
            if (scrollInterval) cancelAnimationFrame(scrollInterval);

            const scroll = () => {
                if (mouseY < top + scrollZoneHeight) {
                    // Scroll Up
                    container.scrollTop -= scrollSpeed;
                    scrollInterval = requestAnimationFrame(scroll);
                } else if (mouseY > bottom - scrollZoneHeight) {
                    // Scroll Down
                    container.scrollTop += scrollSpeed;
                    scrollInterval = requestAnimationFrame(scroll);
                }
            };

            scroll();
        };

        // We attach to window to capture drag position globally
        window.addEventListener('dragover', handleDragOver);

        return () => {
            window.removeEventListener('dragover', handleDragOver);
            if (scrollInterval) cancelAnimationFrame(scrollInterval);
        };
    }, [isDragging]);

    const fetchData = async () => {
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) return;
            const { token } = JSON.parse(userStr);
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const [projRes, sprintRes, issuesRes] = await Promise.all([
                axios.get(`/api/workplace/projects/${projectId}`, config),
                axios.get(`/api/workplace/projects/${projectId}/sprints`, config),
                axios.get(`/api/workplace/projects/${projectId}/issues`, config)
            ]);
            setProject(projRes.data);
            setSprints(sprintRes.data);
            setIssues(issuesRes.data || []);
        } catch (error) {
            console.error('Error fetching backlog data:', error);
        }
    };

    const handleCreateSprint = async (e) => {
        e.preventDefault();
        try {
            const userStr = localStorage.getItem('user');
            const { token } = JSON.parse(userStr);
            await axios.post('/api/workplace/sprints',
                { ...newSprint, projectId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setShowCreateSprint(false);
            setNewSprint({ name: '', goal: '' });
            fetchData();
        } catch (error) {
            console.error('Error creating sprint:', error);
        }
    };

    const handleCreateIssue = async (e) => {
        e.preventDefault();
        try {
            const userStr = localStorage.getItem('user');
            const { token } = JSON.parse(userStr);
            await axios.post('/api/workplace/issues',
                { ...newIssue, projectId }, // No sprintId means backlog
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setShowCreateIssue(false);
            setNewIssue({
                summary: '',
                description: '',
                startDate: '',
                dueDate: '',
                type: 'story',
                priority: 'medium',
                assignee: ''
            });
            fetchData();
        } catch (error) {
            console.error('Error creating issue:', error);
        }
    };

    const handleDragStart = (e, issueId) => {
        e.dataTransfer.setData('issueId', issueId);
        setIsDragging(true);
    };

    const handleDragEnd = () => {
        setIsDragging(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault(); // Allow drop
    };

    // Drop on a sprint to move issue there
    const handleDrop = async (e, sprintId) => {
        setIsDragging(false);
        const issueId = e.dataTransfer.getData('issueId');
        try {
            const userStr = localStorage.getItem('user');
            const { token } = JSON.parse(userStr);
            await axios.put(`/api/workplace/issues/${issueId}/move`,
                { sprintId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchData();
        } catch (error) {
            console.error('Error moving issue:', error);
        }
    };

    const updateSprintStatus = async (sprintId, status) => {
        try {
            const userStr = localStorage.getItem('user');
            const { token } = JSON.parse(userStr);
            await axios.put(`/api/workplace/sprints/${sprintId}/status`,
                { status },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (status === 'active') {
                navigate(`/workplace/project/${projectId}/board`);
            } else {
                fetchData(); // Refresh data to show updated sprint status
            }
        } catch (error) {
            console.error(`Error updating sprint status to ${status}:`, error);
            alert(error.response?.data?.message || 'Error updating sprint status');
        }
    };

    const getPriorityColor = (p) => {
        switch (p) {
            case 'highest': return '#ff4757';
            case 'high': return '#ffa502';
            case 'medium': return '#eccc68';
            case 'low': return '#7bed9f';
            case 'lowest': return '#2ed573';
            default: return '#ccc';
        }
    };

    if (!project) return <div className="loading-spinner">Loading Backlog...</div>;

    return (
        <div className="board-container">
            <header className="board-header">
                <div className="board-breadcrumbs">
                    <span onClick={() => navigate('/workplace')} style={{ cursor: 'pointer' }}>Projects</span>
                    <span> / </span>
                    <span className="current-project">{project.key}</span>
                    <span> / Backlog</span>
                </div>
                <div className="board-title-section">
                    <h1>{project.name} Backlog</h1>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <Link to={`/workplace/project/${projectId}/board`} className="header-action-btn">
                            Go to Board
                        </Link>
                        <button className="header-action-btn primary" onClick={() => setShowCreateIssue(true)}>
                            + Create Issue
                        </button>
                        <button className="header-action-btn" onClick={() => setShowCreateSprint(true)}>
                            Create Sprint
                        </button>
                    </div>
                </div>
            </header>

            <div className="backlog-layout" ref={scrollContainerRef} style={{ display: 'flex', flexDirection: 'column', width: '100%', flex: 1, overflowY: 'auto', padding: '0 2rem 2rem' }}>
                {/* Sprints Section */}
                <div className="sprints-section">
                    {sprints.map(sprint => (
                        <div
                            key={sprint._id}
                            className="sprint-container"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, sprint._id)}
                            style={{ width: '100%', maxWidth: 'none', marginBottom: '20px' }}
                        >
                            <div className="sprint-header">
                                <div className="sprint-info">
                                    <h3>{sprint.name}</h3>
                                    <span className={`sprint-status ${sprint.status}`}>{sprint.status}</span>
                                </div>
                                {sprint.status === 'active' ? (
                                    <button className="secondary-btn" onClick={() => updateSprintStatus(sprint._id, 'closed')}>Complete Sprint</button>
                                ) : (
                                    <button onClick={() => updateSprintStatus(sprint._id, 'active')} className="primary-btn">Start Sprint</button>
                                )}
                            </div>
                            <p className="sprint-goal">{sprint.goal}</p>

                            {/* Display tickets in this sprint */}
                            <div className="sprint-tickets-list" style={{ marginBottom: '15px' }}>
                                {issues.filter(issue => issue.sprint?._id === sprint._id || issue.sprint === sprint._id).map(issue => (
                                    <div
                                        key={issue._id}
                                        className="sprint-issue-title"
                                        onClick={() => setSelectedIssueDetail(issue)}
                                        draggable
                                        onDragStart={e => handleDragStart(e, issue._id)}
                                        onDragEnd={handleDragEnd}
                                        style={{
                                            padding: '8px 12px',
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            border: '1px solid #333',
                                            borderRadius: '4px',
                                            marginBottom: '8px',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                            color: '#eee',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
                                        onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.05)'}
                                    >
                                        <span style={{ color: '#00FF9C', marginRight: '8px', fontWeight: 'bold' }}>{issue.issueKey}</span>
                                        {issue.summary}
                                    </div>
                                ))}
                            </div>

                            <div className="drop-zone">
                                Drop issues here to assign
                            </div>
                        </div>
                    ))}
                </div>

                <div className="backlog-section" style={{ width: '100%', maxWidth: 'none' }}>
                    <div className="backlog-header">
                        <h2>Backlog ({issues.filter(i => !i.sprint).length} issues)</h2>
                    </div>
                    <div className="backlog-list">
                        {issues.filter(i => !i.sprint).map(issue => (
                            <div
                                key={issue._id}
                                className="backlog-issue-row"
                                draggable
                                onDragStart={e => handleDragStart(e, issue._id)}
                                onDragEnd={handleDragEnd}
                                onClick={() => setSelectedIssueDetail(issue)}
                            >
                                <div className="issue-row-left">
                                    <span className={`issue-type-icon ${issue.type}`}></span>
                                    <span className="issue-key">{issue.issueKey}</span>
                                    <span className="issue-summary">{issue.summary}</span>
                                </div>
                                <div className="issue-row-right">
                                    <span className={`priority-badge ${issue.priority}`}>{issue.priority}</span>
                                    <div className="assignee-avatar">
                                        {issue.assignee?.firstName?.charAt(0) || '?'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Modals reused or new... simplified for brevity */}
            {showCreateSprint && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Create Sprint</h2>
                        <form onSubmit={handleCreateSprint}>
                            <input
                                type="text" placeholder="Sprint Name"
                                value={newSprint.name}
                                onChange={e => setNewSprint({ ...newSprint, name: e.target.value })}
                                required
                            />
                            <input
                                type="text" placeholder="Sprint Goal"
                                value={newSprint.goal}
                                onChange={e => setNewSprint({ ...newSprint, goal: e.target.value })}
                            />
                            <div className="form-actions">
                                <button type="button" onClick={() => setShowCreateSprint(false)}>Cancel</button>
                                <button type="submit" className="primary-btn">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showCreateIssue && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Create Issue in Backlog</h2>
                        <form onSubmit={handleCreateIssue}>
                            <div className="form-group">
                                <label>Title</label>
                                <input
                                    type="text"
                                    value={newIssue.summary}
                                    onChange={e => setNewIssue({ ...newIssue, summary: e.target.value })}
                                    required
                                    placeholder="e.g. Implement login flow"
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={newIssue.description}
                                    onChange={e => setNewIssue({ ...newIssue, description: e.target.value })}
                                    placeholder="Describe the task in detail..."
                                    rows={4}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        background: '#333',
                                        border: '1px solid #555',
                                        color: '#eee',
                                        borderRadius: '4px',
                                        resize: 'vertical'
                                    }}
                                />
                            </div>
                            <div className="form-group">
                                <label>Type</label>
                                <select
                                    value={newIssue.type}
                                    onChange={e => setNewIssue({ ...newIssue, type: e.target.value })}
                                >
                                    <option value="task">Task</option>
                                    <option value="story">Story</option>
                                    <option value="bug">Bug</option>
                                </select>
                            </div>
                            <div className="form-group-row" style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Start Date</label>
                                    <input
                                        type="date"
                                        value={newIssue.startDate}
                                        onChange={e => setNewIssue({ ...newIssue, startDate: e.target.value })}
                                        min={today}
                                    />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Due Date</label>
                                    <input
                                        type="date"
                                        value={newIssue.dueDate}
                                        onChange={e => setNewIssue({ ...newIssue, dueDate: e.target.value })}
                                        min={today}
                                    />
                                </div>
                            </div>
                            <div className="form-group" style={{ marginTop: '1rem' }}>
                                <label>Assignee</label>
                                <select
                                    value={newIssue.assignee}
                                    onChange={e => setNewIssue({ ...newIssue, assignee: e.target.value })}
                                >
                                    <option value="">Unassigned</option>
                                    <option value={project.owner._id}>
                                        {project.owner.firstName} {project.owner.lastName} (Owner)
                                    </option>
                                    {project.members && project.members
                                        .filter(m => m._id !== project.owner._id)
                                        .map(member => (
                                            <option key={member._id} value={member._id}>
                                                {member.firstName} {member.lastName}
                                            </option>
                                        ))}
                                </select>
                            </div>
                            <div className="form-group" style={{ marginTop: '1rem' }}>
                                <label>Priority</label>
                                <select
                                    value={newIssue.priority}
                                    onChange={e => setNewIssue({ ...newIssue, priority: e.target.value })}
                                >
                                    <option value="highest">Highest</option>
                                    <option value="high">High</option>
                                    <option value="medium">Medium</option>
                                    <option value="low">Low</option>
                                    <option value="lowest">Lowest</option>
                                </select>
                            </div>
                            <div className="form-actions" style={{ marginTop: '20px' }}>
                                <button type="button" onClick={() => setShowCreateIssue(false)}>Cancel</button>
                                <button type="submit" className="primary-btn">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Ticket Detail Modal */}
            <TicketDetailModal
                issue={selectedIssueDetail}
                onClose={() => setSelectedIssueDetail(null)}
                getPriorityColor={getPriorityColor}
            />
        </div>
    );
};

export default Backlog;
