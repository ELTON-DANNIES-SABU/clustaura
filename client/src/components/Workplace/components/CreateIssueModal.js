import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Calendar, User, Tag, FileText, Type } from 'lucide-react';

const CreateIssueModal = ({ isOpen, onClose, project, onIssueCreated, initialType = 'task', initialParent = null, initialSprint = null }) => {
    const [formData, setFormData] = useState({
        summary: '',
        description: '',
        type: initialType,
        priority: 'medium',
        assignee: '',
        startDate: '',
        dueDate: '',
        parent: initialParent?._id || null,
        sprintId: initialSprint
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFormData(prev => ({
                ...prev,
                type: initialType,
                parent: initialParent?._id || null, // Ensure ID is used
                sprintId: initialSprint
            }));
        }
    }, [isOpen, initialType, initialParent, initialSprint]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const userStr = localStorage.getItem('user');
            const { token } = JSON.parse(userStr);
            console.log('Creating issue with payload:', {
                projectId: project._id,
                ...formData
            });

            const res = await axios.post(
                '/api/workplace/issues',
                {
                    projectId: project._id,
                    ...formData
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setLoading(false);
            onIssueCreated(res.data);
            onClose();
            // Reset form
            setFormData({
                summary: '',
                description: '',
                type: 'task',
                priority: 'medium',
                assignee: '',
                startDate: '',
                dueDate: '',
                parent: null,
                sprintId: null
            });

        } catch (error) {
            console.error('Error creating issue:', error);
            setLoading(false);
            alert('Failed to create issue');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '600px', width: '100%', background: '#1e1e24', border: '1px solid #333', color: '#fff' }}>
                <div className="modal-header">
                    <h2>Create {formData.type === 'epic' ? 'Epic' : 'Issue'}</h2>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>
                <div className="modal-body">
                    <form onSubmit={handleSubmit} className="create-issue-form">

                        {/* Summary */}
                        <div className="form-group">
                            <label>Summary <span style={{ color: '#ff4757' }}>*</span></label>
                            <input
                                type="text"
                                name="summary"
                                value={formData.summary}
                                onChange={handleChange}
                                placeholder="What needs to be done?"
                                required
                                className="cyber-input"
                                autoFocus
                            />
                        </div>

                        {/* Type & Priority Row */}
                        <div className="form-row" style={{ display: 'flex', gap: '15px' }}>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label><Type size={14} /> Type</label>
                                <select name="type" value={formData.type} onChange={handleChange} className="cyber-select">
                                    <option value="story">Story</option>
                                    <option value="task">Task</option>
                                    <option value="bug">Bug</option>
                                    <option value="epic">Epic</option>
                                </select>
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label><Tag size={14} /> Priority</label>
                                <select name="priority" value={formData.priority} onChange={handleChange} className="cyber-select">
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </div>
                        </div>

                        {/* Dates Row */}
                        <div className="form-row" style={{ display: 'flex', gap: '15px' }}>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label><Calendar size={14} /> Start Date</label>
                                <input
                                    type="date"
                                    name="startDate"
                                    value={formData.startDate}
                                    onChange={handleChange}
                                    className="cyber-input"
                                />
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label><Calendar size={14} /> Due Date</label>
                                <input
                                    type="date"
                                    name="dueDate"
                                    value={formData.dueDate}
                                    onChange={handleChange}
                                    className="cyber-input"
                                />
                            </div>
                        </div>

                        {/* Assignee */}
                        <div className="form-group">
                            <label><User size={14} /> Assignee</label>
                            <select name="assignee" value={formData.assignee} onChange={handleChange} className="cyber-select">
                                <option value="">Unassigned</option>
                                {project?.members?.map(member => (
                                    <option key={member._id} value={member._id}>
                                        {member.firstName} {member.lastName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Description */}
                        <div className="form-group">
                            <label><FileText size={14} /> Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Add a description..."
                                className="cyber-textarea"
                                rows={4}
                            />
                        </div>

                        {/* Context Info (Parent) */}
                        {initialParent && (
                            <div className="form-info" style={{ padding: '10px', background: 'rgba(52, 152, 219, 0.1)', borderRadius: '4px', marginBottom: '15px', fontSize: '0.9rem', color: '#3498db' }}>
                                Creating child issue for Epic: <strong>{initialParent.summary}</strong>
                            </div>
                        )}

                        <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                            <button type="button" onClick={onClose} className="secondary-btn">Cancel</button>
                            <button type="submit" className="primary-btn" disabled={loading}>
                                {loading ? 'Creating...' : 'Create'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateIssueModal;
