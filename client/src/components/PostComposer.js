import React, { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import PostCard from './PostCard';
import '../styles.css';

const PostComposer = () => {
    const [content, setContent] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [selectedTags, setSelectedTags] = useState([]);
    const [projectLink, setProjectLink] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [postType, setPostType] = useState('Update'); // Update, Project, Question, Experience
    const [showPreview, setShowPreview] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fileInputRef = useRef(null);
    const textareaRef = useRef(null);

    // Mock user for avatar display
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const placeholders = [
        "Share your latest project milestone...",
        "What did you learn today?",
        "Ask the community for feedback...",
        "Showcase your new deployment..."
    ];
    const [placeholderIndex, setPlaceholderIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setPlaceholderIndex(prev => (prev + 1) % placeholders.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // Auto-grow textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [content]);

    const handlePost = async () => {
        if (!content.trim() && !selectedImage) return;
        setIsSubmitting(true);

        try {
            const postData = {
                content,
                tags: selectedTags,
                projectLink,
                isCreatorPost: postType === 'Project',
                // Using selectedImage as media for now (assuming base64 or url)
                media: selectedImage ? [selectedImage] : []
            };

            await api.post('/posts', postData);

            // Reset form
            setContent('');
            setSelectedTags([]);
            setProjectLink('');
            setSelectedImage(null);
            setPostType('Update');
            setIsFocused(false);
            setShowPreview(false);

            // Optional: Show success toast here
        } catch (error) {
            console.error('Error creating post:', error);
            const msg = error.response?.data?.message || error.message || 'Failed to create post';
            // Show alert and redirect if unauthorized
            if (error.response?.status === 401) {
                alert('Session expired. Please log in again.');
                window.location.href = '/login';
            } else {
                alert(`Error: ${msg}`);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setSelectedImage(reader.result);
            reader.readAsDataURL(file);
        }
    };

    // Preview Object Construction
    const previewPost = {
        _id: 'preview',
        author: {
            _id: user.id || 'me',
            name: `${user.firstName || 'User'} ${user.lastName || ''}`,
            role: user.roll || 'Developer',
            avatar: user.avatar,
            isMe: true
        },
        content: content || 'Start typing to see your post here...',
        media: selectedImage ? [selectedImage] : [],
        projectLink,
        tags: selectedTags,
        createdAt: new Date().toISOString(),
        isCreatorPost: postType === 'Project',
        likes: [],
        comments: []
    };

    return (
        <div className={`post-composer-container ${isFocused ? 'focused' : ''}`}>
            {!isFocused && (
                <div className="composer-collapsed" onClick={() => setIsFocused(true)}>
                    <div className="composer-avatar">
                        {user.firstName?.charAt(0) || 'U'}
                    </div>
                    <div className="composer-fake-input">
                        Share something valuable with the community...
                    </div>
                </div>
            )}

            {isFocused && (
                <div className="composer-expanded-card glass-panel">
                    <div className="composer-header-label">
                        <span>Create Post</span>
                        <button className="close-btn" onClick={() => setIsFocused(false)}>×</button>
                    </div>

                    <div className="post-type-selector">
                        {['Update', 'Project', 'Question', 'Experience'].map(type => (
                            <button
                                key={type}
                                className={`type-chip ${postType === type ? 'active' : ''}`}
                                onClick={() => setPostType(type)}
                            >
                                {type === 'Project' && '🚀 '}
                                {type === 'Question' && '❓ '}
                                {type === 'Experience' && '💡 '}
                                {type === 'Update' && '📢 '}
                                {type}
                            </button>
                        ))}
                    </div>

                    <div className="composer-input-area">
                        <textarea
                            ref={textareaRef}
                            className="composer-textarea"
                            placeholder={placeholders[placeholderIndex]}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            autoFocus
                            rows={3}
                        />
                    </div>

                    {/* Contextual Inputs */}
                    <div className="contextual-inputs">
                        {postType === 'Project' && (
                            <input
                                type="text"
                                className="context-input"
                                placeholder="http://github.com/your/project"
                                value={projectLink}
                                onChange={(e) => setProjectLink(e.target.value)}
                            />
                        )}
                    </div>

                    {selectedImage && (
                        <div className="preview-image-container">
                            <img src={selectedImage} alt="Preview" />
                            <button className="remove-media" onClick={() => setSelectedImage(null)}>×</button>
                        </div>
                    )}

                    <div className="composer-toolbar">
                        <div className="tools-left">
                            <button className="tool-btn" onClick={() => fileInputRef.current.click()} title="Add Media">
                                🖼️ Media
                            </button>
                            <button className="tool-btn" onClick={() => setPostType('Project')} title="Add Project Link">
                                📎 Project
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                accept="image/*"
                                onChange={handleImageSelect}
                            />
                        </div>
                        <div className="tools-right">
                            <button
                                className={`preview-toggle ${showPreview ? 'active' : ''}`}
                                onClick={() => setShowPreview(!showPreview)}
                            >
                                👁️ Preview
                            </button>
                        </div>
                    </div>

                    {showPreview && (
                        <div className="live-preview-section">
                            <div className="preview-label">Live Preview</div>
                            <PostCard post={previewPost} />
                        </div>
                    )}

                    <div className="composer-footer">
                        <span className="char-count">{content.length}/500</span>
                        <div className="action-buttons">
                            <button className="cancel-btn" onClick={() => setIsFocused(false)}>Cancel</button>
                            <button
                                className="post-submit-btn"
                                disabled={!content.trim() && !selectedImage || isSubmitting}
                                onClick={handlePost}
                            >
                                {isSubmitting ? 'Posting...' : 'Post'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PostComposer;
