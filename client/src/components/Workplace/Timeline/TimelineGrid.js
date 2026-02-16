import React, { useMemo } from 'react';
import { eachDayOfInterval, eachMonthOfInterval, format, differenceInDays, startOfDay, addDays } from 'date-fns';
import TimelineBar from './TimelineBar';
import './Timeline.css';

const COLUMN_WIDTH = 40; // Pixels per day

const TimelineGrid = ({ epics, expandedEpics, startDate, endDate, onUpdateIssue }) => {

    // Generate dates
    const months = useMemo(() => eachMonthOfInterval({ start: startDate, end: endDate }), [startDate, endDate]);
    const days = useMemo(() => eachDayOfInterval({ start: startDate, end: endDate }), [startDate, endDate]);

    const totalWidth = days.length * COLUMN_WIDTH;

    // Helpers
    const dateToPixel = (date) => {
        const diff = differenceInDays(startOfDay(date), startOfDay(startDate));
        return diff * COLUMN_WIDTH;
    };

    const pixelToDate = (pixel) => {
        const daysToAdd = Math.round(pixel / COLUMN_WIDTH);
        return addDays(startOfDay(startDate), daysToAdd);
    };

    // Calculate today line position
    const todayPixel = dateToPixel(new Date());

    return (
        <div className="timeline-grid-content" style={{ width: `${totalWidth}px` }}>
            {/* Background Grid */}
            <div className="timeline-grid-background">
                {days.map((day, i) => (
                    <div key={day.toISOString()} className="grid-column-line" style={{ width: `${COLUMN_WIDTH}px` }} />
                ))}
            </div>

            {/* Time Header */}
            <div className="timeline-time-header" style={{ display: 'flex', height: '50px', alignItems: 'center', borderBottom: '1px solid #333', background: 'rgba(20, 20, 30, 0.95)', position: 'sticky', top: 0, zIndex: 5 }}>
                {months.map(month => {
                    const daysInMonth = eachDayOfInterval({
                        start: month,
                        end: new Date(Math.min(new Date(month.getFullYear(), month.getMonth() + 1, 0), endDate))
                    }).length;

                    return (
                        <div
                            key={month.toISOString()}
                            className="time-header-cell"
                            style={{
                                width: `${daysInMonth * COLUMN_WIDTH}px`,
                                borderRight: '1px solid rgba(255,255,255,0.05)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '100%',
                                color: '#888',
                                fontSize: '0.8rem'
                            }}
                        >
                            {format(month, 'MMMM yyyy')}
                        </div>
                    );
                })}
            </div>

            {/* Days Header */}
            <div className="timeline-days-header" style={{ display: 'flex', height: '30px', alignItems: 'center', borderBottom: '1px solid #333', background: 'rgba(30, 30, 40, 0.95)', zIndex: 4 }}>
                {days.map(day => (
                    <div
                        key={day.toISOString()}
                        className="day-header-cell"
                        style={{
                            width: `${COLUMN_WIDTH}px`,
                            borderRight: '1px solid rgba(255,255,255,0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            color: '#666',
                            fontSize: '0.7rem'
                        }}
                    >
                        {format(day, 'd')}
                    </div>
                ))}
            </div>

            {/* Today Marker */}
            {todayPixel >= 0 && todayPixel <= totalWidth && (
                <div className="today-line" style={{ left: `${todayPixel}px`, height: '100%' }}>
                    <div className="today-label">Today</div>
                </div>
            )}

            {/* Rows */}
            <div className="timeline-rows-container" style={{ position: 'relative', minHeight: '100%' }}>
                {epics.map(epic => (
                    <React.Fragment key={epic._id}>
                        {/* Epic Row */}
                        <div className="timeline-row-grid" style={{ height: '40px', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <TimelineBar
                                issue={epic}
                                startDate={startDate}
                                dateToPixel={dateToPixel}
                                pixelToDate={pixelToDate}
                                onUpdate={onUpdateIssue}
                            />
                        </div>

                        {/* Child Rows */}
                        {expandedEpics[epic._id] && epic.children?.map(child => (
                            <div key={child._id} className="child-row-grid" style={{ height: '36px', borderBottom: '1px solid rgba(255,255,255,0.02)', position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <TimelineBar
                                    issue={child}
                                    startDate={startDate}
                                    dateToPixel={dateToPixel}
                                    pixelToDate={pixelToDate}
                                    onUpdate={onUpdateIssue}
                                />
                            </div>
                        ))}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

export default TimelineGrid;
