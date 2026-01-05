import React, { useState, useRef } from 'react';
import '../styles.css';

const PostComposer = ({ onPostCreate }) => {
    const [content, setContent] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [selectedTags, setSelectedTags] = useState([]);
    const [selectedImage, setSelectedImage] = useState(null);
    const fileInputRef = useRef(null);

    // Mock user for avatar display
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const handlePost = (e) => {
        e.preventDefault();
        if (!content.trim() && !selectedImage) return;

        const newPost = {
            id: Date.now().toString(),
            author: {
                name: user.firstName ? `${user.firstName} ${user.lastName}` : 'Guest User',
                role: user.roll || 'Developer',
                avatar: user.firstName?.charAt(0) || 'U',
                isMe: true
            },
            content: content,
            tags: selectedTags,
            image: selectedImage,
            likes: 0,
            comments: 0,
            shares: 0,
            createdAt: new Date().toISOString(),
            isProject: false // Default to standard post for now
        };

        onPostCreate(newPost);
        setContent('');
        setSelectedTags([]);
        setSelectedImage(null);
        setIsFocused(false);
    };

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result);
                setIsFocused(true); // Ensure composer stays open
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerImageUpload = () => {
        fileInputRef.current.click();
    };

    const removeImage = () => {
        setSelectedImage(null);
        // Reset file input value so same file can be selected again if needed
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className={`post-composer ${isFocused ? 'focused' : ''}`}>
            <div className="composer-header">
                <div className="composer-avatar">
                    {user.firstName?.charAt(0) || 'U'}
                </div>
                <button className="composer-trigger" onClick={() => setIsFocused(true)}>
                    Start a post...
                </button>
            </div>

            {isFocused && (
                <div className="composer-expanded">
                    <textarea
                        className="composer-input"
                        placeholder="Share your work, experience, progress, or thoughts with the community..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        autoFocus
                        rows={4}
                    />

                    {selectedImage && (
                        <div className="composer-image-preview">
                            <img src={selectedImage} alt="Preview" />
                            <button className="remove-image-btn" onClick={removeImage}>×</button>
                        </div>
                    )}

                    <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleImageSelect}
                    />

                    <div className="composer-actions">
                        <div className="composer-tools">
                            <button className="tool-btn" onClick={triggerImageUpload}>📷 Media</button>
                            <button className="tool-btn">🔗 Link</button>
                            <button className="tool-btn"># Tags</button>
                        </div>
                        <div className="composer-submit">
                            <button className="cancel-btn" onClick={() => setIsFocused(false)}>Cancel</button>
                            <button
                                className="post-btn"
                                disabled={!content.trim() && !selectedImage}
                                onClick={handlePost}
                            >
                                Post
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PostComposer;
