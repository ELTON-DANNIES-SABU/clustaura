import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
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
            const { data } = await axios.get('http://localhost:5000/api/workplace/projects', {
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
            await axios.post('http://localhost:5000/api/workplace/projects', newProject, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowCreateModal(false);
            setNewProject({ name: '', key: '', description: '' });
            fetchProjects();
        } catch (error) {
            alert(error.response?.data?.message || 'Error creating project');
        }
    };

    return (
        <div className="workplace-container">
            <header className="workplace-header">
                <button className="back-button" onClick={() => navigate('/dashboard')}>
                    ← Back to Dashboard
                </button>
                <div className="header-content">
                    <h1>🚀 Projects</h1>
                    <p>Manage your work </p>
                </div>
                <button className="create-btn" onClick={() => setShowCreateModal(true)}>
                    + New Project
                </button>
            </header>

            <div className="projects-grid">
                {projects.map(project => (
                    <div
                        key={project._id}
                        className="project-card"
                        onClick={() => navigate(`/workplace/project/${project._id}/board`)}
                    >
                        <div className="project-icon">{project.key.substring(0, 2)}</div>
                        <div className="project-info">
                            <h3>{project.name}</h3>
                            <span className="project-key">{project.key}</span>
                            <p>{project.description || 'No description'}</p>
                        </div>
                    </div>
                ))}
            </div>

            {showCreateModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Create Project</h2>
                        <form onSubmit={handleCreateProject}>
                            <div className="form-group">
                                <label>Project Name</label>
                                <input
                                    type="text"
                                    value={newProject.name}
                                    onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Key (e.g. WEB)</label>
                                <input
                                    type="text"
                                    value={newProject.key}
                                    onChange={e => setNewProject({ ...newProject, key: e.target.value.toUpperCase() })}
                                    maxLength="4"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={newProject.description}
                                    onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowCreateModal(false)}>Cancel</button>
                                <button type="submit" className="primary-btn">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Workplace;
