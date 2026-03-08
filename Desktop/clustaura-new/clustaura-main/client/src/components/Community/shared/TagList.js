import React from 'react';

/**
 * TagList — Renders an array of tag strings as pill badges.
 *
 * Props:
 *  tags         — string[]
 *  fallback     — string shown when tags is empty (default: 'Discussion')
 *  onClick      — (tag: string) => void  — optional click handler per tag
 *  className    — extra class names on the wrapper
 */
const TagList = ({
    tags = [],
    fallback = 'Discussion',
    onClick,
    className = '',
}) => {
    const displayTags = tags.length > 0 ? tags : null;

    return (
        <div
            className={`tag-list ${className}`}
            role="list"
            aria-label="Post tags"
        >
            {displayTags
                ? displayTags.map((tag, idx) => (
                    <span
                        key={idx}
                        role="listitem"
                        className={`tag-pill tag-pill--green ${onClick ? 'tag-pill--clickable' : ''}`}
                        onClick={onClick ? () => onClick(tag) : undefined}
                        tabIndex={onClick ? 0 : -1}
                        onKeyDown={onClick ? (e) => { if (e.key === 'Enter') onClick(tag); } : undefined}
                        aria-label={`Tag: ${tag}`}
                    >
                        #{tag}
                    </span>
                ))
                : (
                    <span role="listitem" className="tag-pill tag-pill--muted">
                        {fallback}
                    </span>
                )
            }
        </div>
    );
};

export default React.memo(TagList);
