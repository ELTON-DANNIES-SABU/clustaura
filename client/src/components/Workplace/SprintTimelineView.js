import React from 'react';
import { Calendar, Clock, ChevronRight } from 'lucide-react';

const SprintTimelineView = ({ sprints, tickets }) => {
    const formatDate = (date) => {
        if (!date) return 'TBD';
        return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="sprint-timeline-view">
            <div className="panel-header">
                <h3><Calendar size={20} /> Project Implementation Timeline</h3>
                <p>Automated sprint scheduling and task distribution</p>
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
                            <span className={`status-badge ${sprint.status}`}>{sprint.status}</span>
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
            </div>
        </div>
    );
};

export default SprintTimelineView;
