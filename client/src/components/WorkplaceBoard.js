import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../styles.css';
import './WorkplaceBoard.css';
import { Search, X, Filter, User, CheckCircle, Clock, Layout, FlaskConical, ChevronRight, Plus, MoreVertical, Target, Flag, MessageSquare, BarChart3, Zap, Settings, LogOut, Bell, ShieldAlert } from 'lucide-react';
import { useToast } from './Community/shared/Toast';
import { io } from 'socket.io-client';
import TicketDetailModal from './Workplace/components/TicketDetailModal';
import ProjectCommunication from './Workplace/ProjectCommunication';
import ProjectAnalytics from './Workplace/ProjectAnalytics';
import TeamSkillPanel from './Workplace/TeamSkillPanel';
import { createPortal } from 'react-dom';


const WorkplaceBoard = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [columns, setColumns] = useState(['To Do', 'In Progress', 'Testing', 'Completed']);
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
    const [isLeadOrOwner, setIsLeadOrOwner] = useState(false);
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [activeView, setActiveView] = useState('board'); // 'board', 'communication'
    const [pendingApprovals, setPendingApprovals] = useState([]);
    const [showApprovalPanel, setShowApprovalPanel] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showLeaveRequestsModal, setShowLeaveRequestsModal] = useState(false);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [addMemberEmail, setAddMemberEmail] = useState('');
    const [addMemberRole, setAddMemberRole] = useState('Member');
    const [repoUrlInput, setRepoUrlInput] = useState('');
    const [githubTokenInput, setGithubTokenInput] = useState('');
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [aiInsights, setAiInsights] = useState(null);
    const [inviteDescription, setInviteDescription] = useState('');
    const [inviteWorkDetails, setInviteWorkDetails] = useState('');
    const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);
    const [showInviteDetails, setShowInviteDetails] = useState(false);
    const [invitationSuccess, setInvitationSuccess] = useState(false);
    const toast = useToast();

    const today = new Date().toISOString().split('T')[0];

    // Separate effect just for socket to prevent disconnects on sprint change
    useEffect(() => {
        const userStr = localStorage.getItem('user');
        let newSocket;
        if (userStr) {
            const parsedUser = JSON.parse(userStr);
            const socketUrl = process.env.NODE_ENV === 'production' ? '/' : 'http://localhost:5000';
            
            newSocket = io(socketUrl, {
                auth: { token: parsedUser.token }
            });

            newSocket.on('ticketProgressUpdated', (data) => {
                const { ticketId, progress, status, commits } = data;
                setIssues(prevIssues => prevIssues.map(issue => {
                    if (issue._id === ticketId) {
                        return { ...issue, progressPercentage: progress, status: status, commits: commits || issue.commits };
                    }
                    return issue;
                }));
                
                setSelectedIssueDetail(prevDetail => {
                    if (prevDetail && prevDetail._id === ticketId) {
                        return { ...prevDetail, progressPercentage: progress, status: status, commits: commits || prevDetail.commits };
                    }
                    return prevDetail;
                });
            });

            newSocket.on('ticketCreated', (newTicket) => {
                if (newTicket.project === projectId) {
                    const mappedTicket = {
                        ...newTicket,
                        summary: newTicket.summary || newTicket.title,
                        assignee: newTicket.assignee || newTicket.assignedUser
                    };
                    setIssues(prev => [...prev, mappedTicket]);
                }
            });

            newSocket.on('ticketStatusUpdated', (updatedTicket) => {
                setIssues(prev => prev.map(issue => 
                    issue._id === updatedTicket._id ? { 
                        ...issue, 
                        status: updatedTicket.status, 
                        progressPercentage: updatedTicket.progressPercentage 
                    } : issue
                ));

                if (selectedIssueDetail?._id === updatedTicket._id) {
                    setSelectedIssueDetail(prev => ({ 
                        ...prev, 
                        status: updatedTicket.status, 
                        progressPercentage: updatedTicket.progressPercentage 
                    }));
                }
            });

            newSocket.on('ticketAssigned', (updatedTicket) => {
                const assignee = updatedTicket.assignedUser || updatedTicket.assignee;
                setIssues(prev => prev.map(issue => 
                    issue._id === updatedTicket._id ? { 
                        ...issue, 
                        assignee: assignee
                    } : issue
                ));

                if (selectedIssueDetail?._id === updatedTicket._id) {
                    setSelectedIssueDetail(prev => ({ 
                        ...prev, 
                        assignee: assignee
                    }));
                }
            });

            newSocket.on('ticketsAutoAssigned', (data) => {
                if (data.projectId === projectId) {
                    setRefreshTrigger(prev => prev + 1);
                }
            });

            newSocket.on('approvalRequested', () => setRefreshTrigger(prev => prev + 1));
            newSocket.on('approvalProcessed', () => setRefreshTrigger(prev => prev + 1));
            newSocket.on('approvalsCleared', () => setRefreshTrigger(prev => prev + 1));

            newSocket.on('ticketUpdated', (updatedTicket) => {
                const mappedTicket = {
                    ...updatedTicket,
                    summary: updatedTicket.summary || updatedTicket.title,
                    assignee: updatedTicket.assignedUser || updatedTicket.assignee
                };

                setIssues(prev => prev.map(issue => 
                    issue._id === updatedTicket._id ? mappedTicket : issue
                ));

                setSelectedIssueDetail(prev => {
                    if (prev && prev._id === updatedTicket._id) {
                        return mappedTicket;
                    }
                    return prev;
                });
            });

            newSocket.on('ticketDeleted', (data) => {
                const { ticketId } = data;
                setIssues(prev => prev.filter(issue => issue._id !== ticketId));
                
                setSelectedIssueDetail(prev => {
                    if (prev && prev._id === ticketId) {
                        return null;
                    }
                    return prev;
                });
            });
        }
        
        return () => {
            if (newSocket) newSocket.disconnect();
        };
    }, []); // Run ONCE exactly on mount

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            setCurrentUser(JSON.parse(userStr));
        }
        fetchProjectData();
    }, [projectId, selectedSprintId, refreshTrigger]);

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

            const [projRes, sprintsRes, approvalsRes] = await Promise.all([
                axios.get(`/api/workplace/projects/${projectId}`, config),
                axios.get(`/api/workplace/projects/${projectId}/sprints`, config),
                axios.get(`/api/approvals/${projectId}`, config).catch(() => ({ data: [] }))
            ]);

            setProject(projRes.data);
            setAllSprints(sprintsRes.data);
            setPendingApprovals(approvalsRes.data);

            // Fetch AI insights / team analysis
            try {
                const analysisRes = await axios.get(`/api/agents/team-analysis/${projectId}`, config);
                setAiInsights(analysisRes.data);
            } catch (err) {
                console.error('Error fetching team analysis:', err);
                // Non-critical error, don't break the whole board
            }

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

            // Calculate lead/owner permission
            const isOwner = projRes.data.owner?._id === _id || projRes.data.owner === _id;
            const isLead = projRes.data.members?.find(m => (m.user?._id === _id || m.user === _id) && m.role === 'Project Lead');
            setIsLeadOrOwner(isOwner || !!isLead);
            
            if (isOwner || !!isLead) {
                try {
                    const leaveRes = await axios.get(`/api/workplace/projects/${projectId}/leave-requests`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setLeaveRequests(leaveRes.data);
                } catch(err) { console.error('Error fetching leave requests:', err); }
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
            const res = await axios.post(`/api/tickets/auto-assign/${projectId}`, 
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success(res.data.message || 'Tickets assigned correctly', 3000);
            fetchProjectData();
        } catch (error) {
            console.error('Auto-assign error:', error);
            toast.error(error.response?.data?.message || 'Failed to auto-assign tickets', 5000);
        }
    };

    const handleApprovalAction = async (requestId, action) => {
        try {
            const { token } = currentUser;
            await axios.post(`/api/approvals/${action}/${requestId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(`Request ${action}d successfully`, 3000);
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            console.error('Approval Error:', error);
            toast.error(error.response?.data?.message || 'Error processing approval', 4000);
        }
    };

    const handleUpdateSettings = async () => {
        try {
            const { token } = currentUser;
            await axios.put(`/api/workplace/projects/${projectId}/settings`,
                { 
                    repositoryUrl: repoUrlInput,
                    githubAccessToken: githubTokenInput
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Project settings updated', 3000);
            setShowSettingsModal(false);
            fetchProjectData();
        } catch (error) {
            console.error('Error updating settings:', error);
            toast.error(error.response?.data?.message || 'Error updating settings', 4000);
        }
    };

    const handleKickMember = async (userId) => {
        if (!window.confirm("Are you sure you want to kick this member from the project?")) return;
        try {
            const { token } = currentUser;
            await axios.delete(`/api/workplace/projects/${projectId}/members/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Member removed successfully', 3000);
            fetchProjectData();
        } catch (error) {
            console.error('Error kicking member:', error);
            toast.error(error.response?.data?.message || 'Error removing member', 4000);
        }
    };

    const handleGenerateInviteDetails = async () => {
        if (!addMemberRole) return;
        setIsGeneratingInvite(true);
        setShowInviteDetails(true);
        try {
            const userStr = localStorage.getItem('user');
            const { token } = userStr ? JSON.parse(userStr) : {};
            if (!token) return navigate('/login');
            
            const res = await axios.post(`/api/workplace/projects/${projectId}/generate-invite-details`,
                { role: addMemberRole, email: addMemberEmail },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setInviteDescription(res.data.description);
            setInviteWorkDetails(res.data.workDetails);
            toast.success('AI description generated!', 2000);
        } catch (error) {
            console.error('Error generating invite details:', error);
            toast.error('Failed to generate AI description');
        } finally {
            setIsGeneratingInvite(false);
        }
    };

    const handleAddMember = async (e) => {
        e.preventDefault();
        if (!addMemberEmail) return;
        try {
            const userStr = localStorage.getItem('user');
            const { token } = userStr ? JSON.parse(userStr) : {};
            if (!token) return navigate('/login');
            
            await axios.post(`/api/workplace/projects/${projectId}/members`,
                { 
                    email: addMemberEmail, 
                    role: addMemberRole,
                    description: inviteDescription,
                    workDetails: inviteWorkDetails
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Invitation sent successfully!');
            setShowAddMemberModal(false);
            setInvitationSuccess(true);
            fetchProjectData();
        } catch (error) {
            console.error('Error inviting member:', error);
            toast.error(error.response?.data?.message || 'Error sending invitation', 4000);
        }
    };

    const openAddMemberModal = () => {
        setAddMemberEmail('');
        setAddMemberRole('Member');
        setInviteDescription('');
        setInviteWorkDetails('');
        setInvitationSuccess(false);
        setShowInviteDetails(false);
        setShowAddMemberModal(true);
    };

    const handleLeaveProjectRequest = async () => {
        if (!window.confirm("Are you sure you want to request to leave this project?")) return;
        try {
            const { token } = currentUser;
            await axios.delete(`/api/workplace/projects/${projectId}/leave`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Leave request sent to project lead/owner', 3000);
        } catch (error) {
            console.error('Error leaving project:', error);
            toast.error(error.response?.data?.message || 'Error requesting to leave', 4000);
        }
    };

    const handleDeleteProject = async () => {
        const confirmFirst = window.confirm("Are you sure you want to PERMANENTLY delete this project?");
        if (!confirmFirst) return;

        const confirmSecond = window.prompt("This action is irreversible. All tickets, sprints, and modules will be deleted. To confirm, please type the project name exactly: " + project.name);
        
        if (confirmSecond !== project.name) {
            toast.error("Project name didn't match. Deletion cancelled.");
            return;
        }

        try {
            const { token } = currentUser;
            await axios.delete(`/api/workplace/projects/${projectId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Project deleted successfully', 3000);
            navigate('/workplace');
        } catch (error) {
            console.error('Error deleting project:', error);
            toast.error(error.response?.data?.message || 'Error deleting project', 4000);
        }
    };

    const handleLeaveResponse = async (userId, action) => {
        try {
            const { token } = currentUser;
            await axios.post(`/api/workplace/projects/${projectId}/leave-requests/${userId}/respond`,
                { action },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(`Leave request ${action}d`, 3000);
            fetchProjectData();
            if (leaveRequests.length <= 1) setShowLeaveRequestsModal(false);
        } catch (error) {
            console.error('Error responding to leave request:', error);
            toast.error(error.response?.data?.message || 'Error responding to request', 4000);
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
                // Restriction: Only Project Lead or Project Owner can move to 'Completed'
                if (column === 'Completed' && !isLeadOrOwner) {
                    toast.error('Only Project Lead or Project Owner can mark tickets as Completed', 4000);
                    return;
                }

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
            case 'highest': return 'var(--error)';
            case 'high': return 'var(--warning)';
            case 'medium': return 'var(--accent-primary)';
            case 'low': return 'var(--success)';
            case 'lowest': return 'var(--text-secondary)';
            default: return 'var(--border-color)';
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
            case 'To Do': return 'var(--accent-secondary)';
            case 'In Progress': return 'var(--accent-primary)';
            case 'Testing': return 'var(--accent-secondary)';
            case 'Completed': return 'var(--success)';
            default: return 'var(--border-color)';
        }
    };

    const filteredIssues = issues.filter(issue =>
        (issue.summary || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (issue.ticketCode || issue.issueKey || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!project) return <div className="loading-spinner">Loading Board...</div>;

    return (
        <div className="workplace-board-container">
            <header className="board-header">
                <div className="header-left">
                    <div className="board-breadcrumbs">
                        <span onClick={() => navigate('/workplace')} style={{ cursor: 'pointer' }}>Projects</span>
                        <ChevronRight size={16} />
                        <span className="project-name">{project.name}</span>
                        <ChevronRight size={16} />
                        <span className="current-page">Board</span>
                    </div>

                    <div className="project-info-header">
                        <div className="project-avatar">
                            {project.key.substring(0, 2)}
                        </div>
                        <div className="project-title-content">
                            <h1>{project.name} Board</h1>
                            <p className="project-description">{project.description}</p>
                        </div>
                    </div>
                </div>

                <div className="board-actions">
                    <div className="board-team">
                        <div className="team-avatars">
                            {project.members?.slice(0, 5).map((memberObj, idx) => {
                                const member = memberObj.user;
                                const isProjectOwner = member?._id === project.owner?._id || member?._id === project.owner;
                                return (
                                    <div
                                        key={member?._id || idx}
                                        className="member-avatar-wrapper"
                                        title={`${member?.firstName || 'User'} ${member?.lastName || ''} (${memberObj.role})`}
                                        onClick={() => setSelectedMember(memberObj)}
                                        style={{ zIndex: 10 - idx }}
                                    >
                                        {member?.avatar ? (
                                            <img
                                                src={member.avatar}
                                                alt={member.firstName}
                                                className="member-avatar-img"
                                            />
                                        ) : (
                                            <div className={`member-avatar-initials ${isProjectOwner ? 'owner' : ''}`}>
                                                {member?.firstName?.charAt(0)}{member?.lastName?.charAt(0) || memberObj.role[0]}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {project.members?.length > 5 && (
                                <div className="member-avatar-wrapper more-indicator">
                                    <div className="member-avatar-initials">+{project.members.length - 5}</div>
                                </div>
                            )}
                        </div>
                        {isLeadOrOwner && (
                            <button className="add-member-btn" title="Add Team Member" onClick={openAddMemberModal}>
                                <Plus size={16} />
                                <span>Add Member</span>
                            </button>
                        )}
                    </div>

                    {activeSprint && (
                        <div className="sprint-info">
                            <Target size={16} />
                            <span>{activeSprint.name}</span>
                        </div>
                    )}

                    <div className="action-buttons-group">
                        <button className="action-btn" onClick={() => setIsSidebarOpen(true)}>
                            <Search size={16} />
                            <span>Search</span>
                        </button>

                        {!isLeadOrOwner && (
                            <button className="action-btn" style={{ color: '#ff4757', borderColor: '#ff4757' }} onClick={handleLeaveProjectRequest} title="Leave Project">
                                <LogOut size={16} />
                                <span>Leave Project</span>
                            </button>
                        )}

                        {isLeadOrOwner && leaveRequests.length > 0 && (
                            <button className="action-btn notify-btn" onClick={() => setShowLeaveRequestsModal(true)} title="Pending Leave Requests">
                                <Bell size={16} />
                                <span>Leave Requests ({leaveRequests.length})</span>
                            </button>
                        )}

                        {isLeadOrOwner && (
                            <button className="action-btn" onClick={() => { 
                                setRepoUrlInput(project.repositoryUrl || ''); 
                                setGithubTokenInput(project.githubAccessToken || '');
                                setShowSettingsModal(true); 
                            }} title="Project Settings">
                                <Settings size={16} />
                                <span>Settings</span>
                            </button>
                        )}
                        
                        {isLeadOrOwner && (
                            <button className="action-btn" onClick={handleAutoAssign} title="AI Auto-Assign Tickets">
                                <Zap size={16} />
                                <span>Auto-Assign</span>
                            </button>
                        )}
                        {isLeadOrOwner && pendingApprovals.length > 0 && (
                            <button className="action-btn" style={{ position: 'relative' }} onClick={() => setShowApprovalPanel(true)} title="Pending Approvals">
                                <Target size={16} />
                                <span>Approvals ({pendingApprovals.length})</span>
                            </button>
                        )}

                        <button className={`action-btn ${activeView === 'communication' ? 'active' : ''}`} onClick={() => setActiveView(activeView === 'communication' ? 'board' : 'communication')}>
                            <MessageSquare size={16} />
                            <span>Communication</span>
                        </button>

                        {isLeadOrOwner && (
                            <button className={`action-btn ${activeView === 'analytics' ? 'active' : ''}`} onClick={() => setActiveView(activeView === 'analytics' ? 'board' : 'analytics')}>
                                <BarChart3 size={16} />
                                <span>Analytics</span>
                            </button>
                        )}

                        <button className="primary-nav-btn" onClick={() => navigate(`/workplace/project/${projectId}/ai-planner`)}>
                            <FlaskConical size={18} />
                            <span>AI Command Center</span>
                        </button>
                    </div>
                </div>

                {project.owner._id === currentUser?._id && leaveRequests.length > 0 && (
                    <div className="leave-requests-banner" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--error)', borderRadius: '8px', padding: '12px 20px', marginTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: 'var(--error)', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                                {leaveRequests.length}
                            </div>
                            <div>
                                <h4 style={{ margin: 0, color: 'var(--error)', fontSize: '0.9rem' }}>Pending Leave Requests</h4>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Members are waiting for your approval to leave the project.</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            {leaveRequests.map(req => (
                                <div key={req.user._id} className="leave-request-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-tertiary)', padding: '4px 8px', borderRadius: '4px' }}>
                                    <span style={{ fontSize: '0.85rem' }}>{req.user.firstName} {req.user.lastName}</span>
                                    <button
                                        onClick={() => handleRespondToLeaveRequest(req.user._id, 'approve')}
                                        style={{ background: 'var(--success)', border: 'none', color: 'white', padding: '2px 8px', borderRadius: '3px', cursor: 'pointer', fontSize: '0.75rem' }}
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleRespondToLeaveRequest(req.user._id, 'reject')}
                                        style={{ background: 'var(--error)', border: 'none', color: 'white', padding: '2px 8px', borderRadius: '3px', cursor: 'pointer', fontSize: '0.75rem' }}
                                    >
                                        Decline
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </header>

            {activeView !== 'communication' && activeView !== 'analytics' && (
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
                        <div className="stat-item" title="Total tickets in current sprint">
                            <span className="stat-label">Total</span>
                            <span className="stat-value">{issues.length}</span>
                        </div>
                        <div className="stat-item" title="Remaining tasks">
                            <span className="stat-label">To Do</span>
                            <span className="stat-value">{issues.filter(i => i.status === 'To Do').length}</span>
                        </div>
                        <div className="stat-item" title="Active development">
                            <span className="stat-label">In Progress</span>
                            <span className="stat-value" style={{ color: 'var(--accent-secondary, #00D8FF)' }}>
                                {issues.filter(i => i.status === 'In Progress').length}
                            </span>
                        </div>
                        <div className="stat-item" title="Under validation">
                            <span className="stat-label">Testing</span>
                            <span className="stat-value" style={{ color: '#FFD700' }}>
                                {issues.filter(i => i.status === 'Testing').length}
                            </span>
                        </div>
                        <div className="stat-item" title="Successfully closed">
                            <span className="stat-label">Completed</span>
                            <span className="stat-value accent">
                                {issues.filter(i => (i.status === 'Completed' || i.status === 'Done')).length}
                            </span>
                        </div>
                    </div>

                    </div>
            )}



            {activeView === 'communication' ? (
                <ProjectCommunication projectId={projectId} />
            ) : activeView === 'analytics' ? (
                <ProjectAnalytics projectId={projectId} />
            ) : (
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
                                            id={`issue-${issue._id}`}
                                            className={`issue-card status-${issue.status.toLowerCase().replace(/\s+/g, '-')}`}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, issue._id)}
                                            onClick={() => setSelectedIssueDetail(issue)}
                                        >
                                            <div className="issue-header">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span className="issue-key">{issue.ticketCode || issue.issueKey}</span>
                                                    {pendingApprovals.some(a => a.ticket._id === issue._id) && (
                                                        <span style={{ fontSize: '10px', background: 'var(--warning)', color: '#000', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>Pending Approval</span>
                                                    )}
                                                </div>
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

                                                {issue.progressPercentage !== undefined && (
                                                    <div className="issue-progress-bar-container" style={{ width: '100%', height: '4px', background: 'var(--bg-secondary)', borderRadius: '4px', marginTop: '8px', overflow: 'hidden' }}>
                                                        <div style={{ width: `${issue.progressPercentage}%`, height: '100%', background: 'var(--success)', transition: 'width 0.5s ease-in-out' }}></div>
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
                                const element = document.getElementById(`issue-${issue._id}`);
                                if (element) {
                                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    element.classList.add('highlight-card');
                                    setTimeout(() => element.classList.remove('highlight-card'), 2000);
                                    setIsSidebarOpen(false);
                                }
                            }}>
                                <div className="result-header">
                                    <span className="result-key">{issue.ticketCode || issue.issueKey}</span>
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
            {selectedMember && createPortal(
                <>
                    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999 }} onClick={() => setSelectedMember(null)} />
                    <div className="member-detail-modal" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10000 }}>
                        <div className="member-detail-header">
                            <div className="member-detail-avatar" style={{ backgroundColor: 'hsl(200, 60%, 40%)' }}>
                                {selectedMember.user.firstName?.charAt(0)}{selectedMember.user.lastName?.charAt(0)}
                            </div>
                            <div className="member-detail-info">
                                <h4>{selectedMember.user.firstName} {selectedMember.user.lastName}</h4>
                                <p>{selectedMember.user.email}</p>
                                <span className={`member-detail-role role-badge ${selectedMember.role.replace(' ', '-').toLowerCase()}`}>
                                    {selectedMember.role}
                                </span>
                            </div>
                        </div>
                        <div className="performance-section">
                            <h5>Performance Metrics</h5>
                            <div className="metrics-grid">
                                <div className="metric-card assigned">
                                    <Layout size={20} className="metric-icon" />
                                    <span className="metric-value">
                                        {issues.filter(i => i.assignee?._id === selectedMember.user._id).length}
                                    </span>
                                    <span className="metric-label">Assigned</span>
                                </div>
                                <div className="metric-card progress">
                                    <Clock size={20} className="metric-icon" />
                                    <span className="metric-value">
                                        {issues.filter(i => i.assignee?._id === selectedMember.user._id && i.status === 'In Progress').length}
                                    </span>
                                    <span className="metric-label">In Progress</span>
                                </div>
                                <div className="metric-card dev-testing">
                                    <FlaskConical size={20} className="metric-icon" />
                                    <span className="metric-value">
                                        {issues.filter(i => i.assignee?._id === selectedMember.user._id && i.status === 'Testing').length}
                                    </span>
                                    <span className="metric-label">Testing</span>
                                </div>
                                <div className="metric-card completed">
                                    <CheckCircle size={20} className="metric-icon" />
                                    <span className="metric-value">
                                        {issues.filter(i => i.assignee?._id === selectedMember.user._id && i.status === 'Completed').length}
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
                </>,
                document.body
            )}

            {showApprovalPanel && createPortal(
                <>
                    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999 }} onClick={() => setShowApprovalPanel(false)} />
                    <div className="member-detail-modal" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10000, width: '500px', maxHeight: '80vh', overflowY: 'auto' }}>
                        <div className="member-detail-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                            <div className="member-detail-info">
                                <h4>Pending System Approvals</h4>
                            </div>
                        </div>
                        <div className="performance-section" style={{ padding: '15px' }}>
                            {pendingApprovals.length === 0 ? <p>No pending approvals.</p> : pendingApprovals.map(req => (
                                <div key={req._id} style={{ background: 'var(--bg-tertiary)', padding: '10px', borderRadius: '8px', marginBottom: '10px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <strong>{req.ticket.ticketCode || 'Ticket'}</strong>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(req.timestamp).toLocaleString()}</span>
                                    </div>
                                    <p style={{ margin: '5px 0', fontSize: '0.9rem' }}>{req.originalCommitMessage}</p>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', marginBottom: '10px' }}>
                                        Proposed Status: {req.proposedStatus} | Progress: {req.proposedProgress}%
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button onClick={() => handleApprovalAction(req._id, 'approve')} style={{ background: 'var(--success)', border: 'none', color: 'white', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', flex: 1 }}>Approve</button>
                                        <button onClick={() => handleApprovalAction(req._id, 'reject')} style={{ background: 'var(--error)', border: 'none', color: 'white', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', flex: 1 }}>Reject</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="member-detail-actions">
                            <button className="close-detail-btn" onClick={() => setShowApprovalPanel(false)}>Close</button>
                        </div>
                    </div>
                </>,
                document.body
            )}

            {/* Ticket Detail Modal */}
            {selectedIssueDetail && (
                <TicketDetailModal
                    issue={selectedIssueDetail}
                    onClose={() => setSelectedIssueDetail(null)}
                    canManage={isLeadOrOwner}
                    projectMembers={project.members}
                    getPriorityColor={getPriorityColor}
                    onUpdate={fetchProjectData}
                />
            )}

            {/* Team Skill Panel */}
            {selectedMember && aiInsights && (
                <TeamSkillPanel 
                    members={project.members} 
                    analysis={aiInsights}
                    isOwner={isLeadOrOwner}
                    projectId={projectId}
                    onMemberUpdate={fetchProjectData}
                    onKickMember={handleKickMember}
                />
            )}

            {/* Project Settings Modal */}
            {showSettingsModal && createPortal(
                <>
                    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999 }} onClick={() => setShowSettingsModal(false)} />
                    <div className="member-detail-modal" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10000, width: '450px' }}>
                        <div className="member-detail-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                            <div className="member-detail-info">
                                <h4>Project Settings</h4>
                            </div>
                        </div>
                        <div className="performance-section" style={{ padding: '20px 15px' }}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 'bold' }}>GitHub / GitLab Repository URL</label>
                                <input 
                                    type="text" 
                                    value={repoUrlInput}
                                    onChange={(e) => setRepoUrlInput(e.target.value)}
                                    placeholder="e.g. https://github.com/username/repo"
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                                />
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                                    Link your project to a remote Git repository to enable automated workflow webhooks and Kanban ticket progress tracking.
                                </p>
                            </div>
                            
                            <div style={{ marginBottom: '8px' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 'bold' }}>GitHub Personal Access Token</label>
                                <input 
                                    type="password" 
                                    value={githubTokenInput}
                                    onChange={(e) => setGithubTokenInput(e.target.value)}
                                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                                />
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                                    (Optional) Provide a Personal Access Token with "repo" permissions to automatically invite developers as collaborators when they join. This is stored securely.
                                </p>
                            </div>

                            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                <h5 style={{ color: 'var(--error)', marginBottom: '10px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <ShieldAlert size={16} />
                                    Danger Zone
                                </h5>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                                    Once you delete a project, there is no going back. Please be certain.
                                </p>
                                <button 
                                    onClick={handleDeleteProject}
                                    style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px solid var(--error)', color: 'var(--error)', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                >
                                    <LogOut size={16} />
                                    Delete This Project
                                </button>
                            </div>
                        </div>
                        <div className="member-detail-actions" style={{ display: 'flex', gap: '10px', padding: '15px', borderTop: '1px solid var(--border-color)' }}>
                            <button className="close-detail-btn" style={{ flex: 1, background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} onClick={() => setShowSettingsModal(false)}>Cancel</button>
                            <button className="assign-user-btn" style={{ flex: 1, justifyContent: 'center' }} onClick={handleUpdateSettings}>Save Settings</button>
                        </div>
                    </div>
                </>,
                document.body
            )}

            {/* Add Member Modal */}
            {showAddMemberModal && createPortal(
                <>
                    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999 }} onClick={() => setShowAddMemberModal(false)} />
                    <div className="member-detail-modal" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10000, width: '450px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="member-detail-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                            <div className="member-detail-info">
                                <h4>{invitationSuccess ? 'Invitation Sent!' : 'Invite Team Member'}</h4>
                            </div>
                            <button className="close-detail-btn" onClick={() => setShowAddMemberModal(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        
                        {!invitationSuccess ? (
                            <div className="performance-section" style={{ padding: '20px 15px' }}>
                                <form onSubmit={handleAddMember} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 'bold' }}>Email Address</label>
                                        <input 
                                            type="email" 
                                            className="member-input"
                                            value={addMemberEmail}
                                            onChange={(e) => setAddMemberEmail(e.target.value)}
                                            placeholder="colleague@example.com"
                                            required
                                            style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 'bold' }}>Assigned Role</label>
                                        <select 
                                            className="member-input"
                                            value={addMemberRole}
                                            onChange={(e) => setAddMemberRole(e.target.value)}
                                            required
                                            style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                                        >
                                            <option value="Lead">Lead</option>
                                            <option value="Admin">Admin</option>
                                            <option value="Member">Member</option>
                                        </select>
                                    </div>

                                    <div style={{ padding: '10px', background: 'rgba(0, 216, 255, 0.05)', borderRadius: '8px', border: '1px dashed rgba(0, 216, 255, 0.2)' }}>
                                        {!showInviteDetails ? (
                                            <button 
                                                type="button" 
                                                onClick={handleGenerateInviteDetails}
                                                disabled={isGeneratingInvite || !addMemberEmail}
                                                style={{ width: '100%', padding: '8px', background: 'transparent', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold' }}
                                            >
                                                <Zap size={16} className={isGeneratingInvite ? 'spin' : ''} />
                                                {isGeneratingInvite ? 'Generating...' : '✨ Auto-Generate Invite Description'}
                                            </button>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 'bold', textTransform: 'uppercase' }}>AI-Generated Brief</span>
                                                    <button 
                                                        type="button" 
                                                        onClick={handleGenerateInviteDetails} 
                                                        disabled={isGeneratingInvite}
                                                        style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                    >
                                                        <RotateCcw size={12} className={isGeneratingInvite ? 'spin' : ''} /> Regenerate
                                                    </button>
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Project Opportunity</label>
                                                    <textarea 
                                                        value={inviteDescription}
                                                        onChange={(e) => setInviteDescription(e.target.value)}
                                                        style={{ width: '100%', minHeight: '80px', borderRadius: '4px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#eee', padding: '8px', fontSize: '0.8rem' }}
                                                    />
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>The Work</label>
                                                    <textarea 
                                                        value={inviteWorkDetails}
                                                        onChange={(e) => setInviteWorkDetails(e.target.value)}
                                                        style={{ width: '100%', minHeight: '80px', borderRadius: '4px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#eee', padding: '8px', fontSize: '0.8rem' }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button type="button" onClick={() => setShowAddMemberModal(false)} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)' }}>Cancel</button>
                                        <button type="submit" style={{ flex: 1, padding: '10px', background: 'var(--accent-primary)', border: 'none', borderRadius: '6px', color: '#1a1a1a', fontWeight: 'bold' }}>Send Invite</button>
                                    </div>
                                </form>
                            </div>
                        ) : (
                            <div className="performance-section" style={{ padding: '20px 15px', textAlign: 'center' }}>
                                <CheckCircle size={48} color="#00FFA3" style={{ marginBottom: '15px' }} />
                                <h4>Invitation Sent!</h4>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>A workspace invitation has been sent to {addMemberEmail}.</p>
                                <button className="create-btn" style={{ marginTop: '15px', width: '100%' }} onClick={() => setShowAddMemberModal(false)}>Close</button>
                            </div>
                        )}
                    </div>
                </>,
                document.body
            )}

            {invitationSuccess && createPortal(
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="modal-content success-modal" style={{ textAlign: 'center', padding: '40px 24px', width: '450px', position: 'relative', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(0, 255, 163, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <CheckCircle size={48} color="#00FFA3" />
                            </div>
                        </div>
                        <h2 style={{ fontSize: '1.8rem', marginBottom: '12px', color: 'var(--text-primary)', fontWeight: 'bold' }}>Invitation Sent!</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '1.1rem', lineHeight: '1.5' }}>
                            A workspace invitation and professional brief has been sent to <br/><strong>{addMemberEmail}</strong>.
                        </p>
                        <button 
                            className="create-btn ai-sparkle" 
                            style={{ width: '100%', padding: '14px', borderRadius: '8px', fontSize: '1rem', background: '#00FFA3', color: '#000', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            onClick={() => setInvitationSuccess(false)}
                        >
                            <CheckCircle size={18} /> Got it
                        </button>
                    </div>
                </div>,
                document.body
            )}

            {/* Leave Requests Modal */}
            {showLeaveRequestsModal && createPortal(
                <>
                    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999 }} onClick={() => setShowLeaveRequestsModal(false)} />
                    <div className="member-detail-modal" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10000, width: '450px' }}>
                        <div className="member-detail-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                            <div className="member-detail-info">
                                <h4>Pending Leave Requests</h4>
                            </div>
                            <button className="close-detail-btn" onClick={() => setShowLeaveRequestsModal(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="performance-section" style={{ padding: '20px 15px' }}>
                            {leaveRequests.length === 0 ? (
                                <p style={{ color: 'var(--text-secondary)' }}>No pending requests.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    {leaveRequests.map((req, idx) => (
                                        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                {req.user?.profileImageUrl ? (
                                                    <img src={req.user.profileImageUrl} alt="user avatar" style={{ width: '30px', height: '30px', borderRadius: '50%' }} />
                                                ) : (
                                                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px' }}>
                                                        {req.user?.firstName?.[0] || 'U'}
                                                    </div>
                                                )}
                                                <div>
                                                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>{req.user?.firstName} {req.user?.lastName}</p>
                                                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>{req.user?.email}</p>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button onClick={() => handleLeaveResponse(req.user?._id, 'reject')} style={{ padding: '6px 10px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-primary)' }}>Reject</button>
                                                <button onClick={() => handleLeaveResponse(req.user?._id, 'approve')} style={{ padding: '6px 10px', background: '#ff4757', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'white' }}>Approve</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>,
                document.body
            )}
        </div>
    );
};

export default WorkplaceBoard;
