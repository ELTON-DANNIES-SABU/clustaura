import React from 'react';

/**
 * SkeletonCard — Pulsing placeholder shown while posts are loading.
 *
 * Props:
 *  count — number of skeletons to render
 */
const SingleSkeleton = () => (
    <div className="skeleton-card" aria-hidden="true">
        {/* Voting sidebar */}
        <div className="skeleton-card__vote">
            <div className="skeleton skeleton--circle" style={{ width: 24, height: 24 }} />
            <div className="skeleton skeleton--line" style={{ width: 28, height: 16, marginTop: 6, marginBottom: 6 }} />
            <div className="skeleton skeleton--circle" style={{ width: 24, height: 24 }} />
        </div>

        {/* Body */}
        <div className="skeleton-card__body">
            {/* Meta row */}
            <div className="skeleton-card__meta">
                <div className="skeleton skeleton--circle" style={{ width: 20, height: 20 }} />
                <div className="skeleton skeleton--line" style={{ width: 80 }} />
                <div className="skeleton skeleton--line" style={{ width: 50 }} />
                <div className="skeleton skeleton--line" style={{ width: 70 }} />
            </div>

            {/* Title */}
            <div className="skeleton skeleton--line skeleton--title" />
            <div className="skeleton skeleton--line skeleton--title" style={{ width: '70%' }} />

            {/* Tags */}
            <div className="skeleton-card__tags">
                <div className="skeleton skeleton--pill" />
                <div className="skeleton skeleton--pill" />
                <div className="skeleton skeleton--pill" />
            </div>

            {/* Body lines */}
            <div className="skeleton skeleton--line" />
            <div className="skeleton skeleton--line" />
            <div className="skeleton skeleton--line" style={{ width: '60%' }} />

            {/* Action bar */}
            <div className="skeleton-card__actions">
                <div className="skeleton skeleton--pill" style={{ width: 120 }} />
                <div className="skeleton skeleton--pill" style={{ width: 100 }} />
            </div>
        </div>
    </div>
);

const SkeletonCard = ({ count = 3 }) => (
    <div className="post-feed" role="status" aria-label="Loading posts...">
        {Array.from({ length: count }).map((_, i) => (
            <SingleSkeleton key={i} />
        ))}
    </div>
);

export default SkeletonCard;
