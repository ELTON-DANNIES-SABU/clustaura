import React, { useState } from 'react';
import axios from 'axios';
import '../styles.css';

const ProfessionalComposer = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('text'); // text, media, link, poll
    const [type, setType] = useState('Work'); // Work, Project, Experience
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState([]);
    const [newTag, setNewTag] = useState('');
    const [loading, setLoading] = useState(false);

    // Common tags
    const commonTags = ['Update', 'Launch', 'Hiring', 'Looking for Work', 'Question', 'Showcase'];

    const handleTagClick = (tag) => {
        if (tags.includes(tag)) {
            setTags(tags.filter(t => t !== tag));
        } else {
            setTags([...tags, tag]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const userStr = localStorage.getItem('user');
            const { token } = JSON.parse(userStr);

            const payload = {
                title,
                content,
                type,
                tags
            };

            await axios.post('http://localhost:5000/api/professional', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Reset and close
            setTitle('');
            setContent('');
            setTags([]);
            setIsOpen(false);
            setLoading(false);
        } catch (error) {
            console.error('Error posting:', error);
            // alert(error.response?.data?.message || 'Failed to post');
            setLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <div className="create-post-container post-composer-collapsed" onClick={() => setIsOpen(true)}>
                <div className="user-avatar-placeholder">
                    <span>ME</span>
                </div>
                <div className="composer-placeholder-input">
                    Create Post
                </div>
                <button className="quick-media-btn" title="Upload Image">
                    📸
                </button>
                <button className="quick-media-btn" title="Attach Link">
                    🔗
                </button>
            </div>
        );
    }

    return (
        <div className="create-post-container composer-expanded">
            {/* Header */}
            <div className="composer-header">
                <h3 className="composer-title">
                    Create Post <span className="header-accent"></span>
                </h3>
                <button
                    className="quick-media-btn"
                    onClick={() => setIsOpen(false)}
                    style={{ fontSize: '1.2rem' }}
                >
                    ×
                </button>
            </div>

            {/* Community Selector */}
            <div style={{ padding: '20px 20px 0 20px' }}>
                <button className="context-selector">
                    <span className="context-icon">P</span>
                    <span>Professional / {type}</span>
                    <span style={{ fontSize: '10px', marginLeft: '5px' }}>▼</span>
                </button>

                {/* Type Selection (Simplified for UI demo) */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    {['Work', 'Project', 'Experience'].map(t => (
                        <button
                            key={t}
                            onClick={() => setType(t)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: type === t ? '#00FFA3' : '#666',
                                fontSize: '0.8rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                padding: '0 5px'
                            }}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tabs */}
            <div className="composer-tabs">
                <button
                    className={`composer-tab ${activeTab === 'text' ? 'active' : ''}`}
                    onClick={() => setActiveTab('text')}
                >
                    📝 Post
                </button>
                <button
                    className={`composer-tab ${activeTab === 'media' ? 'active' : ''}`}
                    onClick={() => setActiveTab('media')}
                >
                    🖼️ Image & Video
                </button>
                <button
                    className={`composer-tab ${activeTab === 'link' ? 'active' : ''}`}
                    onClick={() => setActiveTab('link')}
                >
                    🔗 Link
                </button>
                <button
                    className={`composer-tab ${activeTab === 'poll' ? 'active' : ''}`}
                    onClick={() => setActiveTab('poll')}
                >
                    📊 Poll
                </button>
            </div>

            {/* Body */}
            <div className="composer-body">
                <div className="title-input-wrapper">
                    <input
                        type="text"
                        placeholder="Title"
                        className="composer-input-title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        autoFocus
                    />
                    <div style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: title.length > 0 ? '#00FFA3' : '#333',
                        fontSize: '0.8rem'
                    }}>
                        {title.length}/300
                    </div>
                </div>

                <textarea
                    placeholder={
                        activeTab === 'text' ? "What's on your mind?" :
                            activeTab === 'media' ? "Drag and drop images or paste content..." :
                                activeTab === 'link' ? "Paste a valid URL..." :
                                    "Ask a question..."
                    }
                    className="composer-textarea"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />

                <div className="tags-section">
                    <span style={{ color: '#666', fontSize: '0.8rem', display: 'flex', alignItems: 'center' }}>TAGS:</span>
                    {commonTags.map(tag => (
                        <button
                            key={tag}
                            className={`tag-pill-btn ${tags.includes(tag) ? 'active' : ''}`}
                            onClick={() => handleTagClick(tag)}
                        >
                            {tags.includes(tag) ? '✓ ' : '+ '} {tag}
                        </button>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className="composer-footer">
                <button
                    className="btn-secondary-ghost"
                    onClick={() => setIsOpen(false)}
                >
                    Save Draft
                </button>
                <button
                    className="btn-neon-primary"
                    onClick={handleSubmit}
                    disabled={loading || !title || !content}
                >
                    {loading ? 'POSTING...' : 'POST'}
                </button>
            </div>
        </div>
    );
};

export default ProfessionalComposer;
