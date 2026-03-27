import React, { useState } from 'react';
import { Calendar, Clock, ChevronRight, Plus, X, AlertCircle } from 'lucide-react';
import axios from 'axios';

const SprintTimelineView = ({ sprints, tickets, projectId, project, canManage, onUpdate, modules }) => {
    const [showSprintModal, setShowSprintModal] = useState(false);
    const [showTicketModal, setShowTicketModal] = useState(false);
    const [selectedSprintForTicket, setSelectedSprintForTicket] = useState(null);
    const [loading, setLoading] = useState(false);

    const [newSprint, setNewSprint] = useState({
        name: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });

    const [newTicket, setNewTicket] = useState({
        title: '',
        description: '',
        module: modules?.[0]?._id || '',
        priority: 'medium',
        type: 'task',
        startDate: '',
        endDate: '',
        assignedUser: ''
    });

    const handleCreateSprint = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) return;
            const { token } = JSON.parse(userStr);
            
            await axios.post(`/api/workplace/projects/${projectId}/sprints`, newSprint, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowSprintModal(false);
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Error creating sprint:', error);
            alert(error.response?.data?.message || 'Failed to create sprint');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTicket = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) return;
            const { token } = JSON.parse(userStr);
            
            await axios.post('/api/workplace/issues', {
                ...newTicket,
                projectId,
                sprintId: selectedSprintForTicket
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowTicketModal(false);
            setNewTicket({
                title: '',
                description: '',
                module: modules?.[0]?._id || '',
                priority: 'medium',
                type: 'task',
                startDate: '',
                endDate: '',
                assignedUser: ''
            });
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Error creating ticket:', error);
            alert(error.response?.data?.message || 'Failed to create ticket');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        if (!date) return 'TBD';
        return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="sprint-timeline-view">
            <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3><Calendar size={20} /> Project Implementation Timeline</h3>
                    <p>Automated sprint scheduling and task distribution</p>
                </div>
                {canManage && (
                    <button className="generate-btn" onClick={() => setShowSprintModal(true)} style={{ width: 'auto', padding: '8px 16px', marginTop: 0 }}>
                        <Plus size={16} /> New Sprint
                    </button>
                )}
            </div>

            <div className="timeline-list">
                {sprints.map((sprint, idx) => (
                    <div key={sprint._id} className="timeline-sprint-card">
                        <div className="sprint-header">
                            <div className="sprint-info-main">
                                <h4>{sprint.name}</h4>
                                <div className="sprint-meta-pills">
                                    <span className="sprint-ticket-count">{sprint.tickets?.length || 0} Tickets</span>
                                    <div className="sprint-dates-pill">
                                        <Clock size={12} />
                                        <span>{formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}</span>
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {canManage && (
                                    <button 
                                        className="tab-btn" 
                                        style={{ padding: '4px 8px', fontSize: '0.8rem', border: '1px solid rgba(0, 255, 156, 0.3)' }}
                                        onClick={() => {
                                            setSelectedSprintForTicket(sprint._id);
                                            setShowTicketModal(true);
                                        }}
                                    >
                                        <Plus size={14} /> Add Ticket
                                    </button>
                                )}
                                <span className={`status-badge ${sprint.status}`}>{sprint.status}</span>
                            </div>
                        </div>

                        <div className="sprint-tickets-timeline">
                            {sprint.tickets.map((ticket, tIdx) => (
                                <div key={ticket._id} className="timeline-ticket-item">
                                    <div className="ticket-bullet"></div>
                                    <div className="ticket-details">
                                        <div className="ticket-top">
                                            <span className="ticket-name">{ticket.title}</span>
                                            <span className="ticket-duration">
                                                {formatDate(ticket.startDate)} - {formatDate(ticket.endDate)}
                                            </span>
                                        </div>
                                        <div className="ticket-assignee">
                                            {ticket.assignedUser ? (
                                                <div className="assignee">
                                                    <div className="avatar-xs">
                                                        {ticket.assignedUser.firstName?.[0]}
                                                    </div>
                                                    <span>{ticket.assignedUser.firstName}</span>
                                                </div>
                                            ) : (
                                                <span className="unassigned">Auto-assigning...</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {sprints.length === 0 && (
                    <div className="empty-state" style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                        <Calendar size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                        <p>No sprints scheduled for this project yet.</p>
                        {canManage && <p>Create your first manual sprint to get started!</p>}
                    </div>
                )}
            </div>

            {/* Sprint Creation Modal */}
            {showSprintModal && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="module-card" style={{ width: '400px', padding: '24px', border: '1px solid var(--accent-primary)' }}>
                        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0 }}>Create New Sprint</h3>
                            <button onClick={() => setShowSprintModal(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20}/></button>
                        </div>
                        <form onSubmit={handleCreateSprint}>
                            <div className="input-group">
                                <label>Sprint Name</label>
                                <input 
                                    type="text" 
                                    className="full-input" 
                                    style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid #333', color: '#fff', borderRadius: '4px' }} 
                                    value={newSprint.name}
                                    onChange={e => setNewSprint({...newSprint, name: e.target.value})}
                                    required
                                    placeholder="e.g. Sprint 1: Frontend Basics"
                                />
                            </div>
                            <div className="input-group" style={{ marginTop: '15px' }}>
                                <label>Start Date</label>
                                <input 
                                    type="date" 
                                    style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
                                    value={newSprint.startDate}
                                    onChange={e => setNewSprint({...newSprint, startDate: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="input-group" style={{ marginTop: '15px' }}>
                                <label>End Date</label>
                                <input 
                                    type="date" 
                                    style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
                                    value={newSprint.endDate}
                                    onChange={e => setNewSprint({...newSprint, endDate: e.target.value})}
                                    required
                                />
                            </div>
                            <button type="submit" className="generate-btn" disabled={loading} style={{ marginTop: '24px' }}>
                                {loading ? 'Creating...' : 'Create Sprint'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Ticket Creation Modal */}
            {showTicketModal && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="module-card" style={{ width: '500px', padding: '24px', border: '1px solid var(--accent-primary)' }}>
                        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0 }}>Add Manual Ticket to Sprint</h3>
                            <button onClick={() => setShowTicketModal(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20}/></button>
                        </div>
                        <form onSubmit={handleCreateTicket}>
                            <div className="input-group">
                                <label>Ticket Title</label>
                                <input 
                                    type="text" 
                                    className="full-input" 
                                    style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid #333', color: '#fff', borderRadius: '4px' }} 
                                    value={newTicket.title}
                                    onChange={e => setNewTicket({...newTicket, title: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="input-group" style={{ marginTop: '15px' }}>
                                <label>Description</label>
                                <textarea 
                                    style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid #333', color: '#fff', borderRadius: '4px', height: '80px' }}
                                    value={newTicket.description}
                                    onChange={e => setNewTicket({...newTicket, description: e.target.value})}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
                                <div className="input-group">
                                    <label>Module</label>
                                    <select 
                                        style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
                                        value={newTicket.module}
                                        onChange={e => setNewTicket({...newTicket, module: e.target.value})}
                                        required
                                    >
                                        <option value="">Select Module...</option>
                                        {modules?.map(m => (
                                            <option key={m._id} value={m._id}>{m.moduleName}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label>Priority</label>
                                    <select 
                                        style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
                                        value={newTicket.priority}
                                        onChange={e => setNewTicket({...newTicket, priority: e.target.value})}
                                    >
                                        <option value="highest">Highest</option>
                                        <option value="high">High</option>
                                        <option value="medium">Medium</option>
                                        <option value="low">Low</option>
                                        <option value="lowest">Lowest</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
                                <div className="input-group">
                                    <label>Start Date</label>
                                    <input 
                                        type="date" 
                                        style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
                                        value={newTicket.startDate}
                                        onChange={e => setNewTicket({...newTicket, startDate: e.target.value})}
                                    />
                                </div>
                                <div className="input-group">
                                    <label>End Date</label>
                                    <input 
                                        type="date" 
                                        style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
                                        value={newTicket.endDate}
                                        onChange={e => setNewTicket({...newTicket, endDate: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="input-group" style={{ marginTop: '15px' }}>
                                <label>Assignee</label>
                                <select 
                                    style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
                                    value={newTicket.assignedUser}
                                    onChange={e => setNewTicket({...newTicket, assignedUser: e.target.value})}
                                >
                                    <option value="">Unassigned</option>
                                    {project?.members?.map(m => (
                                        <option key={m.user?._id || m.user} value={m.user?._id || m.user}>
                                            {m.user?.firstName || 'System'} {m.user?.lastName || 'Account'} ({m.role})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button type="submit" className="generate-btn" disabled={loading} style={{ marginTop: '24px' }}>
                                {loading ? 'Adding...' : 'Add Ticket to Sprint'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SprintTimelineView;
