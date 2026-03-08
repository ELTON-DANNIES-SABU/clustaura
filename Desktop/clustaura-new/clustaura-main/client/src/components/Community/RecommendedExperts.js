import React, { useState, useEffect, useCallback, memo } from 'react';
import axios from 'axios';
import { UserPlus, MessageCircle, X, Sparkles, TrendingUp, ChevronRight } from 'lucide-react';
import './RecommendedExperts.css';

const RecommendedExperts = memo(({
    challengeId,
    onInvite,
    onMessage,
    projects = [],
    selectedProjectId,
    onProjectChange,
    onClose
}) => {
    const [experts, setExperts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [invitingId, setInvitingId] = useState(null);
    const [expandedId, setExpandedId] = useState(null);

    const fetchRecommendations = useCallback(async () => {
        if (!challengeId) return;

        setLoading(true);
        setError(null);

        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) {
                throw new Error('User not authenticated');
            }

            const { token } = JSON.parse(userStr);
            const config = {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 10000
            };

            const { data } = await axios.get(
                `/api/challenges/${challengeId}/recommendations`,
                config
            );

            setExperts(data);
        } catch (error) {
            console.error('[RecommendedExperts] Error:', error);
            setError(error.response?.data?.message || 'Failed to load recommendations');
        } finally {
            setLoading(false);
        }
    }, [challengeId]);

    useEffect(() => {
        fetchRecommendations();
    }, [fetchRecommendations]);

    const handleInvite = useCallback(async (userId) => {
        if (!selectedProjectId) {
            setError('Please select a project first');
            return;
        }

        setInvitingId(userId);
        try {
            await onInvite(userId, selectedProjectId);
        } finally {
            setInvitingId(null);
        }
    }, [selectedProjectId, onInvite]);

    if (loading) {
        return (
            <div className="recommended-experts-card" style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
                <div className="btn-spinner" style={{ margin: '0 auto var(--space-2)', width: '32px', height: '32px' }}></div>
                <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>Finding expert matches...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="recommended-experts-card" style={{ border: '1px solid var(--error-bg)', padding: 'var(--space-4)' }}>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ color: 'var(--error)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>Connection Error</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-4)' }}>{error}</p>
                    <button onClick={fetchRecommendations} className="invite-expert-btn" style={{ maxWidth: '120px', margin: '0 auto' }}>Try Again</button>
                </div>
            </div>
        );
    }

    if (experts.length === 0) {
        return null;
    }

    return (
        <div className="recommended-experts-card">
            {/* Header */}
            <div className="experts-header-container">
                <div className="experts-title-group">
                    <div className="experts-title-icon">
                        <Sparkles size={14} color="white" />
                    </div>
                    <h3 className="experts-title-text">AI Expert Match</h3>
                    <span className="experts-count-badge">{experts.length} found</span>
                </div>

                {onClose && (
                    <button onClick={onClose} className="close-experts-btn" title="Close">
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Project selector */}
            {projects.length > 0 && (
                <div className="project-selector-section">
                    <label className="project-selector-label">
                        <TrendingUp size={12} />
                        Invite to Project
                    </label>
                    <select
                        className="project-selector-dropdown"
                        value={selectedProjectId || ''}
                        onChange={(e) => onProjectChange(e.target.value)}
                    >
                        <option value="" disabled>Choose a project...</option>
                        {projects.map(p => (
                            <option key={p._id} value={p._id}>{p.name}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* Experts list */}
            <div className="experts-list-container">
                {experts.map((expert) => (
                    <div
                        key={expert.user_id}
                        className={`expert-card ${expandedId === expert.user_id ? 'is-expanded' : ''}`}
                        onClick={() => setExpandedId(expandedId === expert.user_id ? null : expert.user_id)}
                    >
                        <div className="expert-main-info">
                            <div className="expert-avatar">
                                {expert.initials || expert.userName?.charAt(0) || '?'}
                            </div>

                            <div className="expert-details">
                                <div className="expert-header-row">
                                    <h4 className="expert-name">{expert.userName}</h4>
                                    <span className="score-badge">
                                        {expert.match_score}% Match
                                    </span>
                                </div>

                                <div className="expert-skills">
                                    {expert.key_skills?.slice(0, 3).map(skill => (
                                        <span key={skill} className="mini-skill-tag">
                                            {skill}
                                        </span>
                                    ))}
                                    {expert.key_skills?.length > 3 && (
                                        <span style={{ fontSize: '8px', color: 'var(--text-muted)', fontWeight: 700 }}>
                                            +{expert.key_skills.length - 3}
                                        </span>
                                    )}
                                </div>
                                {expandedId === expert.user_id && expert.explanation && (
                                    <p className="expert-explanation">{expert.explanation}</p>
                                )}
                            </div>
                        </div>

                        <div className="expert-actions">
                            <button
                                className="message-expert-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onMessage?.(expert.user_id);
                                }}
                                title="Message Expert"
                            >
                                <MessageCircle size={16} />
                            </button>

                            <button
                                className="invite-expert-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleInvite(expert.user_id);
                                }}
                                disabled={!selectedProjectId || invitingId === expert.user_id}
                            >
                                {invitingId === expert.user_id ? (
                                    <span className="btn-spinner" />
                                ) : (
                                    <>
                                        <UserPlus size={14} />
                                        <span>Invite to Team</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* View all link */}
            {experts.length > 3 && (
                <div style={{ marginTop: 'var(--space-3)', textAlign: 'center' }}>
                    <button
                        className="message-expert-btn"
                        style={{ width: 'auto', padding: '0 16px', fontSize: '10px', fontWeight: 700, gap: '4px' }}
                    >
                        View All
                        <ChevronRight size={12} />
                    </button>
                </div>
            )}
        </div>
    );
});

RecommendedExperts.displayName = 'RecommendedExperts';

export default RecommendedExperts;