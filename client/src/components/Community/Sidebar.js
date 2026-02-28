import React, { useState } from 'react';
import { TrendingUp, Shield, Users, Sparkles, ChevronRight, Award, Flame, Star } from 'lucide-react';

const Sidebar = ({ communities }) => {
    const [joinedCommunities, setJoinedCommunities] = useState([]);

    const handleJoin = (commId, e) => {
        e.stopPropagation();
        setJoinedCommunities(prev =>
            prev.includes(commId)
                ? prev.filter(id => id !== commId)
                : [...prev, commId]
        );
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
            {/* Trending Communities - Premium Card */}
            <div className="glass-card" style={{
                padding: 'var(--sp-6)',
                position: 'relative',
                overflow: 'hidden',
            }}>
                <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: 100,
                    height: 100,
                    background: 'radial-gradient(circle at top right, rgba(51,153,51,0.1), transparent)',
                }} />

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--sp-2)',
                    marginBottom: 'var(--sp-6)',
                }}>
                    <div style={{
                        background: 'var(--node-green-gradient)',
                        padding: 'var(--sp-2)',
                        borderRadius: 'var(--radius-md)',
                    }}>
                        <TrendingUp size={18} color="white" />
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
                        Trending Communities
                    </h3>
                    <span style={{
                        background: 'rgba(51,153,51,0.1)',
                        color: 'var(--node-green)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: 10,
                        fontWeight: 700,
                        marginLeft: 'auto',
                    }}>
                        <Flame size={10} style={{ display: 'inline', marginRight: 2 }} />
                        Live
                    </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                    {communities.slice(0, 5).map((comm, index) => {
                        const isJoined = joinedCommunities.includes(comm.id);
                        const isHot = index < 2;

                        return (
                            <div
                                key={comm.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: 'var(--sp-2) var(--sp-3)',
                                    borderRadius: 'var(--radius-lg)',
                                    transition: 'all 0.2s ease',
                                    cursor: 'pointer',
                                    background: isJoined ? 'rgba(51,153,51,0.05)' : 'none',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'var(--surface-hover)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = isJoined ? 'rgba(51,153,51,0.05)' : 'none';
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
                                    <span style={{
                                        fontSize: 'var(--text-xs)',
                                        fontWeight: 700,
                                        color: isHot ? 'var(--node-green)' : 'var(--text-muted)',
                                        minWidth: 20,
                                    }}>
                                        #{index + 1}
                                    </span>
                                    <div style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: 'var(--radius-md)',
                                        background: isHot
                                            ? 'var(--node-green-gradient)'
                                            : 'var(--surface-hover)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        <Users size={16} color={isHot ? 'white' : 'var(--text-muted)'} />
                                    </div>
                                    <div>
                                        <span style={{
                                            fontSize: 'var(--text-sm)',
                                            fontWeight: 600,
                                            color: 'var(--text-primary)',
                                        }}>
                                            r/{comm.slug || comm.id}
                                        </span>
                                        {isHot && (
                                            <span style={{
                                                display: 'block',
                                                fontSize: 9,
                                                color: 'var(--node-green)',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                            }}>
                                                <Star size={8} style={{ display: 'inline', marginRight: 2 }} />
                                                Trending now
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <button
                                    className={isJoined ? 'btn-secondary' : 'btn-primary'}
                                    onClick={(e) => handleJoin(comm.id, e)}
                                    style={{
                                        padding: 'var(--sp-1) var(--sp-3)',
                                        fontSize: 10,
                                        minWidth: 60,
                                    }}
                                >
                                    {isJoined ? 'JOINED' : 'JOIN'}
                                </button>
                            </div>
                        );
                    })}
                </div>

                <button
                    className="post-action-btn"
                    style={{
                        width: '100%',
                        justifyContent: 'center',
                        marginTop: 'var(--sp-4)',
                        padding: 'var(--sp-3)',
                    }}
                >
                    View All Communities
                    <ChevronRight size={14} />
                </button>
            </div>

            {/* Community Rules - Premium Card */}
            <div className="glass-card" style={{
                padding: 'var(--sp-6)',
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--sp-2)',
                    marginBottom: 'var(--sp-6)',
                }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #ffaa33 0%, #ffbb4d 100%)',
                        padding: 'var(--sp-2)',
                        borderRadius: 'var(--radius-md)',
                    }}>
                        <Shield size={18} color="white" />
                    </div>
                    <h3 style={{
                        fontSize: 'var(--text-sm)',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        background: 'linear-gradient(135deg, #ffaa33 0%, #ffbb4d 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}>
                        Community Rules
                    </h3>
                </div>

                <ul style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--sp-4)',
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                }}>
                    {[
                        {
                            rule: 'Remember the human',
                            desc: 'Be respectful to others in the nebula',
                            icon: '🤝',
                        },
                        {
                            rule: 'No spam or self-promotion',
                            desc: 'Keep the frequency clean',
                            icon: '🚫',
                        },
                        {
                            rule: 'Post high-quality content',
                            desc: 'Clustaura is for elite minds',
                            icon: '✨',
                        },
                    ].map((item, index) => (
                        <li
                            key={index}
                            style={{
                                padding: 'var(--sp-3)',
                                background: 'rgba(255,255,255,0.02)',
                                borderRadius: 'var(--radius-lg)',
                                border: '1px solid var(--border-subtle)',
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--sp-3)',
                                marginBottom: 'var(--sp-1)',
                            }}>
                                <span style={{ fontSize: 20 }}>{item.icon}</span>
                                <span style={{
                                    fontSize: 'var(--text-sm)',
                                    fontWeight: 700,
                                    color: 'var(--text-primary)',
                                }}>
                                    {item.rule}
                                </span>
                            </div>
                            <p style={{
                                fontSize: 'var(--text-xs)',
                                color: 'var(--text-muted)',
                                marginLeft: 36,
                            }}>
                                {item.desc}
                            </p>
                        </li>
                    ))}
                </ul>

                <div style={{
                    marginTop: 'var(--sp-4)',
                    padding: 'var(--sp-3)',
                    background: 'rgba(255,170,51,0.05)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid rgba(255,170,51,0.2)',
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--sp-2)',
                    }}>
                        <Award size={16} style={{ color: '#ffaa33' }} />
                        <span style={{
                            fontSize: 'var(--text-xs)',
                            color: '#ffaa33',
                            fontWeight: 600,
                        }}>
                            Elite Member Benefits
                        </span>
                    </div>
                    <p style={{
                        fontSize: 10,
                        color: 'var(--text-muted)',
                        marginTop: 'var(--sp-1)',
                    }}>
                        Get access to exclusive channels and direct expert mentoring
                    </p>
                </div>
            </div>

            {/* Footer Links - Premium */}
            <div className="glass-card" style={{
                padding: 'var(--sp-4)',
                textAlign: 'center',
            }}>
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: 'var(--sp-3)',
                    marginBottom: 'var(--sp-3)',
                }}>
                    {['User Agreement', 'Privacy Policy', 'Content Policy'].map((item, i) => (
                        <a
                            key={i}
                            href="#"
                            style={{
                                fontSize: 10,
                                color: 'var(--text-muted)',
                                textDecoration: 'none',
                                transition: 'color 0.2s ease',
                            }}
                            onMouseEnter={(e) => e.target.style.color = 'var(--node-green)'}
                            onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
                        >
                            {item}
                        </a>
                    ))}
                </div>

                <div style={{
                    fontSize: 9,
                    color: 'var(--text-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                }}>
                    <Sparkles size={10} />
                    © 2026 ClustAura Nebula. All rights reserved.
                    <Sparkles size={10} />
                </div>

                <div style={{
                    marginTop: 'var(--sp-2)',
                    fontSize: 8,
                    color: 'var(--text-subtle)',
                    opacity: 0.5,
                }}>
                    v3.0 · Premium Edition
                </div>
            </div>
        </div>
    );
};

export default Sidebar;