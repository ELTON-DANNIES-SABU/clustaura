import React, { useEffect, useState } from 'react';
import axios from 'axios';

const StarBadge = ({ userId, stars: initialStars, tier: initialTier, size = 'sm' }) => {
    const [stars, setStars] = useState(initialStars || 0);
    const [tier, setTier] = useState(initialTier || 'Bronze');
    const [loading, setLoading] = useState(!initialStars && userId);

    useEffect(() => {
        if (!userId || (initialStars !== undefined && initialTier !== undefined)) {
            setLoading(false);
            return;
        }

        const fetchStars = async () => {
            try {
                const { data } = await axios.get(`http://localhost:5000/api/credits/${userId}/stars`);
                setStars(data.stars);
                setTier(data.tier);
            } catch (error) {
                console.error('Error fetching stars:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStars();
    }, [userId, initialStars, initialTier]);

    // Tier colors & thresholds
    // thresholds: Bronze < 21, Silver < 51, Neon >= 51
    const getTierColor = (t) => {
        switch (t) {
            case 'Neon': return '#39ff14'; // Neon Green
            case 'Silver': return '#e0e0e0'; // Brighter Silver
            case 'Bronze': return '#cd7f32';
            default: return '#cd7f32';
        }
    };

    const color = getTierColor(tier);
    const fontSize = size === 'lg' ? '1.5rem' : '0.9rem';

    // Enhanced Glow for Neon
    const glow = tier === 'Neon'
        ? `0 0 5px ${color}, 0 0 10px ${color}, 0 0 20px ${color}`
        : tier === 'Silver' ? `0 0 2px ${color}` : 'none';

    if (loading) return null;

    return (
        <span
            className="credit-star-badge"
            title={`${tier} Tier - ${stars} Stars`}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                marginLeft: '6px',
                color: color,
                textShadow: glow,
                fontWeight: 'bold',
                fontSize: fontSize,
                verticalAlign: 'middle'
            }}
        >
            <span style={{ fontSize: size === 'lg' ? '1.8rem' : '1.1rem' }}>⭐</span>
            <span>{stars}</span>
        </span>
    );
};

export default StarBadge;
