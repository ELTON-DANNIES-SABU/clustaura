import React, { useState, useCallback, memo, useRef, useEffect } from 'react';
import { MessageSquare, ChevronDown, ChevronUp, Sparkles, Heart, Zap } from 'lucide-react';
import useCommunityStore from '../../store/communityStore';
import VoteButtons from './shared/VoteButtons';
import UserAvatar from './shared/UserAvatar';
import CommentForm from './shared/CommentForm';

/* ─── Single Comment with enhanced aesthetics ─── */
const Comment = memo(({ comment, depth = 0, postId, onToast }) => {
    const [showReply, setShowReply] = useState(false);
    const [showReplies, setShowReplies] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const { voteComment, addComment } = useCommunityStore();
    const commentRef = useRef(null);

    useEffect(() => {
        if (depth > 0 && commentRef.current) {
            commentRef.current.style.animation = `slideInFade 0.3s ease-out`;
        }
    }, [depth]);

    const handleVote = useCallback((direction) => {
        voteComment(postId, comment.id, direction);
    }, [postId, comment.id, voteComment]);

    const handleReplySubmit = useCallback(async (content) => {
        try {
            await addComment(postId, content);
            setShowReply(false);
            onToast?.('✨ Reply posted!', 'success');
        } catch {
            onToast?.('Failed to post reply. Please try again.', 'error');
        }
    }, [postId, addComment, onToast]);

    const relativeTime = new Date(comment.timestamp).toLocaleDateString(undefined, {
        month: 'short', day: 'numeric',
    });

    const hasReplies = comment.replies?.length > 0;

    return (
        <li
            ref={commentRef}
            className={`comment-thread-item ${depth === 0 ? 'comment-thread-item--top' : 'comment-thread-item--reply'}`}
            role="listitem"
            aria-label={`Comment by ${comment.author}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                transition: 'all 0.2s ease',
                transform: isHovered ? 'translateX(2px)' : 'none',
            }}
        >
            {/* Vote column with floating effect */}
            <div style={{ flexShrink: 0, position: 'relative' }}>
                <div className={`vote-floating-effect ${isHovered ? 'active' : ''}`} />
                <VoteButtons
                    votes={comment.votes}
                    userVote={comment.userVote}
                    onVote={handleVote}
                    size="sm"
                    vertical={true}
                />
            </div>

            {/* Content column */}
            <div style={{ flex: 1, minWidth: 0 }}>
                {/* Author row with enhanced styling */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--sp-2)',
                    marginBottom: 'var(--sp-2)',
                    flexWrap: 'wrap'
                }}>
                    <UserAvatar name={comment.author} size="xs" />
                    <span
                        style={{
                            fontSize: 'var(--text-xs)',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            background: isHovered ? 'linear-gradient(135deg, var(--node-green) 0%, #40c0ff 100%)' : 'none',
                            WebkitBackgroundClip: isHovered ? 'text' : 'none',
                            WebkitTextFillColor: isHovered ? 'transparent' : 'none',
                            transition: 'all 0.2s ease',
                        }}
                        aria-label={`Author: ${comment.author}`}
                    >
                        u/{comment.author}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--text-subtle)' }} aria-hidden="true">•</span>
                    <time
                        dateTime={comment.timestamp}
                        style={{ fontSize: 10, color: 'var(--text-subtle)' }}
                    >
                        {relativeTime}
                    </time>

                    {/* Author badge for top-level comments */}
                    {depth === 0 && (
                        <span style={{
                            background: 'linear-gradient(135deg, rgba(51,153,51,0.1) 0%, rgba(64,192,255,0.1) 100%)',
                            border: '1px solid rgba(51,153,51,0.3)',
                            borderRadius: 'var(--radius-full)',
                            padding: '2px 8px',
                            fontSize: 9,
                            fontWeight: 600,
                            color: 'var(--node-green)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                        }}>
                            <Sparkles size={10} /> TOP CONTRIBUTOR
                        </span>
                    )}
                </div>

                {/* Comment body with enhanced typography */}
                <p
                    style={{
                        fontSize: 15,
                        color: 'var(--text-secondary)',
                        lineHeight: 'var(--lh-relaxed)',
                        marginBottom: 'var(--sp-3)',
                        background: isHovered ? 'rgba(51,153,51,0.02)' : 'none',
                        padding: isHovered ? 'var(--sp-2)' : 0,
                        borderRadius: 'var(--radius-md)',
                        transition: 'all 0.2s ease',
                    }}
                >
                    {comment.content}

                    {/* Wisdom indicator for long comments */}
                    {comment.content.length > 200 && (
                        <span style={{
                            display: 'inline-block',
                            marginLeft: 'var(--sp-2)',
                            fontSize: 10,
                            color: 'var(--node-green)',
                            opacity: 0.6,
                        }}>
                            <Zap size={12} style={{ display: 'inline', marginRight: 2 }} />
                            insight
                        </span>
                    )}
                </p>

                {/* Actions with cool hover effects */}
                <div style={{ display: 'flex', gap: 'var(--sp-4)', alignItems: 'center' }}>
                    <button
                        className="post-action-btn"
                        style={{
                            fontSize: 11,
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                        onClick={() => setShowReply(v => !v)}
                        aria-expanded={showReply}
                        aria-label={showReply ? 'Cancel reply' : 'Reply to this comment'}
                    >
                        <span style={{ position: 'relative', zIndex: 1 }}>
                            {showReply ? 'Cancel' : '↩ Reply'}
                        </span>
                        <span className="btn-glow-effect" />
                    </button>

                    {hasReplies && (
                        <button
                            className="post-action-btn"
                            style={{
                                fontSize: 11,
                                background: showReplies ? 'rgba(51,153,51,0.1)' : 'none',
                            }}
                            onClick={() => setShowReplies(v => !v)}
                            aria-expanded={showReplies}
                            aria-label={showReplies ? 'Hide replies' : `Show ${comment.replies.length} replies`}
                        >
                            {showReplies
                                ? <><ChevronUp size={12} aria-hidden="true" /> Hide replies</>
                                : <><ChevronDown size={12} aria-hidden="true" /> {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}</>
                            }
                        </button>
                    )}
                </div>

                {/* Reply form with slide animation */}
                {showReply && (
                    <div style={{
                        marginTop: 'var(--sp-4)',
                        animation: 'slideDown 0.2s ease-out',
                    }}>
                        <CommentForm
                            onSubmit={handleReplySubmit}
                            onCancel={() => setShowReply(false)}
                            placeholder="Write a reply..."
                            submitLabel="POST REPLY"
                            autoFocus
                            minHeight="80px"
                        />
                    </div>
                )}

                {/* Nested replies with staggered animation */}
                {hasReplies && showReplies && (
                    <ul
                        role="list"
                        aria-label="Replies"
                        style={{
                            listStyle: 'none',
                            padding: 0,
                            margin: 0,
                            animation: 'fadeInStagger 0.3s ease-out',
                        }}
                    >
                        {comment.replies.map((reply, index) => (
                            <div key={reply.id} style={{ animation: `slideInFade 0.2s ease-out ${index * 0.05}s both` }}>
                                <Comment
                                    comment={reply}
                                    depth={depth + 1}
                                    postId={postId}
                                    onToast={onToast}
                                />
                            </div>
                        ))}
                    </ul>
                )}
            </div>
        </li>
    );
});

/* ─── Comment Section with enhanced aesthetics ─── */
const CommentSection = ({ postId, onToast }) => {
    const { comments, addComment, getLoggedInUser } = useCommunityStore();
    const postComments = comments?.[postId] || [];
    const user = getLoggedInUser();
    const [isExpanded, setIsExpanded] = useState(true);
    const sectionRef = useRef(null);

    const handleAddComment = useCallback(async (content) => {
        try {
            await addComment(postId, content);
            onToast?.('💬 Comment posted!', 'success');

            // Scroll to comments after posting
            setTimeout(() => {
                sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        } catch {
            onToast?.('Failed to post comment. Please try again.', 'error');
        }
    }, [postId, addComment, onToast]);

    return (
        <div
            ref={sectionRef}
            aria-label="Comment section"
            className="comment-section-container"
        >
            {/* New comment form with glass effect */}
            <div className="glass-panel" style={{
                background: 'linear-gradient(135deg, rgba(17,17,17,0.95) 0%, rgba(26,26,26,0.95) 100%)',
                backdropFilter: 'blur(10px)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgba(51,153,51,0.2)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                marginBottom: 'var(--sp-10)',
            }}>
                <div style={{
                    padding: 'var(--sp-4) var(--sp-6)',
                    borderBottom: '1px solid rgba(51,153,51,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--sp-2)',
                }}>
                    <Sparkles size={16} style={{ color: 'var(--node-green)' }} />
                    <span style={{
                        fontSize: 'var(--text-xs)',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        background: 'linear-gradient(135deg, var(--node-green) 0%, #40c0ff 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}>
                        Share your expertise
                    </span>
                </div>
                <CommentForm
                    onSubmit={handleAddComment}
                    placeholder="What are your thoughts?"
                    submitLabel="POST COMMENT"
                    authorName={user?.name || 'User'}
                />
            </div>

            {/* Comment list header with toggle */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 'var(--sp-4)',
                    cursor: 'pointer',
                }}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--sp-2)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--text-muted)',
                }}>
                    <MessageSquare size={15} aria-hidden="true" />
                    <span>Discussion ({postComments.length})</span>
                    {postComments.length > 0 && (
                        <span style={{
                            marginLeft: 'var(--sp-2)',
                            background: 'linear-gradient(135deg, var(--node-green) 0%, #40c0ff 100%)',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: 10,
                        }}>
                            active
                        </span>
                    )}
                </div>
                <button className="post-action-btn">
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
            </div>

            {/* Comments with staggered animation */}
            {isExpanded && (
                <>
                    {postComments.length === 0 ? (
                        <div className="empty-state-comments" style={{
                            padding: 'var(--sp-12) var(--sp-6)',
                            textAlign: 'center',
                            background: 'linear-gradient(135deg, rgba(17,17,17,0.5) 0%, rgba(26,26,26,0.5) 100%)',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px dashed var(--border-subtle)',
                        }}>
                            <Heart size={32} style={{ color: 'var(--node-green)', opacity: 0.5, marginBottom: 'var(--sp-4)' }} />
                            <p style={{
                                fontSize: 'var(--text-sm)',
                                color: 'var(--text-muted)',
                                fontStyle: 'italic',
                                maxWidth: 300,
                                margin: '0 auto',
                            }}>
                                No comments yet. Start the conversation and share your insights!
                            </p>
                        </div>
                    ) : (
                        <ul
                            role="list"
                            aria-label="Comments"
                            style={{ listStyle: 'none', padding: 0, margin: 0 }}
                        >
                            {postComments.map((comment, index) => (
                                <div key={comment.id} style={{ animation: `slideInFade 0.2s ease-out ${index * 0.05}s both` }}>
                                    <Comment
                                        comment={comment}
                                        postId={postId}
                                        onToast={onToast}
                                    />
                                </div>
                            ))}
                        </ul>
                    )}
                </>
            )}
        </div>
    );
};

// Add animation keyframes to global style
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInFade {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @keyframes fadeInStagger {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
    
    .vote-floating-effect {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        border-radius: var(--radius-md);
        background: radial-gradient(circle at 30% 30%, rgba(51,153,51,0.1), transparent 70%);
        opacity: 0;
        transition: opacity 0.2s ease;
        pointer-events: none;
    }
    
    .vote-floating-effect.active {
        opacity: 1;
    }
    
    .btn-glow-effect {
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(51,153,51,0.2), transparent);
        transition: left 0.5s ease;
        pointer-events: none;
    }
    
    .post-action-btn:hover .btn-glow-effect {
        left: 100%;
    }
`;
document.head.appendChild(style);

export default memo(CommentSection);