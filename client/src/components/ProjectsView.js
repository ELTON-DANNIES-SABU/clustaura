import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Folder, Plus, ChevronRight } from 'lucide-react';

const ProjectsView = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newProject, setNewProject] = useState({ name: '', key: '', description: '', communityId: '' });

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

    const handleCreateProject = async (e) => {
        e.preventDefault();
        try {
            const userStr = localStorage.getItem('user');
            const { token } = JSON.parse(userStr);

            // Auto-generate a unique 6-character key from name + random
            const baseKey = newProject.name.substring(0, 3).toUpperCase();
            const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
            const key = `${baseKey}${randomSuffix}`;

            const projectRes = await axios.post('/api/workplace/projects', { ...newProject, key }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const projectId = projectRes.data._id;

            // Trigger AI Analysis immediately
            await axios.post('/api/agents/analyze-project', {
                projectId,
                title: newProject.name,
                description: newProject.description
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setShowCreateModal(false);
            setNewProject({ name: '', key: '', description: '', communityId: '' });
            navigate(`/workplace/project/${projectId}/ai-planner`);
        } catch (error) {
            alert(error.response?.data?.message || 'Error initializing automated workspace');
        }
    };

    const getProjectColor = (index) => {
        const colors = ['var(--accent-primary)', 'var(--accent-secondary)', '#8b5cf6', '#ec4899', '#f97316'];
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
                    onClick={() => setShowCreateModal(true)}
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
                            onClick={() => setShowCreateModal(true)}
                        >
                            Get Started
                        </button>
                    </div>
                )}
            </div>

            {showCreateModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Create New Project</h2>
                            <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleCreateProject}>
                            <div className="form-group">
                                <label>
                                    <span>What are we building today? (Project Title)</span>
                                    <input
                                        type="text"
                                        value={newProject.name}
                                        onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                                        placeholder="e.g., AI-Powered CRM"
                                        required
                                    />
                                </label>
                            </div>
                            <div className="form-group">
                                <label>
                                    <span>Describe the system requirements & goals</span>
                                    <textarea
                                        value={newProject.description}
                                        onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                                        placeholder="Describe features, target users, and technical constraints..."
                                        rows="6"
                                        required
                                    />
                                </label>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="cancel-btn" onClick={() => setShowCreateModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="create-btn ai-sparkle">
                                    🚀 Initialize Automated Workspace
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectsView;
