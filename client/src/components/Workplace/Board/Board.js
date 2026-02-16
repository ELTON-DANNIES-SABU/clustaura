import React, { useState } from 'react';
import {
    DndContext,
    closestCorners,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable'; // Import if needed for reordering within same column
import Column from './Column';
import IssueCard from './IssueCard';
import './Board.css';

const Board = ({
    columns,
    issues,
    onDragEnd,
    getPriorityColor,
    onIssueClick
}) => {
    const [activeId, setActiveId] = useState(null);

    // Sensors
    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 10,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        })
    );

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragEndInternal = (event) => {
        setActiveId(null);
        onDragEnd(event);
    };

    // Helper to find the issue object for the drag overlay
    const getActiveIssue = () => {
        return issues.find(i => i._id === activeId);
    };

    const dropAnimation = {
        sideEffects: defaultDropAnimationSideEffects({
            styles: {
                active: {
                    opacity: '0.5',
                },
            },
        }),
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEndInternal}
        >
            <div className="board-wrapper">
                <div className="kanban-board-area">
                    {columns.map((colId) => (
                        <Column
                            key={colId}
                            id={colId}
                            issues={issues.filter((issue) => issue.status === colId)}
                            getPriorityColor={getPriorityColor}
                            onIssueClick={onIssueClick}
                        />
                    ))}
                </div>
            </div>

            {/* Drag Overlay for smooth visual */}
            <DragOverlay dropAnimation={dropAnimation}>
                {activeId ? (
                    <div className="issue-card-overlay">
                        <IssueCard
                            issue={getActiveIssue()}
                            getPriorityColor={getPriorityColor}
                            onClick={() => { }} // No click during drag
                        />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};

export default Board;
