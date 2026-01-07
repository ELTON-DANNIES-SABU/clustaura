import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ChevronRight, ChevronDown, Plus, Filter, Calendar, Layout, CheckCircle, Clock, FlaskConical } from 'lucide-react';
import './Timeline.css';
import '../BoardSidebar.css';
import TimelineGrid from './TimelineGrid';
import CreateIssueModal from '../components/CreateIssueModal';
import { addDays, startOfMonth, endOfMonth, eachMonthOfInterval, format, differenceInDays } from 'date-fns';

const Timeline = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [epics, setEpics] = useState([]);
    const [expandedEpics, setExpandedEpics] = useState({});
    const [loading, setLoading] = useState(true);
    const [allIssues, setAllIssues] = useState([]); // Store all issues for performance calc

    // Create Issue Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createModalType, setCreateModalType] = useState('task');
    const [createModalParent, setCreateModalParent] = useState(null);

    // Member Detail State
    const [selectedMember, setSelectedMember] = useState(null);

    // Timeline view settings
    const [viewMode, setViewMode] = useState('month'); // 'month' or 'week' (simplified to month for now)
    const [startDate, setStartDate] = useState(startOfMonth(new Date()));
    const [endDate, setEndDate] = useState(endOfMonth(addDays(new Date(), 90))); // 3 months view

    // Scroll sync refs
    const sidebarRef = useRef(null);
    const gridRef = useRef(null);

    useEffect(() => {
        fetchData();
    }, [projectId]);

    const fetchData = async () => {
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) return;
            const { token } = JSON.parse(userStr);
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const [projRes, issuesRes] = await Promise.all([
                axios.get(`/api/workplace/projects/${projectId}`, config),
                axios.get(`/api/workplace/projects/${projectId}/issues`, config)
            ]);

            setProject(projRes.data);

            const fetchedIssues = issuesRes.data;
            setAllIssues(fetchedIssues);

            // Separate Epics and link children
            const epicList = fetchedIssues.filter(i => i.type === 'epic');
            const otherIssues = fetchedIssues.filter(i => i.type !== 'epic');

            // Attach children to epics (client-side join for now)
            const epicsWithChildren = epicList.map(epic => ({
                ...epic,
                children: otherIssues.filter(child => child.parent === epic._id || child.parent?._id === epic._id)
            }));

            // Also find orphans if needed, but for now focus on Epics
            setEpics(epicsWithChildren);
            setLoading(false);

        } catch (error) {
            console.error('Error fetching timeline data:', error);
            setLoading(false);
        }
    };

    const toggleEpic = (epicId) => {
        setExpandedEpics(prev => ({
            ...prev,
            [epicId]: !prev[epicId]
        }));
    };

    const handleScroll = (e) => {
        // Sync vertical scroll between sidebar and grid
        if (e.target === sidebarRef.current && gridRef.current) {
            gridRef.current.scrollTop = e.target.scrollTop;
        } else if (e.target === gridRef.current && sidebarRef.current) {
            sidebarRef.current.scrollTop = e.target.scrollTop;
        }
    };

    const handleUpdateIssue = async (updatedIssue) => {
        // Optimistic update
        setEpics(prev => prev.map(e => {
            if (e._id === updatedIssue._id) return { ...e, ...updatedIssue }; // Update Epic
            if (e.children) {
                const childIdx = e.children.findIndex(c => c._id === updatedIssue._id);
                if (childIdx > -1) {
                    const newChildren = [...e.children];
                    newChildren[childIdx] = { ...newChildren[childIdx], ...updatedIssue };
                    return { ...e, children: newChildren };
                }
            }
            return e;
        }));

        try {
            const userStr = localStorage.getItem('user');
            const { token } = JSON.parse(userStr);
            await axios.put(`/api/workplace/issues/${updatedIssue._id}/status`, // Using status endpoint for general updates? Or need specific update endpoint
                updatedIssue,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // Note: Depending on backend, might need a generic update endpoint, currently using status endpoint as a proxy if it accepts body data, relying on previous knowledge or assumption.
            // If moveIssue endpoint exists, use that for dates. 
            // Let's assume we might need to implement a generic update logic or extend existing routes.
            // CHECK: workplaceRoutes has `moveIssue`.
            /* 
               router.put('/issues/:id/move', protect, moveIssue);
            */
            if (updatedIssue.startDate || updatedIssue.dueDate) {
                await axios.put(`/api/workplace/issues/${updatedIssue._id}/move`,
                    { startDate: updatedIssue.startDate, dueDate: updatedIssue.dueDate },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            }

        } catch (error) {
            console.error("Update failed", error);
            fetchData(); // Revert
        }
    };

    const openCreateModal = (type, parent = null) => {
        setCreateModalType(type);
        setCreateModalParent(parent);
        setIsCreateModalOpen(true);
    };

    const handleIssueCreated = () => {
        setIsCreateModalOpen(false);
        fetchData();
    };

    if (loading) return <div className="loading-spinner">Loading Timeline...</div>;

    return (
        <div className="timeline-container">
            <header className="timeline-header">
                <div className="timeline-header-left">
                    <span onClick={() => navigate('/workplace')} style={{ cursor: 'pointer', fontSize: '0.9rem', color: '#888' }}>Projects / </span>
                    <h1>{project?.name} Roadmap</h1>
                </div>
                <div className="timeline-controls">
                    <button className="secondary-btn" onClick={() => navigate(`/workplace/project/${projectId}/board`)}>
                        Board View
                    </button>
                    <button className="secondary-btn">
                        <Filter size={16} /> Filter
                    </button>
                    <button className="primary-btn" onClick={() => openCreateModal('epic')}>
                        <Plus size={16} /> Create Epic
                    </button>
                </div>
            </header>

            <div className="timeline-wrapper" style={{ display: 'flex', flexDirection: 'row', flex: 1, overflow: 'hidden', position: 'relative' }}>
                {/* Left Sidebar: List of Epics */}
                <div className="timeline-sidebar" ref={sidebarRef} onScroll={handleScroll} style={{ width: '450px', minWidth: '450px', display: 'flex', flexDirection: 'column', borderRight: '1px solid #333', background: 'rgba(30, 30, 40, 0.8)' }}>
                    {/* Sidebar Header */}
                    <div className="timeline-sidebar-header" style={{
                        display: 'flex',
                        height: '50px',
                        alignItems: 'center',
                        borderBottom: '1px solid #333',
                        background: 'rgba(20, 20, 30, 0.95)',
                        color: '#aaa',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        position: 'sticky',
                        top: 0,
                        zIndex: 5
                    }}>
                        <div style={{ flex: 2, padding: '0 1rem', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', height: '100%' }}>Issue</div>
                        <div style={{ width: '80px', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRight: '1px solid rgba(255,255,255,0.05)', height: '100%' }}>Status</div>
                        <div style={{ width: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>User</div>
                        <div style={{ width: '30px', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}></div> {/* Actions Header */}
                    </div>

                    {/* Sidebar Content */}
                    <div className="timeline-sidebar-content">
                        {epics.map(epic => (
                            <React.Fragment key={epic._id}>
                                <div
                                    className={`epic-row-sidebar ${expandedEpics[epic._id] ? 'expanded' : ''}`}
                                    onClick={() => toggleEpic(epic._id)}
                                    style={{ display: 'flex', height: '40px', borderBottom: '1px solid rgba(255,255,255,0.05)', alignItems: 'center', background: expandedEpics[epic._id] ? 'rgba(255,255,255,0.02)' : 'transparent' }}
                                >
                                    {/* Issue Column */}
                                    <div style={{ flex: 2, display: 'flex', alignItems: 'center', padding: '0 1rem', overflow: 'hidden', borderRight: '1px solid rgba(255,255,255,0.05)', height: '100%' }}>
                                        <button className="epic-toggle-btn" style={{ background: 'none', border: 'none', color: '#888', marginRight: '5px', cursor: 'pointer', display: 'flex' }}>
                                            {expandedEpics[epic._id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                        </button>
                                        <div className="epic-row-data" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            <span style={{ color: '#6c5ce7', background: 'rgba(108, 92, 231, 0.2)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>EPIC</span>
                                            <span>{epic.summary}</span>
                                        </div>
                                    </div>
                                    {/* Status Column */}
                                    <div style={{ width: '80px', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRight: '1px solid rgba(255,255,255,0.05)', height: '100%' }}>
                                        <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '2px', background: epic.status === 'Done' ? '#2ecc71' : '#3498db', color: '#fff' }}>
                                            {epic.status.toUpperCase()}
                                        </span>
                                    </div>
                                    {/* Assignee Column */}
                                    <div style={{ width: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                        {epic.assignee && (
                                            <div
                                                style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#ff7675', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: '#fff', cursor: 'pointer' }}
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Prevent toggling epic
                                                    setSelectedMember(epic.assignee);
                                                }}
                                                title={`View ${epic.assignee.firstName}'s performance`}
                                            >
                                                {epic.assignee.firstName?.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    {/* Actions Column */}
                                    <div style={{ width: '30px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                        <button
                                            className="icon-btn"
                                            title="Add Child Issue"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openCreateModal('story', epic);
                                            }}
                                            style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                </div>

                                {expandedEpics[epic._id] && epic.children?.map(child => (
                                    <div key={child._id} className="child-row-sidebar" style={{ display: 'flex', height: '36px', borderBottom: '1px solid rgba(255,255,255,0.02)', alignItems: 'center' }}>
                                        {/* Issue Column */}
                                        <div style={{ flex: 2, display: 'flex', alignItems: 'center', paddingLeft: '40px', paddingRight: '1rem', borderRight: '1px solid rgba(255,255,255,0.05)', height: '100%', overflow: 'hidden' }}>
                                            <span className={`issue-type ${child.type}`} style={{ marginRight: '6px', fontSize: '1rem', color: child.type === 'bug' ? '#e74c3c' : '#3498db' }}>•</span>
                                            <span style={{ color: '#aaa', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                <span style={{ color: '#666', marginRight: '5px' }}>{child.issueKey}</span>
                                                {child.summary}
                                            </span>
                                        </div>
                                        {/* Status Column */}
                                        <div style={{ width: '80px', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRight: '1px solid rgba(255,255,255,0.05)', height: '100%' }}>
                                            <span style={{ fontSize: '0.6rem', color: '#888' }}>{child.status}</span>
                                        </div>
                                        {/* Assignee Column */}
                                        <div style={{ width: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                            {child.assignee && (
                                                <div
                                                    style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#74b9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5rem', color: '#fff', cursor: 'pointer' }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedMember(child.assignee);
                                                    }}
                                                    title={`View ${child.assignee.firstName}'s performance`}
                                                >
                                                    {child.assignee.firstName?.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </React.Fragment>
                        ))}
                        {/* Placeholder for no epics */}
                        {epics.length === 0 && <div style={{ padding: '20px', color: '#666' }}>No Epics found. Create one to get started.</div>}
                    </div>
                </div>

                {/* Right Grid: Gantt Chart */}
                <div className="timeline-grid-wrapper" ref={gridRef} onScroll={handleScroll} style={{ flex: 1, overflow: 'auto', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                    <TimelineGrid
                        epics={epics}
                        expandedEpics={expandedEpics}
                        startDate={startDate}
                        endDate={endDate}
                        onUpdateIssue={handleUpdateIssue}
                    />
                </div>
            </div>

            {/* Create Issue Modal */}
            <CreateIssueModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                project={project}
                onIssueCreated={handleIssueCreated}
                initialType={createModalType}
                initialParent={createModalParent}
            />

            {/* Member Detail Modal (Performance) */}
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
                                    {project?.owner?._id === selectedMember._id ? 'Project Lead' : 'Team Member'}
                                </span>
                            </div>
                        </div>
                        <div className="performance-section">
                            <h5>Performance</h5>
                            <div className="metrics-grid">
                                <div className="metric-card assigned">
                                    <Layout size={16} className="metric-icon" />
                                    <span className="metric-value">
                                        {allIssues.filter(i => i.assignee?._id === selectedMember._id).length}
                                    </span>
                                    <span className="metric-label">Assigned</span>
                                </div>
                                <div className="metric-card progress">
                                    <Clock size={16} className="metric-icon" />
                                    <span className="metric-value">
                                        {allIssues.filter(i => i.assignee?._id === selectedMember._id && i.status === 'In Progress').length}
                                    </span>
                                    <span className="metric-label">Progress</span>
                                </div>
                                <div className="metric-card dev-testing">
                                    <FlaskConical size={16} className="metric-icon" />
                                    <span className="metric-value">
                                        {allIssues.filter(i => i.assignee?._id === selectedMember._id && i.status === 'Dev Testing').length}
                                    </span>
                                    <span className="metric-label">Testing</span>
                                </div>
                                <div className="metric-card completed">
                                    <CheckCircle size={16} className="metric-icon" />
                                    <span className="metric-value">
                                        {allIssues.filter(i => i.assignee?._id === selectedMember._id && i.status === 'Done').length}
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
        </div>
    );
};

export default Timeline;
