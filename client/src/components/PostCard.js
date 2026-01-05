import React, { useState } from 'react';
import '../styles.css';

const PostCard = ({ post }) => {
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(post.likes || 0);

    const handleLike = () => {
        if (isLiked) {
            setLikesCount(prev => prev - 1);
        } else {
            setLikesCount(prev => prev + 1);
        }
        setIsLiked(!isLiked);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className={`post-card ${post.author.isMe ? 'my-post' : ''}`}>
            {post.author.isMe && <div className="creator-badge">Creator Project</div>}

            <div className="post-header">
                <div className="post-avatar">
                    {post.author.avatar || post.author.name.charAt(0)}
                </div>
                <div className="post-meta">
                    <div className="post-author-name">
                        {post.author.name}
                        {post.author.isMe && <span className="you-tag">(You)</span>}
                    </div>
                    <div className="post-author-role">{post.author.role}</div>
                    <div className="post-time">{formatDate(post.createdAt)}</div>
                </div>
                <button className="post-options">•••</button>
            </div>

            <div className="post-content">
                <p>{post.content}</p>

                {post.image && (
                    <div className="post-image-container">
                        <img src={post.image} alt="Post content" className="post-image" />
                    </div>
                )}

                {post.media && post.media.length > 0 && !post.image && (
                    <div className="post-media">
                        {/* Legacy media placeholder if needed */}
                        <div className="media-placeholder">Media Content</div>
                    </div>
                )}

                {post.projectLink && (
                    <a href={post.projectLink} target="_blank" rel="noopener noreferrer" className="project-link-card">
                        <div className="link-icon">🔗</div>
                        <div className="link-info">
                            <span className="link-title">View Project</span>
                            <span className="link-url">{post.projectLink}</span>
                        </div>
                    </a>
                )}
            </div>

            <div className="post-stats">
                <span>{likesCount} likes</span>
                <span>{post.comments || 0} comments • {post.shares || 0} reposts</span>
            </div>

            <div className="post-actions">
                <button
                    className={`action-btn ${isLiked ? 'liked' : ''}`}
                    onClick={handleLike}
                >
                    <span className="icon">👍</span> Like
                </button>
                <button className="action-btn">
                    <span className="icon">💬</span> Comment
                </button>
                <button className="action-btn">
                    <span className="icon">🔁</span> Repost
                </button>
                <button className="action-btn">
                    <span className="icon">🚀</span> Send
                </button>
            </div>
        </div>
    );
};

export default PostCard;
