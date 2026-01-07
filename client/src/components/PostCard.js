import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import '../styles.css';

const PostCard = ({ post }) => {
    // Current user ID should come from context/storage to check if liked
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const currentUserId = user.id || user._id; // Adjust based on how auth stores it

    const [isLiked, setIsLiked] = useState(post.likes?.includes(currentUserId));
    const [likesCount, setLikesCount] = useState(post.likes?.length || 0);

    const handleLike = async () => {
        // Optimistic update
        const previouslyLiked = isLiked;
        setIsLiked(!previouslyLiked);
        setLikesCount(prev => previouslyLiked ? prev - 1 : prev + 1);

        try {
            await api.post(`/posts/${post._id}/like`);
        } catch (error) {
            // Revert on error
            setIsLiked(previouslyLiked);
            setLikesCount(prev => previouslyLiked ? prev : prev - 1); // Logic error in revert?
            // If it WAS liked, we unliked it (count-1). Error -> Revert to liked (count+1)
            // If it WAS NOT liked, we liked it (count+1). Error -> Revert to unliked (count-1)
            setLikesCount(post.likes?.length || 0); // Safer to just reset
            console.error('Error liking post:', error);
        }
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

    const author = post.author || {};
    // Handle populated author object or fallback
    const authorName = author.firstName ? `${author.firstName} ${author.lastName}` : 'Unknown User';
    const authorRole = author.role || 'Member';
    const isMe = author._id === currentUserId;

    return (
        <div className={`post-card ${isMe ? 'my-post' : ''}`}>
            {post.isCreatorPost && <div className="creator-badge">Creator Project</div>}

            <div className="post-header-top">
                {post.community && (
                    <span className="community-tag">r/{post.community.name}</span>
                )}
                <span className={`post-type-badge ${post.type?.toLowerCase()}`}>{post.type || 'Update'}</span>
            </div>

            <div className="post-header">
                <Link to={`/profile/${author._id}`} className="post-avatar-link">
                    <div className="post-avatar">
                        {author.avatar || authorName.charAt(0)}
                    </div>
                </Link>
                <div className="post-meta">
                    <div className="post-author-name">
                        <Link to={`/profile/${author._id}`} className="author-link">
                            {authorName}
                        </Link>
                        {isMe && <span className="you-tag">(You)</span>}
                    </div>
                    <div className="post-author-role">{authorRole}</div>
                    <div className="post-time">{formatDate(post.createdAt)}</div>
                </div>
                <button className="post-options">•••</button>
            </div>

            {post.title && <h3 className="post-title">{post.title}</h3>}

            <div className="post-content">
                <p>{post.content}</p>

                {post.media && post.media.length > 0 && (
                    <div className="post-image-container">
                        {/* Just showing first image for now */}
                        <img src={post.media[0]} alt="Post content" className="post-image" />
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
                <span>{post.comments?.length || 0} comments</span>
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
