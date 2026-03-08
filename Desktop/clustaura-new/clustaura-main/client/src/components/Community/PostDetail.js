import React, { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import useCommunityStore from '../../store/communityStore';
import CommentSection from './CommentSection';
import VoteButtons from './shared/VoteButtons';
import UserAvatar from './shared/UserAvatar';
import TagList from './shared/TagList';

const PostDetail = ({ onToast }) => {
    const { postId } = useParams();
    const navigate = useNavigate();
    const { posts, vote, fetchComments } = useCommunityStore();

    React.useEffect(() => {
        fetchComments(postId);
    }, [postId, fetchComments]);

    const post = posts.find(p => p.id === postId);

    const handleVote = useCallback(async (direction) => {
        try {
            await vote(post.id, direction);
        } catch {
            onToast?.('Vote failed. Please try again.', 'error');
        }
    }, [post?.id, vote, onToast]);

    if (!post) {
        return (
            <div
                className="empty-state"
                role="status"
                aria-label="Post not found"
            >
                <div style={{ fontSize: 40, marginBottom: 'var(--sp-4)' }}>🔍</div>
                <p style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--sp-2)' }}>
                    Post not found
                </p>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 'var(--sp-6)' }}>
                    This post may have been removed or the link is incorrect.
                </p>
                <button
                    className="btn-primary"
                    onClick={() => navigate('/community')}
                >
                    Return to Community
                </button>
            </div>
        );
    }

    const relativeTime = new Date(post.timestamp).toLocaleDateString(undefined, {
        month: 'long', day: 'numeric', year: 'numeric'
    });

    return (
        <section
            className="community-container"
            style={{ maxWidth: '100%', padding: 'var(--sp-6)' }}
            aria-label="Post detail"
        >
            {/* Back button */}
            <button
                className="post-action-btn"
                style={{ marginBottom: 'var(--sp-8)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}
                onClick={() => navigate('/community')}
                aria-label="Back to feed"
            >
                <ArrowLeft size={15} aria-hidden="true" />
                Back to Feed
            </button>

            <div
                className="surface-panel"
                style={{ overflow: 'hidden', boxShadow: 'var(--shadow-modal)' }}
            >
                <div style={{ display: 'flex' }}>
                    {/* Vote sidebar */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            padding: 'var(--sp-8) var(--sp-4)',
                            borderRight: '1px solid var(--border-subtle)',
                            background: 'rgba(0,0,0,0.2)',
                            width: 64,
                            flexShrink: 0,
                        }}
                        aria-label="Post vote controls"
                    >
                        <VoteButtons
                            votes={post.votes}
                            userVote={post.userVote}
                            onVote={handleVote}
                            size="lg"
                            vertical={true}
                        />
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, padding: 'var(--sp-10)', minWidth: 0 }}>
                        {/* Meta */}
                        <div
                            className="post-meta-row"
                            style={{ marginBottom: 'var(--sp-6)' }}
                        >
                            <UserAvatar name={post.author} size="sm" />
                            <span
                                style={{ color: 'var(--node-green)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}
                            >
                                r/{post.communityId}
                            </span>
                            <span className="post-meta-dot" aria-hidden="true">•</span>
                            <span>
                                u/<span style={{ color: 'var(--text-secondary)' }}>{post.author}</span>
                            </span>
                            <span className="post-meta-dot" aria-hidden="true">•</span>
                            <time dateTime={post.timestamp}>{relativeTime}</time>
                        </div>

                        {/* Title */}
                        <h1
                            style={{
                                fontSize: 'var(--text-3xl)',
                                fontWeight: 700,
                                marginBottom: 'var(--sp-5)',
                                lineHeight: 'var(--lh-tight)',
                                color: 'var(--text-primary)',
                            }}
                        >
                            {post.title}
                        </h1>

                        {/* Tags */}
                        <div style={{ marginBottom: 'var(--sp-6)' }}>
                            <TagList tags={post.tags} />
                        </div>

                        {/* Content */}
                        <div
                            style={{
                                color: 'var(--text-secondary)',
                                fontSize: 15,
                                lineHeight: 'var(--lh-relaxed)',
                                marginBottom: 'var(--sp-10)',
                                paddingBottom: 'var(--sp-10)',
                                borderBottom: '1px solid var(--border-subtle)',
                                whiteSpace: 'pre-wrap',
                            }}
                        >
                            {post.content}
                        </div>

                        {/* Stats */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)', marginBottom: 'var(--sp-12)' }}>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--sp-2)',
                                    background: 'var(--surface-hover)',
                                    padding: 'var(--sp-2) var(--sp-4)',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border-subtle)',
                                    fontSize: 'var(--text-xs)',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.08em',
                                    color: 'var(--text-muted)',
                                }}
                            >
                                <MessageSquare size={15} aria-hidden="true" />
                                {post.commentCount} Solutions & Comments
                            </div>
                        </div>

                        {/* Comments */}
                        <CommentSection postId={post.id} onToast={onToast} />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default PostDetail;
