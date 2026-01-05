
import React, { useState } from 'react';
import '../styles.css';

const PostModal = ({ isOpen, onClose, onSubmit }) => {
    const [postContent, setPostContent] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);
    const [postType, setPostType] = useState('problem');
    const [title, setTitle] = useState('');

    const availableTags = [
        'Programming', 'Design', 'Bug', 'Feature Request', 
        'UI/UX', 'Backend', 'Frontend', 'Database', 
        'Security', 'Performance', 'Documentation', 'Other'
    ];

    const handleTagSelect = (tag) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter(t => t !== tag));
        } else {
            setSelectedTags([...selectedTags, tag]);
        }
    };

    const handleSubmit = () => {
        if (!title.trim()) {
            alert('Please enter a title for your post');
            return;
        }

        if (!postContent.trim()) {
            alert('Please enter some content for your post');
            return;
        }

        const postData = {
            title,
            content: postContent,
            tags: selectedTags,
            type: postType,
            author: JSON.parse(localStorage.getItem('user') || '{}').firstName || 'Anonymous',
            timestamp: new Date().toISOString()
        };

        onSubmit(postData);
        
        // Reset form
        setTitle('');
        setPostContent('');
        setSelectedTags([]);
        setPostType('problem');
        
        // Close modal
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="post-modal">
                <div className="modal-header">
                    <h2>Create New Post</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="modal-body">
                    <div className="post-type-selector">
                        <button 
                            className={`post-type-btn ${postType === 'problem' ? 'active' : ''}`}
                            onClick={() => setPostType('problem')}
                        >
                            🚀 Problem Challenge
                        </button>
                        <button 
                            className={`post-type-btn ${postType === 'solution' ? 'active' : ''}`}
                            onClick={() => setPostType('solution')}
                        >
                            💡 Solution Proposal
                        </button>
                        <button 
                            className={`post-type-btn ${postType === 'question' ? 'active' : ''}`}
                            onClick={() => setPostType('question')}
                        >
                            ❓ General Question
                        </button>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Title *</label>
                        <input
                            type="text"
                            className="modal-input"
                            placeholder="Enter a descriptive title for your post..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            {postType === 'problem' ? 'Problem Description *' : 
                             postType === 'solution' ? 'Solution Details *' : 
                             'Question Details *'}
                        </label>
                        <textarea
                            className="modal-textarea"
                            placeholder={
                                postType === 'problem' ? 
                                "Describe your challenge in detail. What problem are you trying to solve? What have you tried so far? What specific help do you need?" :
                                postType === 'solution' ?
                                "Share your solution approach. Include code snippets, diagrams, or step-by-step explanations as needed." :
                                "Ask your question clearly. Provide context and any relevant details that will help others understand and answer effectively."
                            }
                            value={postContent}
                            onChange={(e) => setPostContent(e.target.value)}
                            rows={6}
                        />
                        <div className="textarea-counter">
                            {postContent.length}/2000 characters
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Tags</label>
                        <div className="tags-container">
                            {availableTags.map(tag => (
                                <button
                                    key={tag}
                                    className={`tag-btn ${selectedTags.includes(tag) ? 'selected' : ''}`}
                                    onClick={() => handleTagSelect(tag)}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Visibility</label>
                        <div className="visibility-options">
                            <label className="visibility-option">
                                <input 
                                    type="radio" 
                                    name="visibility" 
                                    value="public" 
                                    defaultChecked 
                                />
                                <span className="option-label">
                                    🌍 Public (Visible to everyone)
                                </span>
                            </label>
                            <label className="visibility-option">
                                <input type="radio" name="visibility" value="community" />
                                <span className="option-label">
                                    👥 Community Only (Visible to members)
                                </span>
                            </label>
                            <label className="visibility-option">
                                <input type="radio" name="visibility" value="private" />
                                <span className="option-label">
                                    🔒 Private (Visible to you only)
                                </span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button 
                        className="cancel-btn"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button 
                        className="submit-btn"
                        onClick={handleSubmit}
                        disabled={!title.trim() || !postContent.trim()}
                    >
                        Publish Post
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PostModal;
