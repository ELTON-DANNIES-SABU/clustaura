import React, { useState } from 'react';
import api from '../../services/api';
import '../../styles.css';

const CreateCommunityModal = ({ isOpen, onClose, onSuccess }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        setLoading(true);
        try {
            const res = await api.post('/community', {
                name,
                description,
                rules: ['Be respectful', 'No spam']
            });
            onSuccess(res.data);
            setName('');
            setDescription('');
            onClose();
        } catch (error) {
            console.error('Failed to create community', error);
            alert(error.response?.data?.message || 'Failed to create community');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="composer-overlay">
            <div className="composer-modal glass-panel neon-border" style={{ maxWidth: '500px' }}>
                <div className="composer-header">
                    <h2>Create Community</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit} className="composer-body">
                    <div className="form-group">
                        <label>Community Name</label>
                        <input
                            type="text"
                            placeholder="e.g. programming, webdev"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="title-input"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            placeholder="Tell us what this community is about..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="body-input"
                            rows={4}
                        />
                    </div>

                    <div className="composer-footer" style={{ justifyContent: 'flex-end' }}>
                        <button
                            type="button"
                            className="tab-btn"
                            onClick={onClose}
                            style={{ marginRight: '10px' }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="post-btn"
                            disabled={loading || !name.trim()}
                        >
                            {loading ? 'Creating...' : 'Create Community'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateCommunityModal;
