import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../styles.css';
import './Workplace/BoardSidebar.css';
import { Search, X, Filter, User, CheckCircle, Clock, Layout, FlaskConical } from 'lucide-react';
import TicketDetailModal from './Workplace/components/TicketDetailModal';
import AIChatBubble from './AIChatBubble';
import Board from './Workplace/Board/Board';

const WorkplaceBoard = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [columns, setColumns] = useState(['To Do', 'In Progress', 'Dev Testing', 'Done']);
    const [project, setProject] = useState(null);
    const [issues, setIssues] = useState([]);
    const [allSprints, setAllSprints] = useState([]);
    const [selectedSprintId, setSelectedSprintId] = useState('');
    const [activeSprint, setActiveSprint] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [newMemberEmail, setNewMemberEmail] = useState('');


    // Sidebar State
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Member Detail State
    const [selectedMember, setSelectedMember] = useState(null);

    // Ticket Detail State
    const [selectedIssueDetail, setSelectedIssueDetail] = useState(null);

    // Get today's date in YYYY-MM-DD format for date constraints
    const today = new Date().toISOString().split('T')[0];

    // Create new issue form state
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
        fetchProjectData();
    }, [projectId, selectedSprintId]);

    const fetchProjectData = async () => {
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) return;
            const { token } = JSON.parse(userStr);
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            };

            const [projRes, sprintsRes] = await Promise.all([
                axios.get(`http://localhost:5000/api/workplace/projects/${projectId}`, config),
                axios.get(`http://localhost:5000/api/workplace/projects/${projectId}/sprints`, config)
            ]);

            setProject(projRes.data);
            setAllSprints(sprintsRes.data);

            // Find active sprint
            const active = sprintsRes.data.find(s => s.status === 'active');
            setActiveSprint(active);

            // Default selection to active if nothing chosen
            const sprintToLoad = selectedSprintId || active?._id;
            if (!selectedSprintId && active) setSelectedSprintId(active._id);

            if (sprintToLoad) {
                const issuesRes = await axios.get(`http://localhost:5000/api/workplace/projects/${projectId}/issues?sprint=${sprintToLoad}`, config);
                setIssues(issuesRes.data);
            } else {
                setIssues([]); // No sprint selected or active
            }

        } catch (error) {
            console.error('Error fetching board data:', error);
            if (error.response?.status === 401) {
                navigate('/login');
            }
        }
    };

    // Drag and Drop Logic moved to Board component

    const handleCreateIssue = async (e) => {
        e.preventDefault();
        try {
            const userStr = localStorage.getItem('user');
            const { token } = JSON.parse(userStr);

            // If active sprint exists, assign to it. Otherwise backlog (but button is hidden if no active sprint).
            const issueData = {
                ...newIssue,
                projectId,
                sprintId: activeSprint ? activeSprint._id : null
            };

            await axios.post('http://localhost:5000/api/workplace/issues',
                issueData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            setShowCreateModal(false);
            setNewIssue({
                summary: '',
                description: '',
                startDate: '',
                dueDate: '',
                type: 'story',
                priority: 'medium',
                assignee: ''
            });
            fetchProjectData();
        } catch (error) {
            console.error('Error creating issue:', error);
        }
    };

    const handleAddMember = async (e) => {
        e.preventDefault();
        try {
            const userStr = localStorage.getItem('user');
            const { token } = JSON.parse(userStr);
            console.log("Adding member:", newMemberEmail, "to project:", projectId); // Debug

            await axios.post(`http://localhost:5000/api/workplace/projects/${projectId}/members`,
                { email: newMemberEmail },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setShowAddMemberModal(false);
            setNewMemberEmail('');
            alert('Member added successfully!');
            fetchProjectData(); // Refresh to get new members
        } catch (error) {
            console.error('Error adding member:', error);
            alert(error.response?.data?.message || 'Error adding member');
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

    const filteredIssues = issues.filter(issue =>
        issue.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.issueKey?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!project) return <div className="loading-spinner">Loading Board...</div>;

    return (
        <div className="board-container">
            <header className="board-header">
                <div className="board-breadcrumbs">
                    <span onClick={() => navigate('/workplace')} style={{ cursor: 'pointer' }}>Projects</span>
                    <span> / </span>
                    <span className="current-project">{project.key}</span>
                    <span> / Board</span>
                </div>
                <div className="board-title-section">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <h1>{project.name} Board</h1>
                        <button className="header-action-btn" onClick={() => setShowAddMemberModal(true)}>
                            + Member
                        </button>

                        {allSprints.length > 0 && (
                            <select
                                className="sprint-selector-dropdown"
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
                        )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        {/* Member Stack */}
                        <div className="member-stack">
                            <div className="member-avatar user-icon-avatar" title="Member List">
                                <User size={16} />
                            </div>
                            {project.members?.slice(0, 5).map((member, idx) => (
                                <div
                                    key={member._id}
                                    className="member-avatar"
                                    style={{
                                        backgroundColor: `hsl(${idx * 40}, 60%, 40%)`,
                                        zIndex: 5 - idx
                                    }}
                                    title={`${member.firstName} ${member.lastName}`}
                                    onClick={() => setSelectedMember(member)}
                                >
                                    {member.firstName?.charAt(0)}{member.lastName?.charAt(0)}
                                </div>
                            ))}
                            {project.members?.length > 5 && (
                                <div className="member-avatar more">
                                    +{project.members.length - 5}
                                </div>
                            )}
                        </div>

                        <button
                            className="toggle-sidebar-btn"
                            onClick={() => setIsSidebarOpen(true)}
                            title="Search Tickets"
                        >
                            <Search size={16} />
                            <span>Search</span>
                        </button>
                        <Link to={`/workplace/project/${projectId}/backlog`} style={{ color: 'var(--primary-mint)', textDecoration: 'none' }}>
                            Backlog
                        </Link>
                        <Link to={`/workplace/project/${projectId}/timeline`} style={{ color: 'var(--primary-mint)', textDecoration: 'none' }}>
                            Roadmap
                        </Link>

                        {activeSprint && (
                            <button className="create-issue-btn" onClick={() => setShowCreateModal(true)}>
                                Create Issue
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* AI Chat Bubble */}
            {activeSprint && (
                <AIChatBubble
                    sprintId={activeSprint._id}
                    onTeamCreated={fetchProjectData}
                />
            )}

            {/* New Board Component */}
            <Board
                columns={columns}
                issues={filteredIssues}
                onDragEnd={(event) => {
                    const { active, over } = event;
                    if (!over) return;

                    const activeId = active.id;
                    const overId = over.id;

                    const activeIssue = issues.find(i => i._id === activeId);
                    if (!activeIssue) return;

                    let newStatus = activeIssue.status;

                    // If dropped over a column directly
                    if (columns.includes(overId)) {
                        newStatus = overId;
                    }
                    // If dropped over another issue, take that issue's status
                    else {
                        const overIssue = issues.find(i => i._id === overId);
                        if (overIssue) {
                            newStatus = overIssue.status;
                        }
                    }

                    if (activeIssue.status !== newStatus) {
                        // Optimistic Update
                        const updatedIssues = issues.map(issue =>
                            issue._id === activeId ? { ...issue, status: newStatus } : issue
                        );
                        setIssues(updatedIssues);

                        // Backend Update
                        const userStr = localStorage.getItem('user');
                        if (userStr) {
                            const { token } = JSON.parse(userStr);
                            axios.put(`http://localhost:5000/api/workplace/issues/${activeId}/status`,
                                { status: newStatus },
                                { headers: { Authorization: `Bearer ${token}` } }
                            ).catch(error => {
                                console.error('Error updating status:', error);
                                fetchProjectData(); // Revert on error
                            });
                        }
                    }
                }}
                getPriorityColor={getPriorityColor}
                onIssueClick={setSelectedIssueDetail}
            />

            {showCreateModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Create Issue</h2>
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
                            <div className="form-group-row" style={{ display: 'flex', gap: '1rem' }}>
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
                            <div className="form-group">
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
                            <div className="form-group">
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
                            <div className="form-actions">
                                <button type="button" onClick={() => setShowCreateModal(false)}>Cancel</button>
                                <button type="submit" className="primary-btn">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showAddMemberModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <h2>Add Team Member</h2>
                        <p style={{ color: '#888', marginBottom: '1rem' }}>Enter email address to add user to project.</p>
                        <form onSubmit={handleAddMember}>
                            <div className="form-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    value={newMemberEmail}
                                    onChange={e => setNewMemberEmail(e.target.value)}
                                    required
                                    placeholder="user@example.com"
                                />
                            </div>
                            <div className="form-actions">
                                <button type="button" onClick={() => setShowAddMemberModal(false)}>Cancel</button>
                                <button type="submit" className="primary-btn">Add</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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
                                const element = document.getElementById(`card-${issue._id}`);
                                if (element) {
                                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    element.classList.add('highlight-card');
                                    setTimeout(() => element.classList.remove('highlight-card'), 2000);
                                    setIsSidebarOpen(false); // Close sidebar after selection
                                }
                            }}>
                                <div className="result-header">
                                    <span className="result-key">{issue.issueKey}</span>
                                    <span
                                        className="issue-priority-dot"
                                        style={{ background: getPriorityColor(issue.priority), width: '8px', height: '8px' }}
                                    ></span>
                                </div>
                                <div className="result-summary">{issue.summary}</div>
                                <div className="result-status">{issue.status}</div>
                            </div>
                        ))
                    )}
                    {!searchQuery && (
                        <div style={{ color: '#666', fontSize: '0.8rem', textAlign: 'center', marginTop: '20px' }}>
                            {issues.length} tickets in this sprint
                        </div>
                    )}
                </div>
            </div>

            {/* Member Detail Modal */}
            {selectedMember && (
                <>
                    <div className="modal-overlay" onClick={() => setSelectedMember(null)} style={{ zIndex: 1099 }} />
                    <div className="member-detail-modal">
                        <div className="member-detail-header">
                            <div
                                className="member-detail-avatar"
                                style={{ backgroundColor: 'hsl(200, 60%, 40%)' }}
                            >
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
                            <h5>Performance</h5>
                            <div className="metrics-grid">
                                <div className="metric-card assigned">
                                    <Layout size={16} className="metric-icon" />
                                    <span className="metric-value">
                                        {issues.filter(i => i.assignee?._id === selectedMember._id).length}
                                    </span>
                                    <span className="metric-label">Assigned</span>
                                </div>
                                <div className="metric-card progress">
                                    <Clock size={16} className="metric-icon" />
                                    <span className="metric-value">
                                        {issues.filter(i => i.assignee?._id === selectedMember._id && i.status === 'In Progress').length}
                                    </span>
                                    <span className="metric-label">Progress</span>
                                </div>
                                <div className="metric-card dev-testing">
                                    <FlaskConical size={16} className="metric-icon" />
                                    <span className="metric-value">
                                        {issues.filter(i => i.assignee?._id === selectedMember._id && i.status === 'Dev Testing').length}
                                    </span>
                                    <span className="metric-label">Testing</span>
                                </div>
                                <div className="metric-card completed">
                                    <CheckCircle size={16} className="metric-icon" />
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
            <TicketDetailModal
                issue={selectedIssueDetail}
                onClose={() => setSelectedIssueDetail(null)}
                getPriorityColor={getPriorityColor}
            />
        </div>
    );
};

export default WorkplaceBoard;
