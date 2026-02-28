import React, { useState, useCallback, memo } from 'react';
import {
    MessageSquare, Lightbulb, Pencil, Trash2, Sparkles,
    TrendingUp, Award, Flame, Clock, Eye, Share2, Bookmark,
    MoreHorizontal, Zap, ChevronUp, ChevronDown, Globe, Users,
    Code, Brain, Rocket
} from 'lucide-react';
import useCommunityStore from '../../store/communityStore';
import VoteButtons from './shared/VoteButtons';
import TagList from './shared/TagList';
import UserAvatar from './shared/UserAvatar';
import EditPostModal from './EditPostModal';

const PostCard = memo(({ post, onToast, viewMode = 'grid' }) => {
    const { vote, deletePost, getLoggedInUser } = useCommunityStore();
    const currentUser = getLoggedInUser();
    const isAuthor = currentUser?.id === post.authorId;
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [showActions, setShowActions] = useState(false);

    const handleVote = useCallback(async (direction) => {
        try {
            await vote(post.id, direction);
        } catch {
            onToast?.('Failed to record your vote. Please try again.', 'error');
        }
    }, [post.id, vote, onToast]);

    const handleDelete = useCallback(async (e) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this post?')) {
            const ok = await deletePost(post.id);
            if (ok) {
                onToast?.('✨ Post deleted successfully', 'success');
            } else {
                onToast?.('Failed to delete post. Please try again.', 'error');
            }
        }
    }, [post.id, deletePost, onToast]);

    const handleEdit = useCallback((e) => {
        e.stopPropagation();
        setIsEditModalOpen(true);
    }, []);

    const handleSave = useCallback((e) => {
        e.stopPropagation();
        setIsSaved(!isSaved);
        onToast?.(!isSaved ? '📌 Challenge saved' : 'Challenge unsaved', 'info');
    }, [isSaved, onToast]);

    const stopProp = useCallback((e) => e.stopPropagation(), []);

    const relativeTime = (timestamp) => {
        const now = new Date();
        const postDate = new Date(timestamp);
        const diffSeconds = Math.floor((now - postDate) / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffSeconds < 60) return 'Just now';
        if (diffMinutes < 60) return `${diffMinutes}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return postDate.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric'
        });
    };

    // Calculate engagement score with weighted formula
    const engagementScore = (post.votes * 3) + (post.commentCount * 5);
    const isHot = engagementScore > 100;
    const isTrending = engagementScore > 50 && engagementScore <= 100;
    const isNew = new Date(post.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Determine difficulty based on tags or content
    const difficulty = post.tags?.some(t => ['hard', 'advanced', 'expert'].includes(t.toLowerCase()))
        ? 'Advanced'
        : post.tags?.some(t => ['medium', 'intermediate'].includes(t.toLowerCase()))
            ? 'Intermediate'
            : 'Beginner';

    const difficultyColor = difficulty === 'Advanced' ? '#ff4d4d' : difficulty === 'Intermediate' ? '#ffaa33' : '#339933';

    return (
        <article
            className={`post-card ${viewMode === 'list' ? 'post-card--list' : ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            tabIndex={0}
            role="article"
            aria-label={`Challenge: ${post.title}`}
            style={{
                transform: isHovered ? 'translateY(-8px) scale(1.02)' : 'none',
                display: viewMode === 'list' ? 'flex' : 'block',
                gap: viewMode === 'list' ? 'var(--sp-6)' : 'none',
            }}
        >
            {/* Animated status badges */}
            <div style={{
                position: 'absolute',
                top: 'var(--sp-4)',
                right: 'var(--sp-4)',
                display: 'flex',
                gap: 'var(--sp-2)',
                zIndex: 2,
            }}>
                {isHot && (
                    <span style={{
                        background: 'linear-gradient(135deg, #ff4d4d, #ff6b6b)',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: '0 4px 12px rgba(255,75,75,0.4)',
                        animation: 'pulse 2s infinite',
                    }}>
                        <Flame size={12} />
                        HOT
                    </span>
                )}
                {isTrending && !isHot && (
                    <span style={{
                        background: 'linear-gradient(135deg, #339933, #40c0ff)',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: '0 4px 12px rgba(51,153,51,0.4)',
                    }}>
                        <TrendingUp size={12} />
                        TRENDING
                    </span>
                )}
                {isNew && !isHot && !isTrending && (
                    <span style={{
                        background: 'linear-gradient(135deg, #40c0ff, #6f4fff)',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: '0 4px 12px rgba(64,192,255,0.4)',
                    }}>
                        <Sparkles size={12} />
                        NEW
                    </span>
                )}
            </div>

            {/* Difficulty badge */}
            <div style={{
                position: 'absolute',
                top: 'var(--sp-4)',
                left: 'var(--sp-4)',
                zIndex: 2,
            }}>
                <span style={{
                    background: `linear-gradient(135deg, ${difficultyColor}, ${difficultyColor}dd)`,
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    boxShadow: `0 4px 12px ${difficultyColor}40`,
                }}>
                    <Brain size={10} />
                    {difficulty}
                </span>
            </div>

            {/* Vote sidebar - positioned differently for list view */}
            <div className="voting-sidebar" onClick={stopProp} style={{
                position: 'relative',
                ...(viewMode === 'list' && {
                    marginRight: 'var(--sp-4)',
                }),
            }}>
                {isHovered && (
                    <div style={{
                        position: 'absolute',
                        top: -15,
                        left: -15,
                        right: -15,
                        bottom: -15,
                        background: 'radial-gradient(circle at center, rgba(51,153,51,0.15) 0%, transparent 70%)',
                        borderRadius: 'var(--radius-2xl)',
                        pointerEvents: 'none',
                        animation: 'pulse 2s infinite',
                    }} />
                )}
                <VoteButtons
                    votes={post.votes}
                    userVote={post.userVote}
                    onVote={handleVote}
                    size="md"
                    vertical={true}
                />
            </div>

            {/* Main content */}
            <div style={{
                flex: 1,
                minWidth: 0,
                position: 'relative',
                zIndex: 1,
                ...(viewMode === 'list' && {
                    display: 'flex',
                    gap: 'var(--sp-6)',
                }),
            }}>
                {/* Left column for list view - main content */}
                <div style={{
                    flex: viewMode === 'list' ? 2 : 1,
                    minWidth: 0,
                }}>
                    {/* Meta row with enhanced styling */}
                    <div className="post-meta-row" style={{
                        marginBottom: 'var(--sp-3)',
                        flexWrap: 'wrap',
                    }}>
                        <div className="post-meta-community">
                            <UserAvatar name={post.communityName || post.communityId} size="xs" />
                            <span style={{
                                fontWeight: 700,
                                background: 'linear-gradient(135deg, #fff, #a0a0a0)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}>
                                r/{post.communityId}
                            </span>
                        </div>
                        <span className="post-meta-dot" aria-hidden="true">•</span>
                        <span style={{
                            color: 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                        }}>
                            <UserAvatar name={post.author} size="xs" />
                            <span style={{
                                color: isAuthor ? '#339933' : 'var(--text-secondary)',
                                fontWeight: isAuthor ? 700 : 500,
                            }}>
                                u/{post.author}
                            </span>
                        </span>
                        <span className="post-meta-dot" aria-hidden="true">•</span>
                        <time dateTime={post.timestamp} style={{
                            color: 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                        }}>
                            <Clock size={12} />
                            {relativeTime(post.timestamp)}
                        </time>

                        {/* Global challenge indicator */}
                        <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            color: '#40c0ff',
                            fontSize: 11,
                            background: 'rgba(64,192,255,0.1)',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                            marginLeft: 8,
                        }}>
                            <Globe size={10} />
                            Global
                        </span>
                    </div>

                    {/* Title with hover effect */}
                    <h3
                        className="post-title"
                        style={{
                            fontSize: viewMode === 'list' ? 'var(--text-2xl)' : 'var(--text-xl)',
                            fontWeight: 700,
                            marginBottom: 'var(--sp-3)',
                            lineHeight: '1.5',
                            cursor: 'pointer',
                        }}
                    >
                        {post.title}
                    </h3>

                    {/* Tags with animation */}
                    <div style={{
                        marginBottom: 'var(--sp-3)',
                        animation: isHovered ? 'fadeInScale 0.3s ease' : 'none',
                    }}>
                        <TagList tags={post.tags} limit={viewMode === 'list' ? 8 : 5} />
                    </div>

                    {/* Content excerpt with gradient fade */}
                    {viewMode === 'grid' && (
                        <div style={{
                            position: 'relative',
                            marginBottom: 'var(--sp-4)',
                            maxHeight: isExpanded ? 'none' : '100px',
                            overflow: 'hidden',
                            transition: 'max-height 0.3s ease',
                        }}>
                            <p
                                style={{
                                    color: 'var(--text-secondary)',
                                    fontSize: 'var(--text-sm)',
                                    lineHeight: '1.8',
                                }}
                            >
                                {post.content}
                            </p>
                            {!isExpanded && post.content.length > 200 && (
                                <div style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    height: 40,
                                    background: 'linear-gradient(to bottom, transparent, var(--surface-bg))',
                                    pointerEvents: 'none',
                                }} />
                            )}
                        </div>
                    )}

                    {viewMode === 'list' && (
                        <div style={{
                            color: 'var(--text-secondary)',
                            fontSize: 'var(--text-base)',
                            lineHeight: '1.8',
                            marginBottom: 'var(--sp-4)',
                        }}>
                            {post.content.length > 300
                                ? post.content.substring(0, 300) + '...'
                                : post.content}
                        </div>
                    )}

                    {/* Read more button for grid view */}
                    {viewMode === 'grid' && post.content.length > 200 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsExpanded(!isExpanded);
                            }}
                            className="post-action-btn"
                            style={{
                                marginBottom: 'var(--sp-3)',
                                fontSize: 12,
                            }}
                        >
                            {isExpanded ? (
                                <>Show less <ChevronUp size={14} /></>
                            ) : (
                                <>Read more <ChevronDown size={14} /></>
                            )}
                        </button>
                    )}
                </div>

                {/* Right column for list view - stats and actions */}
                {viewMode === 'list' && (
                    <div style={{
                        flex: 1,
                        maxWidth: 300,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--sp-4)',
                    }}>
                        {/* Stats cards */}
                        <div style={{
                            background: 'rgba(0,0,0,0.3)',
                            borderRadius: 'var(--radius-lg)',
                            padding: 'var(--sp-4)',
                            border: '1px solid rgba(51,153,51,0.2)',
                        }}>
                            <h4 style={{
                                fontSize: 'var(--text-xs)',
                                color: 'var(--text-muted)',
                                marginBottom: 'var(--sp-3)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                            }}>
                                Challenge Stats
                            </h4>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: 'var(--sp-3)',
                            }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: 20, fontWeight: 700, color: '#339933' }}>
                                        {post.votes}
                                    </div>
                                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Votes</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: 20, fontWeight: 700, color: '#40c0ff' }}>
                                        {post.commentCount}
                                    </div>
                                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Solutions</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: 20, fontWeight: 700, color: '#ffaa33' }}>
                                        {Math.floor(Math.random() * 50) + 10}
                                    </div>
                                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Views</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: 20, fontWeight: 700, color: '#ff4d4d' }}>
                                        {engagementScore}
                                    </div>
                                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Score</div>
                                </div>
                            </div>
                        </div>

                        {/* Quick actions */}
                        <div style={{
                            display: 'flex',
                            gap: 'var(--sp-2)',
                        }}>
                            <button
                                className="btn-secondary"
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    fontSize: 12,
                                }}
                                onClick={stopProp}
                            >
                                <Lightbulb size={14} />
                                Suggest
                            </button>
                            <button
                                className="btn-secondary"
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    fontSize: 12,
                                }}
                                onClick={stopProp}
                            >
                                <Share2 size={14} />
                                Share
                            </button>
                            <button
                                className={`btn-secondary ${isSaved ? 'post-action-btn--active' : ''}`}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    fontSize: 12,
                                }}
                                onClick={handleSave}
                            >
                                <Bookmark size={14} fill={isSaved ? '#339933' : 'none'} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Action bar for grid view */}
            {viewMode === 'grid' && (
                <div className="post-action-bar" onClick={stopProp} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--sp-2)',
                    flexWrap: 'wrap',
                    marginTop: 'var(--sp-4)',
                }}>
                    <button
                        className="post-action-btn"
                        aria-label="Suggest a solution"
                        onClick={stopProp}
                        style={{
                            background: isHovered ? 'rgba(51,153,51,0.1)' : 'none',
                            padding: '8px 16px',
                        }}
                    >
                        <Lightbulb size={15} />
                        <span>Suggest</span>
                    </button>

                    <button
                        className="post-action-btn"
                        aria-label={`${post.commentCount} solutions`}
                        style={{
                            background: isHovered ? 'rgba(51,153,51,0.1)' : 'none',
                            padding: '8px 16px',
                        }}
                    >
                        <MessageSquare size={15} />
                        <span>{post.commentCount}</span>
                    </button>

                    <button
                        className="post-action-btn"
                        aria-label="Share"
                        onClick={stopProp}
                        style={{
                            padding: '8px 16px',
                        }}
                    >
                        <Share2 size={15} />
                    </button>

                    <button
                        className={`post-action-btn ${isSaved ? 'post-action-btn--active' : ''}`}
                        aria-label={isSaved ? 'Unsave' : 'Save'}
                        onClick={handleSave}
                        style={{
                            padding: '8px 16px',
                        }}
                    >
                        <Bookmark size={15} fill={isSaved ? '#339933' : 'none'} />
                    </button>

                    {isAuthor && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--sp-1)',
                            marginLeft: 'auto',
                        }}>
                            <button
                                className="post-action-btn"
                                onClick={handleEdit}
                                aria-label="Edit post"
                                title="Edit post"
                                style={{ padding: '8px' }}
                            >
                                <Pencil size={14} />
                            </button>
                            <button
                                className="post-action-btn post-action-btn--danger"
                                onClick={handleDelete}
                                aria-label="Delete post"
                                title="Delete post"
                                style={{ padding: '8px' }}
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    )}

                    {!isAuthor && (
                        <button
                            className="btn-primary"
                            style={{
                                marginLeft: 'auto',
                                padding: '6px 16px',
                                fontSize: 12,
                            }}
                            onClick={stopProp}
                        >
                            <Zap size={12} />
                            Follow
                        </button>
                    )}
                </div>
            )}

            {isEditModalOpen && (
                <EditPostModal
                    post={post}
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onToast={onToast}
                />
            )}
        </article>
    );
}, (prev, next) => {
    return prev.post.id === next.post.id &&
        prev.post.votes === next.post.votes &&
        prev.post.userVote === next.post.userVote &&
        prev.post.commentCount === next.post.commentCount;
});

PostCard.displayName = 'PostCard';

export default PostCard;