import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Sparkles } from 'lucide-react';

const RecommendedContributors = ({ postId }) => {
    const [contributors, setContributors] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchContributors = async () => {
            if (!postId) return;
            try {
                const userStr = localStorage.getItem('user');
                const token = userStr ? JSON.parse(userStr).token : '';
                const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
                
                const { data } = await axios.get(`/api/community/posts/${postId}/recommended-contributors?limit=5`, config);
                setContributors(data);
            } catch (err) {
                console.error('Error fetching recommended contributors:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchContributors();
    }, [postId]);

    if (loading) {
        return (
            <div style={{ padding: 'var(--sp-4)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                Loading recommendations...
            </div>
        );
    }

    if (contributors.length === 0) {
        return null; // hide if none found
    }

    return (
        <div style={{ padding: 'var(--sp-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--sp-6)', color: 'var(--text-primary)' }}>
                <Sparkles size={16} color="var(--node-green)" />
                <h3 style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>Recommended Contributors</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {contributors.map(c => (
                    <div key={c.userId} style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        padding: '12px',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-subtle)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '32px', height: '32px', borderRadius: '50%',
                                background: 'linear-gradient(135deg, var(--node-green), #00c6ff)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '14px', fontWeight: 700, color: '#fff', flexShrink: 0
                            }}>
                                {c.avatar ? <img src={c.avatar} alt={c.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : (c.name?.charAt(0) || 'U')}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 600, fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {c.name}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--node-green)', fontWeight: 600 }}>
                                    Match {(c.matchScore * 100).toFixed(0)}%
                                </div>
                            </div>
                        </div>
                        {c.expertise && (
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                {c.expertise} Specialist
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecommendedContributors;
