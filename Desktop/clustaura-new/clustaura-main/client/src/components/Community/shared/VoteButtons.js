import React, { useCallback, useState } from 'react';
import { ArrowBigUp, ArrowBigDown } from 'lucide-react';

/**
 * VoteButtons — Reusable up/down vote control.
 *
 * Props:
 *  votes      — current net vote count
 *  userVote   — current user's vote: 1, 0, or -1
 *  onVote     — (direction: 1 | -1) => void
 *  size       — 'sm' | 'md' | 'lg' (icon size)
 *  vertical   — boolean (default true); false = horizontal layout
 */
const VoteButtons = ({
    votes = 0,
    userVote = 0,
    onVote,
    size = 'md',
    vertical = true,
}) => {
    const [animating, setAnimating] = useState(null);

    const iconSize = size === 'sm' ? 18 : size === 'lg' ? 32 : 24;
    const scoreClass = size === 'sm' ? 'vote-score--sm' : size === 'lg' ? 'vote-score--lg' : 'vote-score--md';

    const handleVote = useCallback((e, direction) => {
        e?.stopPropagation();
        if (!onVote) return;
        setAnimating(direction);
        onVote(direction);
        setTimeout(() => setAnimating(null), 300);
    }, [onVote]);

    const handleKeyDown = useCallback((e, direction) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleVote(null, direction);
        }
    }, [handleVote]);

    const upActive = userVote === 1;
    const downActive = userVote === -1;

    return (
        <div
            className={`vote-buttons ${vertical ? 'vote-buttons--vertical' : 'vote-buttons--horizontal'}`}
            role="group"
            aria-label="Vote on this post"
        >
            <button
                className={`vote-btn vote-btn--up ${upActive ? 'vote-btn--active' : ''} ${animating === 1 ? 'vote-btn--animating' : ''}`}
                onClick={(e) => handleVote(e, 1)}
                onKeyDown={(e) => handleKeyDown(e, 1)}
                aria-label={upActive ? 'Remove upvote' : 'Upvote'}
                aria-pressed={upActive}
                title="Upvote"
            >
                <ArrowBigUp
                    size={iconSize}
                    fill={upActive ? 'var(--node-green)' : 'none'}
                    color={upActive ? 'var(--node-green)' : 'currentColor'}
                />
            </button>

            <span
                className={`vote-score ${scoreClass} ${userVote !== 0 ? 'vote-score--active' : ''}`}
                aria-label={`${votes} votes`}
                aria-live="polite"
            >
                {votes}
            </span>

            <button
                className={`vote-btn vote-btn--down ${downActive ? 'vote-btn--active vote-btn--down-active' : ''} ${animating === -1 ? 'vote-btn--animating' : ''}`}
                onClick={(e) => handleVote(e, -1)}
                onKeyDown={(e) => handleKeyDown(e, -1)}
                aria-label={downActive ? 'Remove downvote' : 'Downvote'}
                aria-pressed={downActive}
                title="Downvote"
            >
                <ArrowBigDown
                    size={iconSize}
                    fill={downActive ? 'var(--color-error)' : 'none'}
                    color={downActive ? 'var(--color-error)' : 'currentColor'}
                />
            </button>
        </div>
    );
};

export default React.memo(VoteButtons);
