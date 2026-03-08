import React, { useState, useRef, useEffect } from 'react';
import { differenceInDays, addDays, format, startOfDay } from 'date-fns';
import './Timeline.css';

const TimelineBar = ({
    issue,
    startDate: gridStartDate,
    dateToPixel,
    pixelToDate,
    onUpdate
}) => {
    // If no dates, default to today + 7 days for visualization if newly created, or don't render?
    // For now, if no dates, we might skip rendering or render a placeholder?
    // Let's assume issues with dates are rendered. If no dates, maybe we render them at "today" for 1 day.

    // Internal state for dragging
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false); // 'left' or 'right'
    const [dragStartX, setDragStartX] = useState(0);
    const [currentLeft, setCurrentLeft] = useState(0);
    const [currentWidth, setCurrentWidth] = useState(0);

    const barRef = useRef(null);

    // Calculate initial positions
    const getBarPosition = () => {
        const start = issue.startDate ? new Date(issue.startDate) : new Date();
        const end = issue.dueDate ? new Date(issue.dueDate) : addDays(start, 5); // Default length

        const left = dateToPixel(start);
        const width = dateToPixel(end) - left;

        return { left, width }; // Width in pixels
    };

    useEffect(() => {
        const { left, width } = getBarPosition();
        setCurrentLeft(left);
        setCurrentWidth(Math.max(width, 24)); // Min width
    }, [issue.startDate, issue.dueDate, gridStartDate]);


    const handleMouseDown = (e, resizeSide = null) => {
        e.stopPropagation();
        e.preventDefault(); // Prevent text selection

        if (resizeSide) {
            setIsResizing(resizeSide);
        } else {
            setIsDragging(true);
        }
        setDragStartX(e.clientX);
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging && !isResizing) return;

            const deltaX = e.clientX - dragStartX;

            if (isDragging) {
                // Moving the whole bar
                setCurrentLeft(prev => prev + deltaX);
            } else if (isResizing === 'right') {
                setCurrentWidth(prev => Math.max(24, prev + deltaX)); // Min width 24px
            } else if (isResizing === 'left') {
                const newWidth = Math.max(24, currentWidth - deltaX);
                if (newWidth !== currentWidth) { // Only move left if we actually resized
                    setCurrentLeft(prev => prev + deltaX);
                    setCurrentWidth(newWidth);
                }
            }

            setDragStartX(e.clientX); // Reset start for next frame (delta is per frame)
        };

        const handleMouseUp = () => {
            if (isDragging || isResizing) {
                // Snap to new dates and update
                const newStartDate = pixelToDate(currentLeft);
                const newEndDate = pixelToDate(currentLeft + currentWidth);

                onUpdate({
                    ...issue,
                    startDate: newStartDate.toISOString(),
                    dueDate: newEndDate.toISOString()
                });

                setIsDragging(false);
                setIsResizing(false);
            }
        };

        if (isDragging || isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, isResizing, dragStartX, currentLeft, currentWidth, pixelToDate, issue, onUpdate]);


    return (
        <div
            className={`timeline-bar ${issue.type === 'epic' ? 'epic-bar' : ''} ${issue.status === 'Done' ? 'status-done' : ''}`}
            style={{
                position: 'absolute',
                height: issue.type === 'epic' ? '28px' : '24px',
                borderRadius: '4px',
                background: issue.type === 'epic' ? '#6c5ce7' : (issue.status === 'Done' ? '#2ed573' : '#3742fa'),
                opacity: issue.status === 'Done' ? 0.8 : 1,
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                left: `${currentLeft}px`,
                width: `${currentWidth}px`,
                cursor: isDragging ? 'grabbing' : 'grab',
                display: 'flex',
                alignItems: 'center',
                padding: '0 8px',
                fontSize: '0.75rem',
                color: '#fff',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                zIndex: 2,
                transition: 'background 0.2s',
                filter: isDragging ? 'brightness(1.2)' : 'none'
            }}
            onMouseDown={(e) => handleMouseDown(e)}
            ref={barRef}
        >
            <div
                className="resize-handle left"
                style={{ position: 'absolute', top: 0, bottom: 0, width: '6px', cursor: 'col-resize', zIndex: 3, left: 0 }}
                onMouseDown={(e) => handleMouseDown(e, 'left')}
            />
            <span>{issue.summary}</span>
            <div
                className="resize-handle right"
                style={{ position: 'absolute', top: 0, bottom: 0, width: '6px', cursor: 'col-resize', zIndex: 3, right: 0 }}
                onMouseDown={(e) => handleMouseDown(e, 'right')}
            />
        </div>
    );
};

export default TimelineBar;
