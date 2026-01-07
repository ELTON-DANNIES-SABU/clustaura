import React, { useState } from 'react';
import axios from 'axios';
import '../styles.css';

const ChallengeComposer = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [difficulty, setDifficulty] = useState('Intermediate');
    const [tags, setTags] = useState('');
    const [contactEnabled, setContactEnabled] = useState(true);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const userStr = localStorage.getItem('user');
            const { token } = JSON.parse(userStr);

            const payload = {
                title,
                description,
                difficulty,
                tags: tags.split(',').map(t => t.trim()).filter(t => t),
                contactEnabled
            };

            await axios.post('http://localhost:5000/api/challenges', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Reset and close
            setTitle('');
            setDescription('');
            setTags('');
            setDifficulty('Intermediate');
            setContactEnabled(true);
            setIsOpen(false);
            setLoading(false);
        } catch (error) {
            console.error('Error creating challenge:', error);
            alert(error.response?.data?.message || 'Failed to create challenge');
            setLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <div className="post-composer-collapsed challenge-composer-btn" onClick={() => setIsOpen(true)}>
                <div className="composer-placeholder">
                    <span>🔥 Post a new Challenge...</span>
                </div>
                <button className="create-btn">Create Challenge</button>
            </div>
        );
    }

    return (
        <div className="post-composer-overlay">
            <div className="post-composer-modal">
                <div className="composer-header challenge-header">
                    <h3>Create New Challenge</h3>
                    <button className="close-btn" onClick={() => setIsOpen(false)}>×</button>
                </div>

                <div className="composer-body">
                    <input
                        type="text"
                        placeholder="Challenge Title *"
                        className="composer-input title-input"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />

                    <div className="difficulty-selector">
                        <label>Difficulty:</label>
                        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                            <option>Beginner</option>
                            <option>Intermediate</option>
                            <option>Advanced</option>
                            <option>Expert</option>
                        </select>
                    </div>

                    <textarea
                        placeholder="Describe the challenge in detail..."
                        className="composer-textarea"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />

                    <input
                        type="text"
                        placeholder="Tech Stack Tags (e.g., React, Node, AWS)"
                        className="composer-input"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                    />
                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                        <input
                            type="checkbox"
                            id="contactEnabled"
                            checked={contactEnabled}
                            onChange={(e) => setContactEnabled(e.target.checked)}
                            style={{ width: 'auto' }}
                        />
                        <label htmlFor="contactEnabled" style={{ color: '#aaa', cursor: 'pointer' }}>
                            Enable Team Formation (Allow solvers to contact you)
                        </label>
                    </div>
                </div>

                <div className="composer-footer">
                    <button className="submit-btn" onClick={handleSubmit} disabled={loading || !title || !description}>
                        {loading ? 'Posting...' : 'Post Challenge'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChallengeComposer;
