import React, { useState, useEffect, useCallback, memo } from 'react';
import axios from 'axios';
import { UserPlus, MessageCircle, Award, X, Sparkles, Zap, TrendingUp, ChevronRight } from 'lucide-react';

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
            <div className="glass-card" style={{
                padding: 'var(--sp-8)',
                marginBottom: 'var(--sp-6)',
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: 40,
                        height: 40,
                        margin: '0 auto var(--sp-4)',
                        border: '3px solid var(--border-subtle)',
                        borderTopColor: 'var(--node-green)',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                    }} />
                    <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                        Finding expert matches...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="glass-card" style={{
                padding: 'var(--sp-8)',
                marginBottom: 'var(--sp-6)',
                border: '1px solid rgba(224,82,82,0.3)',
            }}>
                <div style={{ textAlign: 'center' }}>
                    <Zap size={32} style={{ color: 'var(--color-error)', marginBottom: 'var(--sp-4)' }} />
                    <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: 'var(--sp-2)' }}>
                        Connection Error
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--sp-4)' }}>
                        {error}
                    </p>
                    <button
                        onClick={fetchRecommendations}
                        className="post-action-btn"
                        style={{ margin: '0 auto' }}
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (experts.length === 0) {
        return null;
    }

    return (
        <div className="glass-card" style={{
            padding: 'var(--sp-6)',
            marginBottom: 'var(--sp-6)',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Decorative elements */}
            <div style={{
                position: 'absolute',
                top: -20,
                right: -20,
                width: 150,
                height: 150,
                background: 'radial-gradient(circle at center, rgba(51,153,51,0.1) 0%, transparent 70%)',
                borderRadius: '50%',
                pointerEvents: 'none',
            }} />

            <div style={{
                position: 'absolute',
                bottom: -20,
                left: -20,
                width: 150,
                height: 150,
                background: 'radial-gradient(circle at center, rgba(64,192,255,0.1) 0%, transparent 70%)',
                borderRadius: '50%',
                pointerEvents: 'none',
            }} />

            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--sp-6)',
                position: 'relative',
                zIndex: 1,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                    <div style={{
                        background: 'var(--node-green-gradient)',
                        padding: 'var(--sp-2)',
                        borderRadius: 'var(--radius-md)',
                    }}>
                        <Sparkles size={16} color="white" />
                    </div>
                    <h3 style={{
                        fontSize: 'var(--text-sm)',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        background: 'var(--node-green-gradient)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}>
                        AI Expert Match
                    </h3>
                    <span style={{
                        background: 'rgba(51,153,51,0.1)',
                        color: 'var(--node-green)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: 10,
                        fontWeight: 700,
                    }}>
                        {experts.length} found
                    </span>
                </div>

                {onClose && (
                    <button
                        onClick={onClose}
                        className="post-action-btn"
                        style={{ padding: 'var(--sp-2)' }}
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Project selector */}
            {projects.length > 0 && (
                <div style={{ marginBottom: 'var(--sp-6)', position: 'relative', zIndex: 1 }}>
                    <label style={{
                        display: 'block',
                        fontSize: 'var(--text-xs)',
                        color: 'var(--text-muted)',
                        marginBottom: 'var(--sp-2)',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                    }}>
                        <TrendingUp size={12} style={{ marginRight: 4 }} />
                        Invite to Project
                    </label>
                    <select
                        className="project-invite-dropdown"
                        value={selectedProjectId || ''}
                        onChange={(e) => onProjectChange(e.target.value)}
                        style={{
                            width: '100%',
                            padding: 'var(--sp-3) var(--sp-4)',
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-lg)',
                            color: 'var(--text-primary)',
                            fontSize: 'var(--text-sm)',
                            outline: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--node-green)'}
                        onBlur={(e) => e.target.style.borderColor = 'var(--border-subtle)'}
                    >
                        <option value="" disabled>Choose a project...</option>
                        {projects.map(p => (
                            <option key={p._id} value={p._id}>{p.name}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* Experts list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
                {experts.map((expert) => (
                    <div
                        key={expert.user_id}
                        className="expert-card"
                        style={{
                            background: 'linear-gradient(135deg, rgba(17,17,17,0.8) 0%, rgba(26,26,26,0.8) 100%)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-lg)',
                            padding: 'var(--sp-4)',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.borderColor = 'var(--node-green)';
                            e.currentTarget.style.boxShadow = 'var(--shadow-glow)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'none';
                            e.currentTarget.style.borderColor = 'var(--border-subtle)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                        onClick={() => setExpandedId(expandedId === expert.user_id ? null : expert.user_id)}
                    >
                        <div style={{ display: 'flex', gap: 'var(--sp-3)' }}>
                            {/* Avatar with gradient */}
                            <div style={{
                                width: 48,
                                height: 48,
                                borderRadius: 'var(--radius-lg)',
                                background: 'var(--node-green-gradient)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 'var(--text-lg)',
                                fontWeight: 700,
                                color: 'white',
                                flexShrink: 0,
                            }}>
                                {expert.initials || expert.userName?.charAt(0) || '?'}
                            </div>

                            {/* Expert info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: 'var(--sp-1)',
                                }}>
                                    <h4 style={{
                                        fontSize: 'var(--text-base)',
                                        fontWeight: 700,
                                        color: 'var(--text-primary)',
                                        margin: 0,
                                    }}>
                                        {expert.userName}
                                    </h4>
                                    <span style={{
                                        background: 'linear-gradient(135deg, var(--node-green) 0%, #40c0ff 100%)',
                                        color: 'white',
                                        padding: '2px 10px',
                                        borderRadius: 'var(--radius-full)',
                                        fontSize: 11,
                                        fontWeight: 700,
                                    }}>
                                        {expert.match_score}% Match
                                    </span>
                                </div>

                                {/* Expertise tags */}
                                <div style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: 'var(--sp-1)',
                                    marginBottom: 'var(--sp-2)',
                                }}>
                                    {expert.key_skills?.slice(0, 3).map(skill => (
                                        <span key={skill} style={{
                                            fontSize: 10,
                                            padding: '2px 8px',
                                            background: 'rgba(51,153,51,0.1)',
                                            color: 'var(--node-green)',
                                            borderRadius: 'var(--radius-full)',
                                        }}>
                                            {skill}
                                        </span>
                                    ))}
                                    {expert.key_skills?.length > 3 && (
                                        <span style={{
                                            fontSize: 10,
                                            color: 'var(--text-muted)',
                                        }}>
                                            +{expert.key_skills.length - 3}
                                        </span>
                                    )}
                                </div>

                                {/* Explanation (shown when expanded) */}
                                {expandedId === expert.user_id && expert.explanation && (
                                    <p style={{
                                        fontSize: 'var(--text-xs)',
                                        color: 'var(--text-muted)',
                                        lineHeight: '1.6',
                                        marginTop: 'var(--sp-2)',
                                        padding: 'var(--sp-2)',
                                        background: 'rgba(0,0,0,0.2)',
                                        borderRadius: 'var(--radius-md)',
                                        borderLeft: '2px solid var(--node-green)',
                                    }}>
                                        {expert.explanation}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div style={{
                            display: 'flex',
                            gap: 'var(--sp-2)',
                            marginTop: 'var(--sp-3)',
                        }}>
                            <button
                                className="post-action-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onMessage?.(expert.user_id);
                                }}
                                style={{
                                    flex: 1,
                                    justifyContent: 'center',
                                    padding: 'var(--sp-2)',
                                    background: 'rgba(51,153,51,0.05)',
                                }}
                            >
                                <MessageCircle size={14} />
                                Message
                            </button>

                            <button
                                className="btn-primary"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleInvite(expert.user_id);
                                }}
                                disabled={!selectedProjectId || invitingId === expert.user_id}
                                style={{
                                    flex: 2,
                                    padding: 'var(--sp-2)',
                                    fontSize: 'var(--text-xs)',
                                }}
                            >
                                {invitingId === expert.user_id ? (
                                    <>
                                        <span className="btn-spinner" />
                                        Inviting...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus size={14} />
                                        Invite to Team
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* View all link */}
            {experts.length > 3 && (
                <div style={{
                    marginTop: 'var(--sp-4)',
                    textAlign: 'center',
                }}>
                    <button className="post-action-btn" style={{ gap: 4 }}>
                        View All Experts
                        <ChevronRight size={14} />
                    </button>
                </div>
            )}
        </div>
    );
});

RecommendedExperts.displayName = 'RecommendedExperts';

export default RecommendedExperts;