import React, { useState } from 'react';
import axios from 'axios';
import '../styles.css'; // Ensure we reuse the neomorphic/cyberpunk styles

const ProfessionalComposer = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [type, setType] = useState('Work'); // Work, Project, Experience
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [projectLink, setProjectLink] = useState('');
    const [tags, setTags] = useState('');
    const [loading, setLoading] = useState(false);

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
                projectLink,
                tags: tags.split(',').map(t => t.trim()).filter(t => t)
            };

            await axios.post('http://localhost:5000/api/professional', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Reset and close
            setTitle('');
            setContent('');
            setProjectLink('');
            setTags('');
            setIsOpen(false);
            setLoading(false);
        } catch (error) {
            console.error('Error posting:', error);
            alert(error.response?.data?.message || 'Failed to post');
            setLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <div className="post-composer-collapsed" onClick={() => setIsOpen(true)}>
                <div className="composer-placeholder">
                    <span>✍️ Share a work update, project, or experience...</span>
                </div>
                <button className="create-btn">Create Post</button>
            </div>
        );
    }

    return (
        <div className="post-composer-overlay">
            <div className="post-composer-modal">
                <div className="composer-header">
                    <h3>Create Professional Post</h3>
                    <button className="close-btn" onClick={() => setIsOpen(false)}>×</button>
                </div>

                <div className="composer-body">
                    <div className="type-selector">
                        {['Work', 'Project', 'Experience'].map(t => (
                            <button
                                key={t}
                                className={`type-btn ${type === t ? 'active' : ''}`}
                                onClick={() => setType(t)}
                            >
                                {t}
                            </button>
                        ))}
                    </div>

                    <input
                        type="text"
                        placeholder="Post Title *"
                        className="composer-input title-input"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />

                    <textarea
                        placeholder="What have you been working on?"
                        className="composer-textarea"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />

                    <input
                        type="text"
                        placeholder="Tags (comma separated)"
                        className="composer-input"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                    />

                    {type === 'Project' && (
                        <input
                            type="text"
                            placeholder="Project Link (GitHub/Demo)"
                            className="composer-input"
                            value={projectLink}
                            onChange={(e) => setProjectLink(e.target.value)}
                        />
                    )}

                </div>

                <div className="composer-footer">
                    <button className="submit-btn" onClick={handleSubmit} disabled={loading || !title || !content}>
                        {loading ? 'Posting...' : 'Post Update'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfessionalComposer;
