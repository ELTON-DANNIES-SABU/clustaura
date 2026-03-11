import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProjectInitializationInput from './ProjectInitializationInput';
import ModuleView from './ModuleView';
import TeamSkillPanel from './TeamSkillPanel';
import AISuggestionsPanel from './AISuggestionsPanel';
import { Rocket, Brain, Users, Layout, Zap, AlertTriangle } from 'lucide-react';

const AIPlanner = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [planData, setPlanData] = useState(null);
    const [analysis, setAnalysis] = useState(null);

    useEffect(() => {
        fetchProject();
        fetchAnalysis();
    }, [projectId]);

    const fetchProject = async () => {
        try {
            const userStr = localStorage.getItem('user');
            const { token } = JSON.parse(userStr);
            const { data } = await axios.get(`/api/workplace/projects/${projectId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProject(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching project:', error);
        }
    };

    const fetchAnalysis = async () => {
        try {
            const userStr = localStorage.getItem('user');
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
        setPlanData(data);
        fetchAnalysis(); // Refresh analysis after plan is generated
    };

    if (loading) return <div className="loading">Initializing AI Assistant...</div>;

    return (
        <div className="ai-workspace-container">
            <header className="ai-workspace-header">
                <div className="header-info">
                    <h1><Brain size={32} color="#339933" /> {project ? project.name : ''} AI Command Center</h1>
                    <p>Agentic AI SDLC Assistant isActive</p>
                </div>
                <div className="planner-controls">
                    <button className="secondary-btn" onClick={() => navigate(`/workplace/project/${projectId}/board`)}>
                        <Layout size={18} /> View Monitoring Board
                    </button>
                    <button className="back-btn" onClick={() => navigate('/workplace')}>
                        Exit to Projects
                    </button>
                </div>
            </header>

            <div className="ai-workspace-grid">
                <div className="left-panel">
                    <ProjectInitializationInput
                        projectId={projectId}
                        projectName={project ? project.name : ''}
                        onPlanGenerated={handlePlanGenerated}
                    />

                    {planData && (
                        <ModuleView
                            modules={planData.modules}
                            tickets={planData.tickets}
                            technologies={planData.technologies}
                        />
                    )}
                </div>

                <div className="right-panel">
                    <TeamSkillPanel members={project ? project.members : []} analysis={analysis} />
                    <AISuggestionsPanel analysis={analysis} />
                </div>
            </div>
        </div>
    );
};

export default AIPlanner;
