import React from 'react';

/**
 * UserAvatar — Displays user initials with a consistent hue derived from the name.
 *
 * Props:
 *  name   — full name string
 *  size   — 'xs' | 'sm' | 'md' | 'lg'
 *  className — extra class names
 */

const HUES = [180, 210, 240, 270, 300, 330, 0, 30, 60, 90, 120, 150];

const nameToHue = (name = '') => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
    }
    return HUES[Math.abs(hash) % HUES.length];
};

const getInitials = (name = '') => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0 || !parts[0]) return '?';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const SIZE_MAP = {
    xs: { width: 20, height: 20, fontSize: 9 },
    sm: { width: 28, height: 28, fontSize: 11 },
    md: { width: 36, height: 36, fontSize: 13 },
    lg: { width: 48, height: 48, fontSize: 17 },
};

const UserAvatar = ({ name = '', size = 'sm', className = '', style = {} }) => {
    const hue = nameToHue(name);
    const { width, height, fontSize } = SIZE_MAP[size] || SIZE_MAP.sm;
    const initials = getInitials(name);

    return (
        <div
            className={`user-avatar ${className}`}
            aria-label={`Avatar for ${name}`}
            role="img"
            style={{
                width,
                height,
                fontSize,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                flexShrink: 0,
                background: `hsl(${hue}, 55%, 28%)`,
                color: `hsl(${hue}, 80%, 75%)`,
                border: `1.5px solid hsl(${hue}, 50%, 35%)`,
                letterSpacing: '0.02em',
                userSelect: 'none',
                ...style,
            }}
        >
            {initials}
        </div>
    );
};

export default React.memo(UserAvatar);
