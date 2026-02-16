import React, { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import { io } from 'socket.io-client';
import '../styles.css';

const PostComposer = () => {
    const [isActive, setIsActive] = useState(false);
    const [loading, setLoading] = useState(false);
    const [communities, setCommunities] = useState([]);

    // Form State
    const [title, setTitle] = useState('');
    const [communityId, setCommunityId] = useState('');
    const [type, setType] = useState('General Question');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState([]);
    const [tagInput, setTagInput] = useState('');
    const [media, setMedia] = useState([]); // Array of { file, preview, url }
    const [projectLink, setProjectLink] = useState('');

    const fileInputRef = useRef(null);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Fetch Communities on mount
    useEffect(() => {
        const fetchCommunities = async () => {
            try {
                const res = await api.get('/community');
                setCommunities(res.data);
            } catch (err) {
                console.error('Failed to load communities', err);
            }
        };
        fetchCommunities();
    }, []);

    // Handle File Select
    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // Upload immediately or just preview? 
        // Plan: Preview first, upload on submit. BUT we need URL for backend.
        // Better UX: Upload immediately to get URL, show spinner.

        const newMedia = [];

        for (const file of files) {
            const formData = new FormData();
            formData.append('file', file);

            try {
                const res = await api.post('/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                newMedia.push({
                    type: file.type.startsWith('image') ? 'image' : 'video',
                    url: `http://localhost:5000${res.data.filePath}`, // Assuming local dev
                    preview: URL.createObjectURL(file)
                });
            } catch (error) {
                console.error('Upload failed', error);
                alert('Failed to upload image. Please try again.');
            }
        }

        setMedia(prev => [...prev, ...newMedia]);
    };

    const handlePost = async () => {
        if (!title.trim() || !content.trim()) return;
        setLoading(true);

        try {
            const payload = {
                title,
                community: communityId || null, // Optional if general
                type,
                content,
                tags,
                projectLink,
                media: media.map(m => m.url)
            };

            const res = await api.post('/posts', payload);

            // Socket emit handled by backend usually, but if client-side optimistic:
            // const socket = io('http://localhost:5000');
            // socket.emit('new-post-client', res.data);

            // Reset
            setTitle('');
            setContent('');
            setTags([]);
            setMedia([]);
            setIsActive(false);
            alert('Post created successfully!');
        } catch (error) {
            console.error('Post creation failed', error);
            alert(error.response?.data?.message || 'Failed to create post');
        } finally {
            setLoading(false);
        }
    };

    const handleTagKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const val = tagInput.trim();
            if (val && !tags.includes(val)) {
                setTags([...tags, val]);
                setTagInput('');
            }
        }
    };

    const removeTag = (tagToRemove) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    if (!isActive) {
        return (
            <div className="composer-collapsed glass-panel" onClick={() => setIsActive(true)}>
                <div className="avatar-circle">
                    {user.firstName ? user.firstName[0] : 'U'}
                </div>
                <input
                    type="text"
                    placeholder="Create a new post..."
                    readOnly
                    className="collapsed-input"
                />
                <div className="collapsed-actions">
                    <button className="icon-btn">🖼️</button>
                    <button className="icon-btn">🔗</button>
                </div>
            </div>
        );
    }

    return (
        <div className="composer-overlay">
            <div className="composer-modal glass-panel neon-border">
                <div className="composer-header">
                    <h2>Create New Post</h2>
                    <button className="close-btn" onClick={() => setIsActive(false)}>×</button>
                </div>

                <div className="composer-body">
                    {/* Community Selector */}
                    <div className="form-group">
                        <select
                            value={communityId}
                            onChange={(e) => setCommunityId(e.target.value)}
                            className="neon-select"
                        >
                            <option value="">Select a Community (General)</option>
                            {communities.map(c => (
                                <option key={c._id} value={c._id}>r/{c.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Type Switcher */}
                    <div className="type-tabs">
                        {['Problem Challenge', 'Solution Proposal', 'General Question'].map(t => (
                            <button
                                key={t}
                                className={`tab-btn ${type === t ? 'active' : ''}`}
                                onClick={() => setType(t)}
                            >
                                {t}
                            </button>
                        ))}
                    </div>

                    {/* Title */}
                    <input
                        type="text"
                        className="title-input"
                        placeholder="Enter a descriptive title..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        maxLength={120}
                        autoFocus
                    />

                    {/* Body */}
                    <textarea
                        className="body-input"
                        placeholder="What's on your mind? (Markdown supported)"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={6}
                    />

                    {/* Media Preview */}
                    {media.length > 0 && (
                        <div className="media-preview-grid">
                            {media.map((m, idx) => (
                                <div key={idx} className="media-item">
                                    {m.type === 'image' ? (
                                        <img src={m.preview} alt="upload" />
                                    ) : (
                                        <video src={m.preview} controls />
                                    )}
                                    <button
                                        className="remove-media-btn"
                                        onClick={() => setMedia(media.filter((_, i) => i !== idx))}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Tags */}
                    <div className="tags-input-container">
                        {tags.map(tag => (
                            <span key={tag} className="tag-chip">
                                {tag} <button onClick={() => removeTag(tag)}>×</button>
                            </span>
                        ))}
                        <input
                            type="text"
                            placeholder="Add tags (enter to add)"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={handleTagKeyDown}
                        />
                    </div>

                    {/* Footer Actions */}
                    <div className="composer-footer">
                        <div className="tools">
                            <button onClick={() => fileInputRef.current.click()}>
                                📷 Media
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                hidden
                                multiple
                                accept="image/*,video/*"
                                onChange={handleFileSelect}
                            />
                        </div>
                        <div className="submit-area">
                            <span className="char-count">{content.length}/2000</span>
                            <button
                                className="post-btn"
                                disabled={!title || !content || loading}
                                onClick={handlePost}
                            >
                                {loading ? 'Posting...' : 'POST'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PostComposer;
