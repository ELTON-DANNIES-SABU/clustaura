import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MessageSquare, AlertCircle, Bookmark, CheckSquare } from 'lucide-react';
import './Board.css';

const IssueCard = ({ issue, getPriorityColor, onClick }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: issue._id, data: { ...issue } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    };

    const getIcon = (type) => {
        switch (type) {
            case 'bug': return <AlertCircle size={14} className="type-bug" />;
            case 'story': return <Bookmark size={14} className="type-story" />;
            case 'task': default: return <CheckSquare size={14} className="type-task" />;
        }
    };

    // Determine accent color based on priority for the hover effect
    const accentColor = getPriorityColor(issue.priority);

    return (
        <div
            ref={setNodeRef}
            style={{ ...style, '--card-accent-color': accentColor }}
            className={`issue-card-dnd ${isDragging ? 'dragging' : ''}`}
            {...attributes}
            {...listeners}
            onClick={onClick}
        >
            <div className="card-content">
                <p className="card-title">{issue.summary}</p>

                <div className="card-meta">
                    <div className="card-left-meta">
                        <div className="issue-type-icon" title={issue.type}>
                            {getIcon(issue.type)}
                        </div>
                        <span className="issue-key">{issue.issueKey}</span>
                        <div
                            className="priority-indicator"
                            style={{ backgroundColor: getPriorityColor(issue.priority) }}
                            title={`Priority: ${issue.priority}`}
                        />
                    </div>

                    <div className="card-right-meta">
                        {/* Mock comment count since backend doesn't support it yet */}
                        <div className="comment-count" title="Comments">
                            <MessageSquare size={12} />
                            <span>0</span>
                        </div>

                        <div className="assignee-avatar" title={issue.assignee ? `${issue.assignee.firstName} ${issue.assignee.lastName}` : 'Unassigned'}>
                            {issue.assignee ? (
                                <span>{issue.assignee.firstName?.charAt(0)}</span>
                            ) : (
                                <span>?</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IssueCard;
