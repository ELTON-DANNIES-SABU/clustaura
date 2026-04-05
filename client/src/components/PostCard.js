import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    ThumbsUp,
    MessageSquare,
    Repeat2,
    Send,
    MoreHorizontal,
    Share2,
    ExternalLink,
    Clock,
    User as UserIcon
} from 'lucide-react';
import api from '../services/api';
import './PostCard.css';

const PostCard = ({ post, onUpdate, onDelete }) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const currentUserId = user.id || user._id;

    const [isLiked, setIsLiked] = useState(post.likes?.includes(currentUserId));
    const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
    const [showOptions, setShowOptions] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        title: post.title || '',
        content: post.content || ''
    });
    const [saving, setSaving] = useState(false);

    const handleLike = async () => {
        const previouslyLiked = isLiked;
        setIsLiked(!previouslyLiked);
        setLikesCount(prev => previouslyLiked ? prev - 1 : prev + 1);

        try {
            await api.post(`/posts/${post._id}/like`);
        } catch (error) {
            setIsLiked(previouslyLiked);
            setLikesCount(previouslyLiked ? likesCount : likesCount - 1);
            console.error('Error liking post:', error);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;

        // If it was today, show relative hours
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;

        // Otherwise show date and time
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        }) + ' at ' + date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const author = post.author || {};
    const authorName = author.firstName ? `${author.firstName} ${author.lastName}` : 'Unknown User';
    const authorRole = author.role || 'Member';
    const isMe = String(author._id) === String(currentUserId);

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this post?')) return;
        try {
            await api.delete(`/posts/${post._id}`);
            if (onDelete) onDelete(post._id);
        } catch (error) {
            console.error('Error deleting post:', error);
            alert('Failed to delete post');
        }
    };

    const handleUpdate = async () => {
        if (!editData.content.trim()) return alert('Content cannot be empty');
        setSaving(true);
        try {
            const res = await api.put(`/posts/${post._id}`, editData);
            setIsEditing(false);
            if (onUpdate) onUpdate(res.data);
        } catch (error) {
            console.error('Error updating post:', error);
            alert('Failed to update post');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={`post-card ${isMe ? 'my-post' : ''}`}>
            {post.isCreatorPost && <div className="creator-badge">Creator Project</div>}

            <div className="post-header-top">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {post.community && (
                        <span className="community-tag">r/{post.community.name}</span>
                    )}
                    <span className="post-type-badge">{post.type || 'Update'}</span>
                </div>
                {isMe && (
                    <div className="post-options-container">
                        <button className="post-options" onClick={() => setShowOptions(!showOptions)}>
                            <MoreHorizontal size={18} />
                        </button>
                        {showOptions && (
                            <div className="options-dropdown">
                                <button onClick={() => { setIsEditing(true); setShowOptions(false); }}>Edit Post</button>
                                <button className="delete" onClick={() => { handleDelete(); setShowOptions(false); }}>Delete Post</button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="post-header">
                <Link to={`/profile/${author._id || ''}`} className="post-avatar-link">
                    <div className="post-avatar">
                        {author.avatar ? (
                            <img src={author.avatar} alt="" className="avatar-img" />
                        ) : (
                            <UserIcon size={20} />
                        )}
                    </div>
                </Link>
                <div className="post-meta">
                    <div className="post-author-name">
                        <Link to={`/profile/${author._id || ''}`} className="author-link">
                            {authorName}
                        </Link>
                        {isMe && <span className="you-tag">(You)</span>}
                    </div>
                    <div className="post-author-role">{authorRole}</div>
                    <div className="post-time">
                        <Clock size={10} style={{ marginRight: '4px', display: 'inline' }} />
                        {formatDate(post.createdAt)}
                    </div>
                </div>
            </div>

            {isEditing ? (
                <div className="edit-post-form">
                    <input 
                        className="edit-post-title"
                        value={editData.title}
                        onChange={e => setEditData({...editData, title: e.target.value})}
                        placeholder="Post Title (optional)"
                    />
                    <textarea 
                        className="edit-post-content"
                        value={editData.content}
                        onChange={e => setEditData({...editData, content: e.target.value})}
                        placeholder="What's on your mind?"
                    />
                    <div className="edit-post-actions">
                        <button className="save-btn" onClick={handleUpdate} disabled={saving}>
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button className="cancel-btn" onClick={() => setIsEditing(false)}>Cancel</button>
                    </div>
                </div>
            ) : (
                <>
                    {post.title && <h3 className="post-title">{post.title}</h3>}

                    <div className="post-content">
                        <p>{post.content}</p>

                        {post.media && post.media.length > 0 && (
                            <div className="post-image-container">
                                <img src={post.media[0]} alt="Post content" className="post-image" />
                            </div>
                        )}

                        {post.projectLink && (
                            <a href={post.projectLink} target="_blank" rel="noopener noreferrer" className="project-link-card">
                                <div className="link-icon">
                                    <ExternalLink size={18} />
                                </div>
                                <div className="link-info">
                                    <span className="link-title">View Project</span>
                                    <span className="link-url">{post.projectLink}</span>
                                </div>
                            </a>
                        )}
                    </div>
                </>
            )}

            {/* <div className="post-stats">
                <span>{likesCount} {likesCount === 1 ? 'like' : 'likes'}</span>
                <span>•</span>
                <span>{post.comments?.length || 0} {post.comments?.length === 1 ? 'comment' : 'comments'}</span>
            </div>

            <div className="post-actions">
                <button
                    className={`action-btn ${isLiked ? 'liked' : ''}`}
                    onClick={handleLike}
                >
                    <ThumbsUp size={16} fill={isLiked ? "currentColor" : "none"} /> 
                    <span>Like</span>
                </button>
                <button className="action-btn">
                    <MessageSquare size={16} /> 
                    <span>Comment</span>
                </button>
                <button className="action-btn">
                    <Repeat2 size={16} /> 
                    <span>Repost</span>
                </button>
                <button className="action-btn">
                    <Send size={16} /> 
                    <span>Send</span>
                </button>
            </div> */}
        </div>
    );
};

export default PostCard;
