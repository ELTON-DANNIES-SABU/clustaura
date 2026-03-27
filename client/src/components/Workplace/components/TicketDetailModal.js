import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Calendar, User, Tag, AlertCircle, Clock, Zap, CheckCircle2, GitCommit, Github } from 'lucide-react';

const TicketDetailModal = ({ issue, onClose, getPriorityColor, onUpdate }) => {
    const [suggestions, setSuggestions] = useState([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [error, setError] = useState('');
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            setCurrentUser(JSON.parse(userStr));
        }
    }, []);

    const fetchSuggestions = async () => {
        try {
            setLoadingSuggestions(true);
            setError('');
            const userStr = localStorage.getItem('user');
            if (!userStr) return;
            const { token } = JSON.parse(userStr);
            const projectId = issue.project || issue.projectId;
            
            const res = await axios.get(`/api/tickets/${issue._id}/suggestions?projectId=${projectId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuggestions(res.data);
        } catch (err) {
            console.error('Error fetching suggestions:', err);
            setError('Failed to load suggestions');
        } finally {
            setLoadingSuggestions(false);
        }
    };

    const handleAssign = async (userId) => {
        try {
            const userStr = localStorage.getItem('user');
            const { token } = JSON.parse(userStr);
            const res = await axios.post('/api/tickets/assign', {
                ticketId: issue._id,
                assignedUser: userId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (onUpdate) {
                onUpdate(res.data.ticket);
            }
            onClose();
        } catch (err) {
            console.error('Error assigning ticket:', err);
            setError(err.response?.data?.message || 'Error assigning ticket');
        }
    };

    if (!issue) return null;

    const isOwnerOrLead = currentUser && (currentUser.role === 'PM' || currentUser.role === 'Tech Lead' || currentUser.role === 'Creator' || currentUser._id === issue.project?.owner);

    const formatDate = (dateString) => {
        if (!dateString || dateString === '') return 'Not set';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Not set';
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <>
            <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }} />
            <div className="ticket-detail-modal">
                <div className="ticket-detail-header">
                    <div className="ticket-key-type">
                        <span className={`issue-type-icon ${issue.type}`} title={issue.type}></span>
                        <span className="issue-key">{issue.issueKey}</span>
                    </div>
                    <button className="close-modal-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="ticket-detail-body">
                    <div className="detail-main">
                        <h2 className="detail-summary">{issue.summary || issue.title}</h2>

                        <div className="detail-section">
                            <label><Clock size={14} /> Description</label>
                            <div className="detail-description">
                                {issue.description || 'No description provided.'}
                            </div>
                        </div>
                        
                        {/* Dynamic Assignment Section */}
                        {(issue.status === 'Pending' || !issue.assignedUser) && isOwnerOrLead && (
                            <div className="detail-section dynamic-assignment-section">
                                <div className="assignment-header">
                                    <label><Zap size={14} color="#00FF9C" /> Smart Assignment</label>
                                    <button className="fetch-suggestions-btn" onClick={fetchSuggestions} disabled={loadingSuggestions}>
                                        {loadingSuggestions ? 'Analyzing Team...' : 'Find Best Matches'}
                                    </button>
                                </div>
                                {error && <div className="error-text" style={{color: '#ff4757', marginTop: '8px', fontSize: '0.9rem'}}>{error}</div>}
                                
                                {suggestions.length > 0 && (
                                    <div className="suggestions-list">
                                        {suggestions.map((suggestion, idx) => (
                                            <div key={suggestion.user._id} className="suggestion-card">
                                                <div className="suggestion-info">
                                                    <div className="detail-avatar">{suggestion.user.firstName.charAt(0)}</div>
                                                    <div className="suggestion-user-details">
                                                        <span className="suggestion-name">{suggestion.user.firstName} {suggestion.user.lastName}</span>
                                                        <span className="suggestion-match-score">Match Score: {suggestion.matchScore}</span>
                                                    </div>
                                                </div>
                                                <div className="suggestion-stats">
                                                    <span className={`workload-badge ${suggestion.isOverloaded ? 'overloaded' : ''}`}>
                                                        Workload: {suggestion.currentWorkload}/5
                                                    </span>
                                                    <button 
                                                        className="assign-user-btn" 
                                                        onClick={() => handleAssign(suggestion.user._id)}
                                                        disabled={suggestion.isOverloaded}
                                                    >
                                                        <CheckCircle2 size={14} /> Assign
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="detail-sidebar">
                        <div className="sidebar-group">
                            <label>Status</label>
                            <span className={`status-badge ${issue.status === 'Pending' ? 'pending' : ''}`}>{issue.status}</span>
                        </div>

                        <div className="sidebar-group">
                            <label><User size={14} /> Assignee</label>
                            <div className="assignee-detail">
                                <div className="detail-avatar">
                                    {issue.assignedUser ? issue.assignedUser.firstName?.charAt(0) : (issue.assignee ? issue.assignee.firstName?.charAt(0) : '?')}
                                </div>
                                <span>{issue.assignedUser ? `${issue.assignedUser.firstName} ${issue.assignedUser.lastName}` : (issue.assignee ? `${issue.assignee.firstName} ${issue.assignee.lastName}` : 'Unassigned')}</span>
                            </div>
                        </div>

                        <div className="sidebar-group">
                            <label><AlertCircle size={14} /> Priority</label>
                            <div className="priority-detail">
                                <span
                                    className="priority-dot"
                                    style={{ backgroundColor: getPriorityColor(issue.priority) }}
                                ></span>
                                <span className="capitalize">{issue.priority}</span>
                            </div>
                        </div>

                        <div className="sidebar-group">
                            <label><Calendar size={14} /> Dates</label>
                            <div className="dates-detail">
                                <div><strong>Start:</strong> {formatDate(issue.startDate)}</div>
                                <div><strong>Due:</strong> {formatDate(issue.endDate || issue.dueDate)}</div>
                            </div>
                        </div>

                        <div className="sidebar-group">
                            <label><Tag size={14} /> Type</label>
                            <span className={`issue-type ${issue.type} capitalize`}>{issue.type}</span>
                        </div>

                        {issue.progressPercentage !== undefined && (
                            <div className="sidebar-group">
                                <label><Zap size={14} /> Progress</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#00FF9C' }}>{issue.progressPercentage}%</span>
                                </div>
                                <div className="detail-progress-bar" style={{ width: '100%', height: '6px', background: '#333', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ width: `${issue.progressPercentage}%`, height: '100%', background: '#00FF9C', transition: 'width 0.5s ease-in-out' }}></div>
                                </div>
                            </div>
                        )}

                        {issue.commits && issue.commits.length > 0 && (
                            <div className="sidebar-group">
                                <label><Github size={14} /> Git Activity</label>
                                <div className="commits-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {issue.commits.slice(-3).reverse().map((commit, idx) => (
                                        <div key={idx} style={{ background: '#1a1d21', padding: '8px', borderRadius: '4px', border: '1px solid #333' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                                <GitCommit size={12} color="#888" />
                                                <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#888' }}>{commit.hash.substring(0, 7)}</span>
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: '#ccc', lineHeight: '1.3' }}>
                                                {commit.message}
                                            </div>
                                        </div>
                                    ))}
                                    {issue.commits.length > 3 && (
                                        <div style={{ fontSize: '0.8rem', color: '#888', textAlign: 'center', marginTop: '4px' }}>
                                            + {issue.commits.length - 3} more commits
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
                .ticket-detail-modal {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: #0B0F14;
                    border: 1px solid #333;
                    border-radius: 12px;
                    width: 800px;
                    max-width: 90vw;
                    max-height: 85vh;
                    z-index: 1101;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 0 20px rgba(0, 255, 156, 0.1);
                    color: #ddd;
                    overflow: hidden;
                }

                .ticket-detail-header {
                    padding: 16px 24px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid #333;
                    background: #1a1d21;
                }

                .ticket-key-type {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .issue-key {
                    font-size: 0.9rem;
                    color: #888;
                    font-weight: 500;
                }

                .close-modal-btn {
                    background: none;
                    border: none;
                    color: #888;
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 4px;
                    transition: all 0.2s;
                }

                .close-modal-btn:hover {
                    background: #333;
                    color: #fff;
                }

                .ticket-detail-body {
                    padding: 24px;
                    display: grid;
                    grid-template-columns: 1fr 280px;
                    gap: 32px;
                    overflow-y: auto;
                }

                .detail-summary {
                    font-size: 1.5rem;
                    color: #fff;
                    margin: 0 0 24px 0;
                    font-weight: 600;
                    line-height: 1.3;
                }

                .detail-section {
                    margin-bottom: 24px;
                }

                .detail-section label {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 0.85rem;
                    color: #888;
                    margin-bottom: 12px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .detail-description {
                    line-height: 1.6;
                    color: #ccc;
                    background: #1a1d21;
                    padding: 16px;
                    border-radius: 8px;
                    border: 1px solid #333;
                    white-space: pre-wrap;
                }

                .sidebar-group {
                    margin-bottom: 24px;
                }

                .sidebar-group label {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 0.8rem;
                    color: #888;
                    margin-bottom: 8px;
                    font-weight: 600;
                    text-transform: uppercase;
                }

                .status-badge {
                    display: inline-block;
                    padding: 4px 12px;
                    background: #333;
                    color: #00FF9C;
                    border-radius: 4px;
                    font-size: 0.85rem;
                    font-weight: 600;
                }

                .assignee-detail {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .detail-avatar {
                    width: 28px;
                    height: 28px;
                    background: #444;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.8rem;
                    font-weight: bold;
                    color: #eee;
                }

                .priority-detail {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .priority-dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                }

                .dates-detail {
                    font-size: 0.9rem;
                    color: #ccc;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .capitalize {
                    text-transform: capitalize;
                }

                @media (max-width: 768px) {
                    .ticket-detail-body {
                        grid-template-columns: 1fr;
                    }
                    .detail-sidebar {
                        border-top: 1px solid #333;
                        padding-top: 24px;
                    }
                    .ticket-detail-modal {
                        width: 95vw;
                    }
                }

                .dynamic-assignment-section {
                    margin-top: 32px;
                    background: rgba(0, 255, 156, 0.03);
                    border: 1px solid rgba(0, 255, 156, 0.2);
                    border-radius: 8px;
                    padding: 16px;
                }
                
                .assignment-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                }
                
                .assignment-header label {
                    margin-bottom: 0;
                    color: #00FF9C;
                }
                
                .fetch-suggestions-btn {
                    background: rgba(0, 255, 156, 0.1);
                    border: 1px solid #00FF9C;
                    color: #00FF9C;
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.85rem;
                    transition: all 0.2s;
                }
                
                .fetch-suggestions-btn:hover:not(:disabled) {
                    background: #00FF9C;
                    color: #0B0F14;
                }
                
                .fetch-suggestions-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    border-color: #555;
                    color: #aaa;
                }
                
                .suggestions-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                
                .suggestion-card {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: #1a1d21;
                    padding: 12px;
                    border-radius: 6px;
                    border: 1px solid #333;
                }
                
                .suggestion-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .suggestion-user-details {
                    display: flex;
                    flex-direction: column;
                }
                
                .suggestion-name {
                    font-weight: 600;
                    color: #eee;
                    font-size: 0.95rem;
                }
                
                .suggestion-match-score {
                    font-size: 0.8rem;
                    color: #00FF9C;
                }
                
                .suggestion-stats {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .workload-badge {
                    font-size: 0.8rem;
                    padding: 4px 8px;
                    background: #333;
                    border-radius: 4px;
                    color: #aaa;
                }
                
                .workload-badge.overloaded {
                    color: #ff4757;
                    background: rgba(255, 71, 87, 0.1);
                    border: 1px solid rgba(255, 71, 87, 0.3);
                }
                
                .assign-user-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: #2ed573;
                    color: #0B0F14;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 4px;
                    font-weight: 600;
                    cursor: pointer;
                    font-size: 0.85rem;
                    transition: all 0.2s;
                }
                
                .assign-user-btn:hover:not(:disabled) {
                    background: #26b360;
                }
                
                .assign-user-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    background: #555;
                    color: #bbb;
                }
                
                .status-badge.pending {
                    background: rgba(255, 165, 2, 0.1);
                    color: #ffa502;
                    border: 1px solid rgba(255, 165, 2, 0.3);
                }
            `}</style>
        </>
    );
};

export default TicketDetailModal;
