import React from 'react';
import { X, Calendar, User, Tag, AlertCircle, Clock } from 'lucide-react';

const TicketDetailModal = ({ issue, onClose, getPriorityColor }) => {
    if (!issue) return null;

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
                        <h2 className="detail-summary">{issue.summary}</h2>

                        <div className="detail-section">
                            <label><Clock size={14} /> Description</label>
                            <div className="detail-description">
                                {issue.description || 'No description provided.'}
                            </div>
                        </div>
                    </div>

                    <div className="detail-sidebar">
                        <div className="sidebar-group">
                            <label>Status</label>
                            <span className="status-badge">{issue.status}</span>
                        </div>

                        <div className="sidebar-group">
                            <label><User size={14} /> Assignee</label>
                            <div className="assignee-detail">
                                <div className="detail-avatar">
                                    {issue.assignee?.firstName?.charAt(0) || '?'}
                                </div>
                                <span>{issue.assignee ? `${issue.assignee.firstName} ${issue.assignee.lastName}` : 'Unassigned'}</span>
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
                                <div><strong>Due:</strong> {formatDate(issue.dueDate)}</div>
                            </div>
                        </div>

                        <div className="sidebar-group">
                            <label><Tag size={14} /> Type</label>
                            <span className={`issue-type ${issue.type} capitalize`}>{issue.type}</span>
                        </div>
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
            `}</style>
        </>
    );
};

export default TicketDetailModal;
