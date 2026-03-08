import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Folder, Plus, ChevronRight } from 'lucide-react';

const ProjectsView = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const userStr = localStorage.getItem('user');
                if (!userStr) return;
                const { token } = JSON.parse(userStr);
                const { data } = await axios.get('/api/workplace/projects', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProjects(data);
            } catch (error) {
                console.error('Error fetching projects:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, []);

    const getProjectColor = (index) => {
        const colors = ['#00ffaa', '#00ccff', '#aa00ff', '#ffaa00', '#ff0066'];
        return colors[index % colors.length];
    };

    if (loading) {
        return (
            <div className="dashboard-section loading-center">
                <div className="loader"></div>
                <p>Loading projects...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-section projects-view-container">
            <div className="section-header">
                <h2>My Projects</h2>
                <button
                    className="create-btn-small"
                    onClick={() => navigate('/workplace')}
                >
                    <Plus size={16} /> New Project
                </button>
            </div>

            <div className="projects-grid-dashboard">
                {projects.length > 0 ? (
                    projects.map((project, index) => (
                        <div
                            key={project._id}
                            className="project-mini-card"
                            onClick={() => navigate(`/workplace/project/${project._id}/board`)}
                        >
                            <div className="mini-card-accent" style={{ backgroundColor: getProjectColor(index) }}></div>
                            <div className="mini-card-content">
                                <div className="mini-card-header">
                                    <span className="mini-project-key">{project.key}</span>
                                    <h3 className="mini-project-name">{project.name}</h3>
                                </div>
                                <p className="mini-project-desc">
                                    {project.description || 'No description provided'}
                                </p>
                                <div className="mini-card-footer">
                                    <span className="mini-members-count">
                                        {project.members?.length || 1} members
                                    </span>
                                    <ChevronRight size={18} className="arrow-icon" />
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="no-projects-placeholder">
                        <Folder size={48} />
                        <p>No projects found.</p>
                        <button
                            className="create-btn-accent"
                            onClick={() => navigate('/workplace')}
                        >
                            Get Started
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectsView;
