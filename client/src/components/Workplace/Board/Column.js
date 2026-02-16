import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import IssueCard from './IssueCard';
import './Board.css';

const Column = ({ id, issues, getPriorityColor, onIssueClick }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: id,
    });

    return (
        <div
            ref={setNodeRef}
            className={`board-column ${isOver ? 'drag-over' : ''}`}
        >
            <div className="column-header">
                <span className="column-title">
                    {id}
                </span>
                <span className="issue-count-badge">
                    {issues.length}
                </span>
            </div>

            <div className="column-content">
                <SortableContext
                    items={issues.map(i => i._id)}
                    strategy={verticalListSortingStrategy}
                >
                    {issues.map((issue) => (
                        <IssueCard
                            key={issue._id}
                            issue={issue}
                            getPriorityColor={getPriorityColor}
                            onClick={() => onIssueClick(issue)}
                        />
                    ))}
                </SortableContext>
            </div>
        </div>
    );
};

export default Column;
