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
import { Rocket, Brain, Users, Layout, Zap, AlertTriangle, Calendar, Users2 } from 'lucide-react';

const AIPlanner = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [planData, setPlanData] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [activeTab, setActiveTab] = useState('modules'); // 'modules', 'timeline', 'workforce'

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
            if (data.modules && data.modules.length > 0) {
                setPlanData({
                    modules: data.modules,
                    tickets: data.tickets,
                    sprints: data.sprints,
                    technologies: data.technologies,
                    requirements: data.requirements
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

    if (loading) return <div className="loading">Initializing AI Assistant...</div>;

    return (
        <div className="ai-workspace-container" key={projectId}>
            <header className="ai-workspace-header">
                <div className="header-info">
                    <h1><Brain size={32} color="#00FF9C" /> {project ? project.name : ''} AI Command Center</h1>
                    <p>Agentic AI SDLC Assistant isActive</p>
                </div>
                <div className="planner-controls">
                    <button className="secondary-btn" onClick={() => navigate(`/workplace/project/${projectId}/board`)}>
                        <Layout size={18} /> View Monitoring Board
                    </button>
                    {planData && project?.owner === JSON.parse(localStorage.getItem('user'))?._id && (
                        <button className="secondary-btn reset-btn" onClick={handleResetPlan} style={{ color: '#ff4757', border: '1px solid rgba(255, 71, 87, 0.3)' }}>
                            <AlertTriangle size={18} /> Reset Plan
                        </button>
                    )}
                    <button className="back-btn" onClick={() => navigate('/workplace')}>
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
                <button className={`tab-btn ${activeTab === 'workforce' ? 'active' : ''}`} onClick={() => setActiveTab('workforce')}>
                    <Users2 size={18} /> Team Requirements
                </button>
                <button className={`tab-btn ${activeTab === 'suggestions' ? 'active' : ''}`} onClick={() => setActiveTab('suggestions')}>
                    <Users size={18} /> Team Suggestions
                </button>
            </div>

            <div className="ai-workspace-grid">
                <div className="left-panel">
                    {!planData && (
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
                            />
                            {project?.owner === JSON.parse(localStorage.getItem('user'))?._id && (
                                <ProjectImprovisationInput 
                                    projectId={projectId} 
                                    onPlanImprovised={handlePlanGenerated} 
                                />
                            )}
                        </>
                    )}

                    {planData && activeTab === 'timeline' && (
                        <SprintTimelineView
                            sprints={planData.sprints}
                            tickets={planData.tickets}
                        />
                    )}

                    {planData && activeTab === 'workforce' && (
                        <TeamRequirementPanel
                            requirements={planData.requirements}
                        />
                    )}
                    {planData && activeTab === 'suggestions' && (
                        <TeamSuggestionsPanel projectId={projectId} />
                    )}
                </div>

                <div className="right-panel">
                    <TeamSkillPanel members={project ? (project.members || []) : []} analysis={analysis} />
                    <AISuggestionsPanel analysis={analysis} />
                </div>
            </div>
        </div>
    );
};

export default AIPlanner;
