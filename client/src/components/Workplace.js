import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Folder, Users, Calendar, Rocket } from 'lucide-react';
import '../styles.css';

const Workplace = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newProject, setNewProject] = useState({ name: '', key: '', description: '' });

    useEffect(() => {
        fetchProjects();
    }, []);

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
        }
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        try {
            const userStr = localStorage.getItem('user');
            const { token } = JSON.parse(userStr);
            await axios.post('/api/workplace/projects', newProject, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowCreateModal(false);
            setNewProject({ name: '', key: '', description: '' });
            fetchProjects();
        } catch (error) {
            alert(error.response?.data?.message || 'Error creating project');
        }
    };

    const getProjectColor = (index) => {
        const colors = [
            'linear-gradient(135deg, #00ffaa, #00cc88)',
            'linear-gradient(135deg, #00ccff, #0088cc)',
            'linear-gradient(135deg, #aa00ff, #8800cc)',
            'linear-gradient(135deg, #ffaa00, #cc8800)',
            'linear-gradient(135deg, #ff0066, #cc0055)',
        ];
        return colors[index % colors.length];
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <div className="workplace-container">
            <header className="workplace-header">
                <button className="back-button" onClick={() => navigate('/dashboard')}>
                    ← Back to Dashboard
                </button>
                <div className="header-content">
                    <h1><Rocket size={28} /> Projects</h1>
                    <p>Collaborate, track, and deliver with precision</p>
                </div>
                <button className="create-project-btn" onClick={() => setShowCreateModal(true)}>
                    <Plus size={20} /> New Project
                </button>
            </header>

            <div className="workplace-stats">
                <div className="stat-card">
                    <div className="stat-icon">
                        <Folder size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>{projects.length}</h3>
                        <p>Total Projects</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">
                        <Users size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>{projects.reduce((acc, proj) => acc + (proj.members?.length || 1), 0)}</h3>
                        <p>Team Members</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">
                        <Calendar size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>{projects.filter(p => p.status === 'active').length}</h3>
                        <p>Active Projects</p>
                    </div>
                </div>
            </div>

            <div className="projects-header">
                <h2>Your Projects</h2>
                <div className="project-filters">
                    <button className="filter-btn active">All</button>
                    <button className="filter-btn">Active</button>
                    <button className="filter-btn">Archived</button>
                </div>
            </div>

            <div className="projects-grid">
                {projects.map((project, index) => (
                    <div
                        key={project._id}
                        className="project-card"
                        onClick={() => navigate(`/workplace/project/${project._id}/board`)}
                    >
                        <div className="project-header">
                            <div className="project-avatar" style={{ background: getProjectColor(index) }}>
                                {project.key.substring(0, 2)}
                            </div>
                            <div className="project-meta">
                                <span className="project-key">{project.key}</span>
                                <span className="project-status active">Active</span>
                            </div>
                        </div>

                        <div className="project-info">
                            <h3>{project.name}</h3>
                            <p className="project-description">{project.description || 'No description provided'}</p>
                        </div>

                        <div className="project-footer">
                            <div className="project-members">
                                <div className="member-avatars">
                                    {project.members?.slice(0, 3).map((member, idx) => (
                                        <div key={member._id} className="member-avatar" style={{
                                            backgroundColor: `hsl(${idx * 40}, 60%, 40%)`,
                                            left: `${idx * 15}px`,
                                            zIndex: 3 - idx
                                        }}>
                                            {member.firstName?.charAt(0)}{member.lastName?.charAt(0)}
                                        </div>
                                    ))}
                                    {project.members?.length > 3 && (
                                        <div className="member-avatar more">+{project.members.length - 3}</div>
                                    )}
                                </div>
                                <span>{project.members?.length || 1} members</span>
                            </div>
                            <div className="project-date">
                                Created: {formatDate(project.createdAt)}
                            </div>
                        </div>
                    </div>
                ))}

                {projects.length === 0 && (
                    <div className="empty-projects">
                        <Folder size={48} />
                        <h3>No projects yet</h3>
                        <p>Create your first project to start collaborating</p>
                        <button className="create-first-btn" onClick={() => setShowCreateModal(true)}>
                            <Plus size={20} /> Create Project
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
                                    <span>Project Name</span>
                                    <input
                                        type="text"
                                        value={newProject.name}
                                        onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                                        placeholder="e.g., Website Redesign"
                                        required
                                    />
                                </label>
                            </div>
                            <div className="form-group">
                                <label>
                                    <span>Project Key</span>
                                    <input
                                        type="text"
                                        value={newProject.key}
                                        onChange={e => setNewProject({ ...newProject, key: e.target.value.toUpperCase() })}
                                        placeholder="e.g., WEB"
                                        maxLength="4"
                                        required
                                    />
                                </label>
                            </div>
                            <div className="form-group">
                                <label>
                                    <span>Description</span>
                                    <textarea
                                        value={newProject.description}
                                        onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                                        placeholder="Describe the project goals and scope..."
                                        rows="3"
                                    />
                                </label>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="cancel-btn" onClick={() => setShowCreateModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="create-btn">
                                    Create Project
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Workplace;