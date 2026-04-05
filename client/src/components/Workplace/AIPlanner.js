import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProjectInitializationInput from './ProjectInitializationInput';
import ProjectImprovisationInput from './ProjectImprovisationInput';
import ModuleView from './ModuleView';
import TeamSkillPanel from './TeamSkillPanel';
import AISuggestionsPanel from './AISuggestionsPanel';
import TeamRequirementPanel from './TeamRequirementPanel';
import SprintTimelineView from './SprintTimelineView';
import TeamSuggestionsPanel from './TeamSuggestionsPanel';
import TicketDetailModal from './components/TicketDetailModal';
import { Rocket, Brain, Users, Layout, Zap, AlertTriangle, Calendar, Users2 } from 'lucide-react';

const AIPlanner = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [planData, setPlanData] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [activeTab, setActiveTab] = useState('modules'); // 'modules', 'timeline', 'workforce'
    const [selectedIssueDetail, setSelectedIssueDetail] = useState(null);

    useEffect(() => {
        // Reset state when project changes to prevent data leakage
        setProject(null);
        setPlanData(null);
        setAnalysis(null);
        setLoading(true);
        fetchFullPlan();
        fetchAnalysis();
    }, [projectId]);

    const fetchFullPlan = async () => {
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) return;
            const { token } = JSON.parse(userStr);
            const { data } = await axios.get(`/api/agents/full-plan/${projectId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setProject(data.project);
            if ((data.modules && data.modules.length > 0) || (data.requirements && data.requirements.length > 0)) {
                setPlanData({
                    modules: data.modules || [],
                    tickets: data.tickets || [],
                    sprints: data.sprints || [],
                    technologies: data.technologies || [],
                    requirements: data.requirements || []
                });
            } else {
                setPlanData(null);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching full plan:', error);
            setLoading(false);
        }
    };

    const fetchAnalysis = async () => {
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) return;
            const { token } = JSON.parse(userStr);
            const { data } = await axios.get(`/api/agents/team-analysis/${projectId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAnalysis(data);
        } catch (error) {
            console.error('Error fetching analysis:', error);
        }
    };

    const handlePlanGenerated = (data) => {
        // After generation, we can either use the returned data or re-fetch
        fetchFullPlan();
        fetchAnalysis();
    };

    const handleResetPlan = async () => {
        if (!window.confirm('Are you sure you want to reset the current SDLC plan? This will delete all generated modules, tickets, and sprints.')) return;

        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) return;
            const { token } = JSON.parse(userStr);

            // We can reuse the analyze-project logic or a dedicated clear endpoint if we had one
            // For now, let's just clear the local state to show the input box again
            // and let the next generation handle the backend cleanup (analyze-project already does this)
            setPlanData(null);
        } catch (error) {
            console.error('Error resetting plan:', error);
        }
    };

    const handleKickMember = async (userId) => {
        if (!window.confirm("Are you sure you want to kick this member from the project?")) return;
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) return;
            const { token } = JSON.parse(userStr);
            await axios.delete(`/api/workplace/projects/${projectId}/members/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchFullPlan();       // Refresh project data
            fetchAnalysis();       // Refresh AI analysis if any dependencies changed
        } catch (error) {
            console.error('Error kicking member:', error);
            alert(error.response?.data?.message || 'Error removing member');
        }
    };

    if (loading) return <div className="loading">Initializing AI Assistant...</div>;

    const isLeadOrOwner =
        project?.owner?._id === JSON.parse(localStorage.getItem('user'))?._id ||
        project?.owner === JSON.parse(localStorage.getItem('user'))?._id ||
        project?.members?.find(m => m.user?._id === JSON.parse(localStorage.getItem('user'))?._id)?.role === 'Project Lead';

    return (
        <div className="ai-workspace-container" key={projectId}>
            <header className="ai-workspace-header">
                <div className="header-brand">
                    <div className="brain-icon-wrapper">
                        <Brain size={32} color="#00FFA3" className="glow-icon" />
                    </div>
                    <div className="header-title">
                        <h1>{project ? project.name : ''} AI Command Center</h1>
                        {/* <p>Agentic AI SDLC Assistant <span className="status-active">isActive</span></p> */}
                    </div>
                </div>
                <div className="planner-controls">
                    <button className="primary-nav-btn" onClick={() => navigate(`/workplace/project/${projectId}/board`)}>
                        <Layout size={18} /> View Monitoring Board
                    </button>
                    {planData && isLeadOrOwner && (
                        <button className="primary-nav-btn reset-btn" onClick={handleResetPlan}>
                            <AlertTriangle size={18} /> Reset Plan
                        </button>
                    )}
                    <button className="primary-nav-btn back-btn" onClick={() => navigate('/workplace')}>
                        Exit to Projects
                    </button>
                </div>
            </header>

            <div className="ai-planner-tabs">
                <button className={`tab-btn ${activeTab === 'modules' ? 'active' : ''}`} onClick={() => setActiveTab('modules')}>
                    <Layout size={18} /> Modules & Tickets
                </button>
                <button className={`tab-btn ${activeTab === 'timeline' ? 'active' : ''}`} onClick={() => setActiveTab('timeline')}>
                    <Calendar size={18} /> Sprint Timeline
                </button>
                {isLeadOrOwner && (
                    <>
                        <button className={`tab-btn ${activeTab === 'workforce' ? 'active' : ''}`} onClick={() => setActiveTab('workforce')}>
                            <Users2 size={18} /> Team Requirements
                        </button>
                        <button className={`tab-btn ${activeTab === 'suggestions' ? 'active' : ''}`} onClick={() => setActiveTab('suggestions')}>
                            <Users size={18} /> Team Suggestions
                        </button>
                    </>
                )}
            </div>

            <div className="ai-workspace-grid">
                <div className="left-panel">
                    {!planData && activeTab === 'modules' && (
                        <ProjectInitializationInput
                            projectId={projectId}
                            projectName={project ? project.name : ''}
                            onPlanGenerated={handlePlanGenerated}
                        />
                    )}

                    {planData && activeTab === 'modules' && (
                        <>
                            <ModuleView
                                modules={planData.modules}
                                tickets={planData.tickets}
                                technologies={planData.technologies}
                                canManage={isLeadOrOwner}
                                onTicketClick={(ticket) => setSelectedIssueDetail(ticket)}
                            />
                            {isLeadOrOwner && (
                                <ProjectImprovisationInput
                                    projectId={projectId}
                                    onPlanImprovised={handlePlanGenerated}
                                />
                            )}
                        </>
                    )}

                    {activeTab === 'timeline' && (
                        <SprintTimelineView
                            sprints={planData?.sprints || []}
                            tickets={planData?.tickets || []}
                            projectId={projectId}
                            project={project}
                            canManage={isLeadOrOwner}
                            onUpdate={fetchFullPlan}
                            modules={planData?.modules || []}
                            onTicketClick={(ticket) => setSelectedIssueDetail(ticket)}
                        />
                    )}

                    {activeTab === 'workforce' && (
                        <TeamRequirementPanel
                            requirements={planData?.requirements || []}
                        />
                    )}
                    {activeTab === 'suggestions' && (
                        <TeamSuggestionsPanel projectId={projectId} />
                    )}
                </div>

                <div className="right-panel">
                    <TeamSkillPanel
                        members={project ? (project.members || []) : []}
                        analysis={analysis}
                        projectId={projectId}
                        isOwner={isLeadOrOwner}
                        onMemberUpdate={(updatedProject) => setProject(updatedProject)}
                        onKickMember={handleKickMember}
                    />
                    <AISuggestionsPanel analysis={analysis} />
                </div>
            </div>

            {selectedIssueDetail && (
                <TicketDetailModal
                    issue={selectedIssueDetail}
                    onClose={() => setSelectedIssueDetail(null)}
                    canManage={isLeadOrOwner}
                    projectMembers={project?.members || []}
                    getPriorityColor={(p) => {
                        switch (p) {
                            case 'highest': return 'var(--error)';
                            case 'high': return 'var(--warning)';
                            case 'medium': return 'var(--accent-primary)';
                            case 'low': return 'var(--success)';
                            case 'lowest': return 'var(--text-secondary)';
                            default: return 'var(--border-color)';
                        }
                    }}
                    onUpdate={(updatedTicket) => {
                        if (updatedTicket.deleted) {
                            setSelectedIssueDetail(null);
                        } else {
                            setSelectedIssueDetail(updatedTicket);
                        }
                        fetchFullPlan();
                    }}
                />
            )}
        </div>
    );
};

export default AIPlanner;
