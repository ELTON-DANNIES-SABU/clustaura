import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../styles.css';
import { Search, X, Filter, User, CheckCircle, Clock, Layout, FlaskConical, ChevronRight, Plus, MoreVertical, Target, Flag, MessageSquare, BarChart3, Zap } from 'lucide-react';
import { useToast } from './Community/shared/Toast';
import TicketDetailModal from './Workplace/components/TicketDetailModal';


const WorkplaceBoard = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [columns, setColumns] = useState(['To Do', 'In Progress', 'Dev Testing', 'Done']);
    const [project, setProject] = useState(null);
    const [issues, setIssues] = useState([]);
    const [allSprints, setAllSprints] = useState([]);
    const [selectedSprintId, setSelectedSprintId] = useState('');
    const [activeSprint, setActiveSprint] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMember, setSelectedMember] = useState(null);
    const [selectedIssueDetail, setSelectedIssueDetail] = useState(null);
    const [dragOverColumn, setDragOverColumn] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [leaveRequests, setLeaveRequests] = useState([]);
    const { toast } = useToast();

    const today = new Date().toISOString().split('T')[0];


    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            setCurrentUser(JSON.parse(userStr));
        }
        fetchProjectData();
    }, [projectId, selectedSprintId]);

    const fetchProjectData = async () => {
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) return;
            const { token, _id } = JSON.parse(userStr);
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            };

            const [projRes, sprintsRes] = await Promise.all([
                axios.get(`/api/workplace/projects/${projectId}`, config),
                axios.get(`/api/workplace/projects/${projectId}/sprints`, config)
            ]);

            setProject(projRes.data);
            setAllSprints(sprintsRes.data);

            const active = sprintsRes.data.find(s => s.status === 'active');
            setActiveSprint(active);

            const sprintToLoad = selectedSprintId || active?._id;
            if (!selectedSprintId && active) setSelectedSprintId(active._id);

            if (sprintToLoad) {
                // Check if project has modules (indicates new AI SDLC structure)
                let issuesRes;
                if (projRes.data.modules && projRes.data.modules.length > 0) {
                    issuesRes = await axios.get(`/api/agents/tickets/${projectId}?sprint=${sprintToLoad}`, config);
                } else {
                    issuesRes = await axios.get(`/api/workplace/projects/${projectId}/issues?sprint=${sprintToLoad}`, config);
                }
                setIssues(issuesRes.data.map(i => ({
                    ...i,
                    summary: i.summary || i.title, // Map Ticket title to existing board's summary field
                    assignee: i.assignee || i.assignedUser
                })));
            } else {
                setIssues([]);
            }

            if (projRes.data.owner._id === _id) {
                const leaveReqRes = await axios.get(`/api/workplace/projects/${projectId}/leave-requests`, config);
                setLeaveRequests(leaveReqRes.data);
            }

        } catch (error) {
            console.error('Error fetching board data:', error);
            if (error.response?.status === 401) {
                navigate('/login');
            }
        }
    };



    const handleLeaveProject = async () => {
        if (!window.confirm('Are you sure you want to leave this project? (A request will be sent to the lead)')) return;
        try {
            const { token } = currentUser;
            const res = await axios.delete(`/api/workplace/projects/${projectId}/leave`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert(res.data.message || 'Leave request sent successfully');
        } catch (error) {
            console.error('Error leaving project:', error);
            alert(error.response?.data?.message || 'Error leaving project');
        }
    };

    const handleRespondToLeaveRequest = async (userId, action) => {
        const confirmMsg = action === 'approve'
            ? 'Are you sure you want to approve this leave request? The member will be removed from the project.'
            : 'Are you sure you want to decline this leave request?';

        if (!window.confirm(confirmMsg)) return;

        try {
            const { token } = currentUser;
            await axios.post(`/api/workplace/projects/${projectId}/leave-requests/${userId}/respond`,
                { action },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert(`Leave request ${action === 'approve' ? 'approved' : 'declined'} successfully`);
            fetchProjectData();
        } catch (error) {
            console.error('Error responding to leave request:', error);
            alert(error.response?.data?.message || 'Error responding to leave request');
        }
    };

    const handleRemoveMember = async (userId) => {
        if (!window.confirm('Are you sure you want to remove this member?')) return;
        try {
            const { token } = currentUser;
            await axios.delete(`/api/workplace/projects/${projectId}/members/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSelectedMember(null);
            alert('Member removed successfully');
            fetchProjectData();
        } catch (error) {
            console.error('Error removing member:', error);
            alert(error.response?.data?.message || 'Error removing member');
        }
    };

    const handleAutoAssign = async () => {
        try {
            const { token } = currentUser;
            const res = await axios.post(`http://localhost:5000/api/agents/assign-tickets`, 
                { projectId },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast(res.data.message, 'success');
            fetchProjectData();
        } catch (error) {
            console.error('Auto-assign error:', error);
            toast(error.response?.data?.message || 'Failed to auto-assign tickets', 'error');
        }
    };

    const handleDragStart = (e, issueId) => {
        e.dataTransfer.setData('issueId', issueId);
    };

    const handleDragOver = (e, column) => {
        e.preventDefault();
        setDragOverColumn(column);
    };

    const handleDragLeave = () => {
        setDragOverColumn(null);
    };

    const handleDrop = async (e, column) => {
        e.preventDefault();
        const issueId = e.dataTransfer.getData('issueId');
        setDragOverColumn(null);

        if (issueId) {
            const issue = issues.find(i => i._id === issueId);
            if (issue && issue.status !== column) {
                // Optimistic update
                const updatedIssues = issues.map(i =>
                    i._id === issueId ? { ...i, status: column } : i
                );
                setIssues(updatedIssues);

                try {
                    const userStr = localStorage.getItem('user');
                    const { token } = JSON.parse(userStr);
                    await axios.put(`/api/workplace/issues/${issueId}/status`,
                        { status: column },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                } catch (error) {
                    console.error('Error updating status:', error);
                    fetchProjectData();
                }
            }
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

    const getIssueTypeIcon = (type) => {
        switch (type) {
            case 'story': return '📘';
            case 'task': return '📋';
            case 'bug': return '🐛';
            default: return '📌';
        }
    };

    const getColumnColor = (column) => {
        switch (column) {
            case 'To Do': return '#ff6b6b';
            case 'In Progress': return '#ffa94d';
            case 'Dev Testing': return '#4dabf7';
            case 'Done': return '#51cf66';
            default: return '#868e96';
        }
    };

    const filteredIssues = issues.filter(issue =>
        issue.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.issueKey?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!project) return <div className="loading-spinner">Loading Board...</div>;

    return (
        <div className="workplace-board-container">
            <header className="board-header">
                <div className="board-breadcrumbs">
                    <span onClick={() => navigate('/workplace')} style={{ cursor: 'pointer' }}>Projects</span>
                    <ChevronRight size={16} />
                    <span className="project-name">{project.name}</span>
                    <ChevronRight size={16} />
                    <span className="current-page">Board</span>
                </div>

                <div className="board-title-section">
                    <div className="project-info-header">
                        <div className="project-avatar" style={{ background: 'linear-gradient(135deg, #00ffaa, #00cc88)' }}>
                            {project.key.substring(0, 2)}
                        </div>
                        <div>
                            <h1>{project.name} Board</h1>
                            <p className="project-description">{project.description}</p>
                        </div>
                    </div>

                    <div className="board-actions">
                        <div className="member-stack">
                            <div className="member-avatar user-icon-avatar" title="Member List">
                                <User size={16} />
                            </div>
                            {project.members?.slice(0, 5).map((member, idx) => (
                                <div
                                    key={member._id}
                                    className="member-avatar"
                                    style={{
                                        backgroundColor: !member.profileImageUrl ? `hsl(${idx * 40}, 60%, 40%)` : 'transparent',
                                        zIndex: 10 + idx,
                                        left: `${(idx + 1) * 22}px`,
                                        overflow: 'hidden'
                                    }}
                                    title={`${member.firstName} ${member.lastName}`}
                                    onClick={() => setSelectedMember(member)}
                                >
                                    {member.profileImageUrl ? (
                                        <img 
                                            src={member.profileImageUrl} 
                                            alt={member.firstName} 
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <>{member.firstName?.charAt(0)}{member.lastName?.charAt(0)}</>
                                    )}
                                </div>
                            ))}
                            {project.members?.length > 5 && (
                                <div 
                                    className="member-avatar more"
                                    style={{ left: `${6 * 22}px`, zIndex: 16 }}
                                >
                                    +{project.members.length - 5}
                                </div>
                            )}
                        </div>

                        {activeSprint && (
                            <div className="sprint-info">
                                <Target size={16} />
                                <span>{activeSprint.name}</span>
                            </div>
                        )}

                        {project.owner._id === currentUser?._id ? (
                            <button className="action-btn" onClick={() => setShowAddMemberModal(true)}>
                                <Plus size={16} /> Add Member
                            </button>
                        ) : (
                            <button className="action-btn leave-btn" onClick={handleLeaveProject} style={{ color: '#ff4757', border: '1px solid rgba(255, 71, 87, 0.3)' }}>
                                <X size={16} /> Leave Project
                            </button>
                        )}

                        <button className="action-btn" onClick={() => setIsSidebarOpen(true)}>
                            <Search size={16} /> Search
                        </button>

                        {project.owner._id === currentUser?._id && (
                            <button className="action-btn" onClick={handleAutoAssign} title="AI Auto-Assign Tickets">
                                <Zap size={16} />
                                <span>Auto-Assign</span>
                            </button>
                        )}

                        <button className="primary-nav-btn active" onClick={() => navigate(`/workplace/project/${projectId}/ai-planner`)}>
                            <FlaskConical size={18} />
                            <span>AI Command Center</span>
                        </button>
                    </div>
                </div>

                {project.owner._id === currentUser?._id && leaveRequests.length > 0 && (
                    <div className="leave-requests-banner" style={{ background: 'rgba(255, 71, 87, 0.1)', border: '1px solid rgba(255, 71, 87, 0.3)', borderRadius: '8px', padding: '12px 20px', marginTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: '#ff4757', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                                {leaveRequests.length}
                            </div>
                            <div>
                                <h4 style={{ margin: 0, color: '#ff4757', fontSize: '0.9rem' }}>Pending Leave Requests</h4>
                                <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>Members are waiting for your approval to leave the project.</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            {leaveRequests.map(req => (
                                <div key={req.user._id} className="leave-request-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px' }}>
                                    <span style={{ fontSize: '0.85rem' }}>{req.user.firstName} {req.user.lastName}</span>
                                    <button
                                        onClick={() => handleRespondToLeaveRequest(req.user._id, 'approve')}
                                        style={{ background: '#2ed573', border: 'none', color: 'white', padding: '2px 8px', borderRadius: '3px', cursor: 'pointer', fontSize: '0.75rem' }}
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleRespondToLeaveRequest(req.user._id, 'reject')}
                                        style={{ background: '#ff4757', border: 'none', color: 'white', padding: '2px 8px', borderRadius: '3px', cursor: 'pointer', fontSize: '0.75rem' }}
                                    >
                                        Decline
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </header>

            <div className="board-controls">
                <div className="sprint-selector">
                    <select
                        className="sprint-select"
                        value={selectedSprintId}
                        onChange={(e) => setSelectedSprintId(e.target.value)}
                    >
                        <option value="">Select Sprint...</option>
                        {allSprints.map(s => (
                            <option key={s._id} value={s._id}>
                                {s.name} ({s.status.toUpperCase()})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="board-stats">
                    <div className="stat-item">
                        <span className="stat-value">{issues.length}</span>
                        <span className="stat-label">Total Issues</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">{issues.filter(i => i.status === 'Done').length}</span>
                        <span className="stat-label">Completed</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">
                            {activeSprint ? Math.round((issues.filter(i => i.status === 'Done').length / issues.length) * 100) || 0 : 0}%
                        </span>
                        <span className="stat-label">Progress</span>
                    </div>
                </div>

                <div className="agent-status-bar">
                    <div className="agent-indicator pulse"></div>
                    <span>AI Agent Monitoring Active</span>
                </div>
            </div>



            <div className="board-columns-container">
                {columns.map(column => (
                    <div
                        key={column}
                        className={`board-column ${dragOverColumn === column ? 'drag-over' : ''}`}
                        onDragOver={(e) => handleDragOver(e, column)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, column)}
                    >
                        <div className="column-header">
                            <div className="column-title" style={{ borderLeft: `4px solid ${getColumnColor(column)}` }}>
                                <h3>{column}</h3>
                                <span className="column-count">
                                    {filteredIssues.filter(issue => issue.status === column).length}
                                </span>
                            </div>
                            <button className="column-menu-btn">
                                <MoreVertical size={16} />
                            </button>
                        </div>

                        <div className="column-content">
                            {filteredIssues
                                .filter(issue => issue.status === column)
                                .map(issue => (
                                    <div
                                        key={issue._id}
                                        className="issue-card"
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, issue._id)}
                                        onClick={() => setSelectedIssueDetail(issue)}
                                    >
                                        <div className="issue-header">
                                            <span className="issue-key">{issue.issueKey}</span>
                                            <div className="issue-meta">
                                                <span className="issue-type">{getIssueTypeIcon(issue.type)}</span>
                                                <div
                                                    className="priority-dot"
                                                    style={{ backgroundColor: getPriorityColor(issue.priority) }}
                                                    title={issue.priority}
                                                />
                                            </div>
                                        </div>

                                        <div className="issue-summary">
                                            {issue.summary}
                                        </div>

                                        <div className="issue-footer">
                                            {issue.assignee ? (
                                                <div className="assignee-avatar">
                                                    {issue.assignee.firstName?.charAt(0)}{issue.assignee.lastName?.charAt(0)}
                                                </div>
                                            ) : (
                                                <div className="assignee-placeholder">Unassigned</div>
                                            )}

                                            {issue.dueDate && (
                                                <div className="due-date">
                                                    <Clock size={12} />
                                                    {new Date(issue.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}

                            {filteredIssues.filter(issue => issue.status === column).length === 0 && (
                                <div className="empty-column">
                                    Drop issues here
                                </div>
                            )}
                        </div>

                    </div>
                ))}
            </div>



            {/* Search Sidebar */}
            <div className={`board-sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} onClick={() => setIsSidebarOpen(false)} />
            <div className={`board-sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <h3>Search Tickets</h3>
                    <button className="close-sidebar-btn" onClick={() => setIsSidebarOpen(false)}>
                        <X size={20} />
                    </button>
                </div>

                <div className="sidebar-search-container">
                    <div className="sidebar-search-input-wrapper">
                        <Search className="sidebar-search-icon" size={16} />
                        <input
                            type="text"
                            placeholder="Search by summary or ID..."
                            className="sidebar-search-input"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoFocus={isSidebarOpen}
                        />
                    </div>
                </div>

                <div className="sidebar-content">
                    {searchQuery && filteredIssues.length === 0 ? (
                        <div className="empty-results">No tickets found matching "{searchQuery}"</div>
                    ) : (
                        filteredIssues.map(issue => (
                            <div key={issue._id} className="search-result-item" onClick={() => {
                                const element = document.getElementById(`issue-${issue._id}`);
                                if (element) {
                                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    element.classList.add('highlight-card');
                                    setTimeout(() => element.classList.remove('highlight-card'), 2000);
                                    setIsSidebarOpen(false);
                                }
                            }}>
                                <div className="result-header">
                                    <span className="result-key">{issue.issueKey}</span>
                                    <div className="result-meta">
                                        <span className="issue-type">{getIssueTypeIcon(issue.type)}</span>
                                        <div
                                            className="priority-dot"
                                            style={{ backgroundColor: getPriorityColor(issue.priority) }}
                                        />
                                    </div>
                                </div>
                                <div className="result-summary">{issue.summary}</div>
                                <div className="result-status">
                                    <span className="status-badge" style={{ backgroundColor: getColumnColor(issue.status) }}>
                                        {issue.status}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                    {!searchQuery && (
                        <div className="sidebar-hint">
                            {issues.length} tickets in this sprint
                        </div>
                    )}
                </div>
            </div>

            {/* Member Detail Modal */}
            {selectedMember && (
                <>
                    <div className="modal-overlay" onClick={() => setSelectedMember(null)} />
                    <div className="member-detail-modal">
                        <div className="member-detail-header">
                            <div className="member-detail-avatar" style={{ backgroundColor: 'hsl(200, 60%, 40%)' }}>
                                {selectedMember.firstName?.charAt(0)}{selectedMember.lastName?.charAt(0)}
                            </div>
                            <div className="member-detail-info">
                                <h4>{selectedMember.firstName} {selectedMember.lastName}</h4>
                                <p>{selectedMember.email}</p>
                                <span className="member-detail-role">
                                    {project.owner._id === selectedMember._id ? 'Project Lead' : 'Team Member'}
                                </span>
                            </div>
                        </div>
                        <div className="performance-section">
                            <h5>Performance Metrics</h5>
                            <div className="metrics-grid">
                                <div className="metric-card assigned">
                                    <Layout size={20} className="metric-icon" />
                                    <span className="metric-value">
                                        {issues.filter(i => i.assignee?._id === selectedMember._id).length}
                                    </span>
                                    <span className="metric-label">Assigned</span>
                                </div>
                                <div className="metric-card progress">
                                    <Clock size={20} className="metric-icon" />
                                    <span className="metric-value">
                                        {issues.filter(i => i.assignee?._id === selectedMember._id && i.status === 'In Progress').length}
                                    </span>
                                    <span className="metric-label">In Progress</span>
                                </div>
                                <div className="metric-card dev-testing">
                                    <FlaskConical size={20} className="metric-icon" />
                                    <span className="metric-value">
                                        {issues.filter(i => i.assignee?._id === selectedMember._id && i.status === 'Dev Testing').length}
                                    </span>
                                    <span className="metric-label">Testing</span>
                                </div>
                                <div className="metric-card completed">
                                    <CheckCircle size={20} className="metric-icon" />
                                    <span className="metric-value">
                                        {issues.filter(i => i.assignee?._id === selectedMember._id && i.status === 'Done').length}
                                    </span>
                                    <span className="metric-label">Completed</span>
                                </div>
                            </div>
                        </div>
                        <div className="member-detail-actions">
                            <button className="close-detail-btn" onClick={() => setSelectedMember(null)}>
                                Close
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Ticket Detail Modal */}
            {selectedIssueDetail && (
                <TicketDetailModal
                    issue={selectedIssueDetail}
                    onClose={() => setSelectedIssueDetail(null)}
                    getPriorityColor={getPriorityColor}
                />
            )}
        </div>
    );
};

export default WorkplaceBoard;
