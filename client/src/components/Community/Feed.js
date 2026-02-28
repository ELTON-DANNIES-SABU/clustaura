import React, { useState, useCallback, useMemo } from 'react';
import useCommunityStore from '../../store/communityStore';
import PostCard from './PostCard';
import SkeletonCard from './shared/SkeletonCard';
import { useNavigate } from 'react-router-dom';
import {
    PlusCircle, TrendingUp, Flame, Sparkles, Zap,
    Filter, SortDesc, Clock, Award, Star, ChevronDown,
    Grid, List, Layout, Compass, Hash, Globe
} from 'lucide-react';

const Feed = ({ onToast }) => {
    const { posts, loading } = useCommunityStore();
    const navigate = useNavigate();

    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    const [sortBy, setSortBy] = useState('trending'); // 'trending', 'newest', 'mostvoted', 'mostcommented'
    const [filterTag, setFilterTag] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [hoveredPost, setHoveredPost] = useState(null);

    // Extract all unique tags from posts
    const allTags = useMemo(() => {
        const tags = new Set();
        posts?.forEach(post => {
            post.tags?.forEach(tag => tags.add(tag));
        });
        return Array.from(tags).slice(0, 10);
    }, [posts]);

    // Sort and filter posts
    const filteredPosts = useMemo(() => {
        if (!posts) return [];

        let filtered = [...posts];

        // Apply tag filter
        if (filterTag) {
            filtered = filtered.filter(post => post.tags?.includes(filterTag));
        }

        // Apply sorting
        switch (sortBy) {
            case 'trending':
                filtered.sort((a, b) => {
                    const scoreA = (a.votes * 3) + (a.commentCount * 5) + (new Date(a.timestamp).getTime() / 100000);
                    const scoreB = (b.votes * 3) + (b.commentCount * 5) + (new Date(b.timestamp).getTime() / 100000);
                    return scoreB - scoreA;
                });
                break;
            case 'newest':
                filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                break;
            case 'mostvoted':
                filtered.sort((a, b) => b.votes - a.votes);
                break;
            case 'mostcommented':
                filtered.sort((a, b) => b.commentCount - a.commentCount);
                break;
            default:
                break;
        }

        return filtered;
    }, [posts, sortBy, filterTag]);

    const stats = useMemo(() => {
        if (!posts) return { total: 0, today: 0, trending: 0 };

        const today = new Date().setHours(0, 0, 0, 0);
        return {
            total: posts.length,
            today: posts.filter(p => new Date(p.timestamp).setHours(0, 0, 0, 0) === today).length,
            trending: posts.filter(p => (p.votes * 3) + (p.commentCount * 5) > 50).length
        };
    }, [posts]);

    const handlePostClick = useCallback((postId) => {
        navigate(`/community/post/${postId}`);
    }, [navigate]);

    if (loading) {
        return (
            <div className="feed-container">
                {/* Skeleton header */}
                <div className="glass-card" style={{
                    padding: 'var(--sp-6)',
                    marginBottom: 'var(--sp-6)',
                    background: 'linear-gradient(135deg, rgba(10,10,10,0.8), rgba(20,20,20,0.8))',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div className="skeleton" style={{ width: 200, height: 32, marginBottom: 12 }} />
                            <div className="skeleton" style={{ width: 300, height: 20 }} />
                        </div>
                        <div className="skeleton" style={{ width: 120, height: 40, borderRadius: 'var(--radius-full)' }} />
                    </div>
                </div>
                <SkeletonCard count={3} />
            </div>
        );
    }

    return (
        <div className="feed-container" style={{
            position: 'relative',
            zIndex: 1,
        }}>
            {/* Animated background for feed */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '300px',
                background: 'radial-gradient(circle at 50% 0%, rgba(51,153,51,0.1) 0%, transparent 70%)',
                pointerEvents: 'none',
                zIndex: 0,
            }} />

            {/* Header with stats */}
            <div className="glass-card" style={{
                padding: 'var(--sp-6)',
                marginBottom: 'var(--sp-6)',
                position: 'relative',
                zIndex: 1,
                border: '1px solid rgba(51,153,51,0.2)',
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
                    animation: 'pulse 4s infinite',
                }} />

                <div style={{
                    position: 'absolute',
                    bottom: -20,
                    left: -20,
                    width: 150,
                    height: 150,
                    background: 'radial-gradient(circle at center, rgba(64,192,255,0.1) 0%, transparent 70%)',
                    borderRadius: '50%',
                    animation: 'pulse 4s infinite 2s',
                }} />

                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 'var(--sp-4)',
                    position: 'relative',
                    zIndex: 1,
                }}>
                    <div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            marginBottom: 8,
                        }}>
                            <div style={{
                                background: 'linear-gradient(135deg, #339933, #40c0ff)',
                                padding: '10px',
                                borderRadius: 'var(--radius-lg)',
                                boxShadow: '0 4px 15px rgba(51,153,51,0.3)',
                            }}>
                                <Globe size={24} color="white" />
                            </div>
                            <h1 style={{
                                fontSize: 'clamp(24px, 5vw, 32px)',
                                fontWeight: 800,
                                background: 'linear-gradient(135deg, #fff 0%, #339933 50%, #40c0ff 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                margin: 0,
                            }}>
                                Global Challenges
                            </h1>
                        </div>
                        <p style={{
                            fontSize: 'var(--text-sm)',
                            color: 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 16,
                            flexWrap: 'wrap',
                        }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Compass size={14} />
                                Discover solutions from developers worldwide
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Flame size={14} style={{ color: '#ff4d4d' }} />
                                {stats.trending} trending now
                            </span>
                        </p>
                    </div>

                    {/* Stats cards */}
                    <div style={{
                        display: 'flex',
                        gap: 16,
                        flexWrap: 'wrap',
                    }}>
                        <div style={{
                            background: 'rgba(51,153,51,0.1)',
                            padding: '12px 20px',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid rgba(51,153,51,0.2)',
                            textAlign: 'center',
                            minWidth: 100,
                        }}>
                            <div style={{ fontSize: 24, fontWeight: 700, color: '#339933' }}>{stats.total}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total</div>
                        </div>
                        <div style={{
                            background: 'rgba(64,192,255,0.1)',
                            padding: '12px 20px',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid rgba(64,192,255,0.2)',
                            textAlign: 'center',
                            minWidth: 100,
                        }}>
                            <div style={{ fontSize: 24, fontWeight: 700, color: '#40c0ff' }}>{stats.today}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Today</div>
                        </div>
                        <button
                            className="btn-primary"
                            onClick={() => navigate('/community/create')}
                            style={{
                                padding: '12px 28px',
                                fontSize: 14,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                            }}
                        >
                            <PlusCircle size={18} />
                            New Challenge
                        </button>
                    </div>
                </div>
            </div>

            {/* Filters and controls */}
            <div style={{
                marginBottom: 'var(--sp-6)',
                position: 'relative',
                zIndex: 1,
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 'var(--sp-4)',
                }}>
                    {/* Sort options */}
                    <div style={{
                        display: 'flex',
                        gap: 8,
                        background: 'rgba(0,0,0,0.3)',
                        padding: 4,
                        borderRadius: 'var(--radius-full)',
                        border: '1px solid rgba(51,153,51,0.2)',
                        flexWrap: 'wrap',
                    }}>
                        {[
                            { id: 'trending', label: 'Trending', icon: TrendingUp },
                            { id: 'newest', label: 'Newest', icon: Clock },
                            { id: 'mostvoted', label: 'Top Voted', icon: Award },
                            { id: 'mostcommented', label: 'Most Discussed', icon: Star },
                        ].map(option => {
                            const Icon = option.icon;
                            const isActive = sortBy === option.id;
                            return (
                                <button
                                    key={option.id}
                                    onClick={() => setSortBy(option.id)}
                                    style={{
                                        padding: '8px 16px',
                                        background: isActive ? 'linear-gradient(135deg, #339933, #40c0ff)' : 'transparent',
                                        border: 'none',
                                        borderRadius: 'var(--radius-full)',
                                        color: isActive ? 'white' : 'var(--text-muted)',
                                        fontSize: 13,
                                        fontWeight: isActive ? 600 : 400,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    <Icon size={14} />
                                    {option.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* View mode toggle */}
                    <div style={{
                        display: 'flex',
                        gap: 8,
                        background: 'rgba(0,0,0,0.3)',
                        padding: 4,
                        borderRadius: 'var(--radius-full)',
                        border: '1px solid rgba(51,153,51,0.2)',
                    }}>
                        <button
                            onClick={() => setViewMode('grid')}
                            style={{
                                padding: '8px 12px',
                                background: viewMode === 'grid' ? 'rgba(51,153,51,0.2)' : 'transparent',
                                border: 'none',
                                borderRadius: 'var(--radius-full)',
                                color: viewMode === 'grid' ? '#339933' : 'var(--text-muted)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                            }}
                        >
                            <Grid size={16} />
                            Grid
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            style={{
                                padding: '8px 12px',
                                background: viewMode === 'list' ? 'rgba(51,153,51,0.2)' : 'transparent',
                                border: 'none',
                                borderRadius: 'var(--radius-full)',
                                color: viewMode === 'list' ? '#339933' : 'var(--text-muted)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                            }}
                        >
                            <List size={16} />
                            List
                        </button>
                    </div>

                    {/* Filter toggle */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="post-action-btn"
                        style={{
                            padding: '8px 16px',
                            background: showFilters ? 'rgba(51,153,51,0.1)' : 'transparent',
                            border: '1px solid rgba(51,153,51,0.2)',
                            borderRadius: 'var(--radius-full)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                        }}
                    >
                        <Filter size={14} />
                        Filters
                        {filterTag && (
                            <span style={{
                                background: '#339933',
                                color: 'white',
                                padding: '2px 6px',
                                borderRadius: 'var(--radius-full)',
                                fontSize: 10,
                                marginLeft: 4,
                            }}>
                                1
                            </span>
                        )}
                        <ChevronDown size={14} style={{
                            transform: showFilters ? 'rotate(180deg)' : 'none',
                            transition: 'transform 0.2s ease',
                        }} />
                    </button>
                </div>

                {/* Filter panel */}
                {showFilters && (
                    <div className="glass-card" style={{
                        marginTop: 'var(--sp-4)',
                        padding: 'var(--sp-6)',
                        animation: 'slideDown 0.3s ease',
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 'var(--sp-4)',
                        }}>
                            <span style={{
                                fontSize: 'var(--text-sm)',
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                            }}>
                                <Hash size={16} style={{ color: '#339933' }} />
                                Filter by Topic
                            </span>
                            {filterTag && (
                                <button
                                    onClick={() => setFilterTag(null)}
                                    className="post-action-btn"
                                    style={{ fontSize: 12 }}
                                >
                                    Clear filter
                                </button>
                            )}
                        </div>

                        <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 8,
                        }}>
                            {allTags.map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => setFilterTag(tag === filterTag ? null : tag)}
                                    style={{
                                        padding: '6px 16px',
                                        background: tag === filterTag
                                            ? 'linear-gradient(135deg, #339933, #40c0ff)'
                                            : 'rgba(51,153,51,0.05)',
                                        border: tag === filterTag
                                            ? 'none'
                                            : '1px solid rgba(51,153,51,0.2)',
                                        borderRadius: 'var(--radius-full)',
                                        color: tag === filterTag ? 'white' : 'var(--text-secondary)',
                                        fontSize: 13,
                                        fontWeight: tag === filterTag ? 600 : 400,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        transition: 'all 0.2s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (tag !== filterTag) {
                                            e.currentTarget.style.background = 'rgba(51,153,51,0.1)';
                                            e.currentTarget.style.borderColor = '#339933';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (tag !== filterTag) {
                                            e.currentTarget.style.background = 'rgba(51,153,51,0.05)';
                                            e.currentTarget.style.borderColor = 'rgba(51,153,51,0.2)';
                                        }
                                    }}
                                >
                                    <Hash size={12} />
                                    {tag}
                                </button>
                            ))}
                            {allTags.length === 0 && (
                                <p style={{ color: 'var(--text-muted)', fontSize: 13, fontStyle: 'italic' }}>
                                    No topics available yet
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Posts grid/list */}
            {filteredPosts.length === 0 ? (
                <div className="glass-card" style={{
                    padding: 'var(--sp-16) var(--sp-8)',
                    textAlign: 'center',
                    position: 'relative',
                    zIndex: 1,
                }}>
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '200%',
                        height: '200%',
                        background: 'radial-gradient(circle at center, rgba(51,153,51,0.05) 0%, transparent 70%)',
                        animation: 'rotate 20s linear infinite',
                        pointerEvents: 'none',
                    }} />

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{
                            fontSize: 60,
                            marginBottom: 'var(--sp-4)',
                            animation: 'float 3s ease-in-out infinite',
                        }}>
                            {filterTag ? '🔍' : '💡'}
                        </div>
                        <h3 style={{
                            fontSize: 'var(--text-2xl)',
                            fontWeight: 700,
                            marginBottom: 'var(--sp-2)',
                            background: 'linear-gradient(135deg, #fff, #a0a0a0)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>
                            {filterTag ? `No challenges found for #${filterTag}` : 'No challenges yet'}
                        </h3>
                        <p style={{
                            fontSize: 'var(--text-sm)',
                            color: 'var(--text-muted)',
                            marginBottom: 'var(--sp-6)',
                            maxWidth: 400,
                            margin: '0 auto var(--sp-6)',
                        }}>
                            {filterTag
                                ? `Be the first to post a challenge about ${filterTag}!`
                                : 'Start the conversation by sharing your first technical challenge with the community.'}
                        </p>
                        <button
                            className="btn-primary"
                            onClick={() => navigate('/community/create')}
                            style={{
                                padding: '14px 32px',
                                fontSize: 14,
                            }}
                        >
                            <PlusCircle size={18} />
                            {filterTag ? `Post #${filterTag} Challenge` : 'Create First Challenge'}
                        </button>
                    </div>
                </div>
            ) : (
                <div style={{
                    display: viewMode === 'grid' ? 'grid' : 'flex',
                    gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(350px, 1fr))' : 'none',
                    flexDirection: 'column',
                    gap: 'var(--sp-4)',
                    position: 'relative',
                    zIndex: 1,
                }}>
                    {filteredPosts.map((post, index) => (
                        <div
                            key={post.id}
                            onClick={() => handlePostClick(post.id)}
                            onMouseEnter={() => setHoveredPost(post.id)}
                            onMouseLeave={() => setHoveredPost(null)}
                            style={{
                                animation: `fadeInUp 0.5s ease-out ${index * 0.05}s both`,
                                transform: hoveredPost === post.id ? 'scale(1.02)' : 'scale(1)',
                                transition: 'transform 0.2s ease',
                            }}
                        >
                            <PostCard
                                post={post}
                                onToast={onToast}
                                viewMode={viewMode}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Load more button (if paginated) */}
            {filteredPosts.length > 0 && filteredPosts.length % 10 === 0 && (
                <div style={{
                    marginTop: 'var(--sp-8)',
                    textAlign: 'center',
                }}>
                    <button
                        className="btn-secondary"
                        style={{
                            padding: '12px 32px',
                            fontSize: 14,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                        }}
                    >
                        Load More Challenges
                        <Zap size={14} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default React.memo(Feed);