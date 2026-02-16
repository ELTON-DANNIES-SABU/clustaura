import React, { useState, useCallback, useEffect, useRef } from 'react';
import '../styles.css';

const PostModal = ({ isOpen, onClose, onSubmit }) => {
    const [activeTab, setActiveTab] = useState('text');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedCommunity, setSelectedCommunity] = useState('programming');
    const [selectedTags, setSelectedTags] = useState([]);
    const [linkUrl, setLinkUrl] = useState('');
    const [pollOptions, setPollOptions] = useState(['', '']);
    const [pollDuration, setPollDuration] = useState(1);
    const modalRef = useRef(null);
    const textareaRef = useRef(null);

    const communities = [
        { id: 'programming', name: 'Programming', icon: '💻', members: '2.5m' },
        { id: 'webdev', name: 'Web Development', icon: '🌐', members: '1.8m' },
        { id: 'reactjs', name: 'ReactJS', icon: '⚛️', members: '950k' },
        { id: 'javascript', name: 'JavaScript', icon: '📜', members: '3.2m' },
        { id: 'frontend', name: 'Frontend', icon: '🎨', members: '1.2m' },
        { id: 'backend', name: 'Backend', icon: '⚙️', members: '890k' }
    ];

    const availableTags = [
        'React', 'JavaScript', 'TypeScript', 'NextJS', 'NodeJS',
        'CSS', 'Tailwind', 'UI Design', 'API', 'Database',
        'Security', 'Performance', 'Tutorial', 'Beginner', 'Advanced'
    ];

    // Handle escape key to close modal
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        const handleClickOutside = (e) => {
            if (modalRef.current && !modalRef.current.contains(e.target) && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.addEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.removeEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [content]);

    const handleSubmit = useCallback(() => {
        if (!title.trim()) {
            alert('Please enter a title for your post');
            return;
        }

        if (activeTab === 'text' && !content.trim()) {
            alert('Please enter some content for your post');
            return;
        }

        if (activeTab === 'link' && !linkUrl.trim()) {
            alert('Please enter a valid URL');
            return;
        }

        if (activeTab === 'poll' && pollOptions.filter(opt => opt.trim()).length < 2) {
            alert('Please add at least 2 poll options');
            return;
        }

        const postData = {
            type: activeTab,
            title,
            content: activeTab === 'text' ? content : null,
            community: selectedCommunity,
            tags: selectedTags,
            linkUrl: activeTab === 'link' ? linkUrl : null,
            pollOptions: activeTab === 'poll' ? pollOptions.filter(opt => opt.trim()) : null,
            pollDuration: activeTab === 'poll' ? pollDuration : null
        };

        onSubmit(postData);
        resetForm();
        onClose();
    }, [title, content, selectedCommunity, selectedTags, linkUrl, pollOptions, pollDuration, activeTab, onSubmit, onClose]);

    const resetForm = useCallback(() => {
        setTitle('');
        setContent('');
        setSelectedTags([]);
        setLinkUrl('');
        setPollOptions(['', '']);
        setActiveTab('text');
    }, []);

    const handleTagSelect = useCallback((tag) => {
        setSelectedTags(prev => {
            if (prev.includes(tag)) {
                return prev.filter(t => t !== tag);
            } else if (prev.length < 5) {
                return [...prev, tag];
            }
            return prev;
        });
    }, []);

    const handleAddPollOption = useCallback(() => {
        if (pollOptions.length < 6) {
            setPollOptions(prev => [...prev, '']);
        }
    }, [pollOptions.length]);

    const handlePollOptionChange = useCallback((index, value) => {
        setPollOptions(prev => {
            const newOptions = [...prev];
            newOptions[index] = value;
            return newOptions;
        });
    }, []);

    const handleRemovePollOption = useCallback((index) => {
        if (pollOptions.length > 2) {
            setPollOptions(prev => prev.filter((_, i) => i !== index));
        }
    }, [pollOptions.length]);

    const handleTabChange = useCallback((tab) => {
        setActiveTab(tab);
    }, []);

    const handleTitleChange = useCallback((e) => {
        const value = e.target.value;
        if (value.length <= 300) {
            setTitle(value);
        }
    }, []);

    const handleContentChange = useCallback((e) => {
        setContent(e.target.value);
    }, []);

    const handleLinkUrlChange = useCallback((e) => {
        setLinkUrl(e.target.value);
    }, []);

    const handleCommunityChange = useCallback((e) => {
        setSelectedCommunity(e.target.value);
    }, []);

    const handlePollDurationChange = useCallback((e) => {
        setPollDuration(parseInt(e.target.value));
    }, []);

    // Memoized components
    const TabButton = React.memo(({ tab, label, icon, isActive, onClick }) => (
        <button
            className={`tab-btn ${isActive ? 'active' : ''}`}
            onClick={() => onClick(tab)}
        >
            <span className="tab-icon">{icon}</span>
            <span className="tab-label">{label}</span>
            {isActive && <div className="tab-indicator"></div>}
        </button>
    ));

    const TagPill = React.memo(({ tag, isSelected, onClick }) => (
        <button
            className={`tag-pill ${isSelected ? 'selected' : ''}`}
            onClick={() => onClick(tag)}
        >
            {tag}
            {isSelected && <span className="tag-check">✓</span>}
        </button>
    ));

    const PollOptionRow = React.memo(({ index, value, canRemove, onChange, onRemove }) => (
        <div className="poll-option-row">
            <input
                type="text"
                className="poll-option-input"
                placeholder={`Option ${index + 1}`}
                value={value}
                onChange={(e) => onChange(index, e.target.value)}
            />
            {canRemove && (
                <button
                    className="remove-option-btn"
                    onClick={() => onRemove(index)}
                    title="Remove option"
                >
                    ×
                </button>
            )}
        </div>
    ));

    if (!isOpen) return null;

    const isSubmitDisabled = !title.trim() || (activeTab === 'text' && !content.trim()) ||
        (activeTab === 'link' && !linkUrl.trim()) ||
        (activeTab === 'poll' && pollOptions.filter(opt => opt.trim()).length < 2);

    return (
        <div className="post-modal-overlay">
            <div className="post-modal-container" ref={modalRef}>
                {/* Header */}
                <div className="post-modal-header">
                    <div className="header-content">
                        <h2 className="header-title">
                            <span className="neon-text">Create Post</span>
                            <div className="header-underline"></div>
                        </h2>
                        <button className="modal-close-btn" onClick={onClose} aria-label="Close">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M18 6L6 18M6 6l12 12" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>

                    {/* Community Selector */}
                    <div className="community-selector">
                        <div className="selector-pill">
                            <span className="community-icon">
                                {communities.find(c => c.id === selectedCommunity)?.icon || '💻'}
                            </span>
                            <select
                                className="community-select"
                                value={selectedCommunity}
                                onChange={handleCommunityChange}
                            >
                                {communities.map(comm => (
                                    <option key={comm.id} value={comm.id}>
                                        r/{comm.name} • {comm.members} members
                                    </option>
                                ))}
                            </select>
                            <svg className="selector-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M6 9l6 6 6-6" stroke="#2EFFC7" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="post-tab-navigation">
                    {[
                        { tab: 'text', label: 'Text', icon: '📝' },
                        { tab: 'images', label: 'Images & Video', icon: '🖼️' },
                        { tab: 'link', label: 'Link', icon: '🔗' },
                        { tab: 'poll', label: 'Poll', icon: '📊' }
                    ].map(({ tab, label, icon }) => (
                        <TabButton
                            key={tab}
                            tab={tab}
                            label={label}
                            icon={icon}
                            isActive={activeTab === tab}
                            onClick={handleTabChange}
                        />
                    ))}
                </div>

                {/* Main Content */}
                <div className="post-modal-content">
                    {/* Title Input */}
                    <div className="form-section">
                        <input
                            type="text"
                            className="title-input"
                            placeholder="Post Title"
                            value={title}
                            onChange={handleTitleChange}
                            maxLength={300}
                            autoFocus
                        />
                        <div className="title-counter">{title.length}/300</div>
                    </div>

                    {/* Content Area based on active tab */}
                    {activeTab === 'text' && (
                        <div className="form-section">
                            <div className="rich-text-editor">
                                <div className="editor-toolbar">
                                    <button className="toolbar-btn" title="Bold">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                            <path d="M6 12h9a4 4 0 1 1 0 8H6V4h7a4 4 0 0 1 0 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                    </button>
                                    <button className="toolbar-btn" title="Italic">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                            <path d="M19 4h-9M15 20H5M14 4L10 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                    </button>
                                    <button className="toolbar-btn" title="Link">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                    </button>
                                    <button className="toolbar-btn" title="Code">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                            <polyline points="16 18 22 12 16 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                            <polyline points="8 6 2 12 8 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                    </button>
                                    <button className="toolbar-btn" title="List">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                            <line x1="8" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                            <line x1="8" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                            <line x1="8" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                            <circle cx="3" cy="6" r="2" stroke="currentColor" strokeWidth="2" />
                                            <circle cx="3" cy="12" r="2" stroke="currentColor" strokeWidth="2" />
                                            <circle cx="3" cy="18" r="2" stroke="currentColor" strokeWidth="2" />
                                        </svg>
                                    </button>
                                </div>
                                <textarea
                                    ref={textareaRef}
                                    className="editor-textarea"
                                    placeholder="Write your post content here... (Markdown supported)"
                                    value={content}
                                    onChange={handleContentChange}
                                    rows={6}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'link' && (
                        <div className="form-section">
                            <input
                                type="url"
                                className="link-input"
                                placeholder="https://example.com"
                                value={linkUrl}
                                onChange={handleLinkUrlChange}
                            />
                        </div>
                    )}

                    {activeTab === 'poll' && (
                        <div className="form-section">
                            <div className="poll-form">
                                <div className="poll-options">
                                    {pollOptions.map((option, index) => (
                                        <PollOptionRow
                                            key={index}
                                            index={index}
                                            value={option}
                                            canRemove={pollOptions.length > 2}
                                            onChange={handlePollOptionChange}
                                            onRemove={handleRemovePollOption}
                                        />
                                    ))}
                                </div>
                                <button
                                    className="add-option-btn"
                                    onClick={handleAddPollOption}
                                    disabled={pollOptions.length >= 6}
                                >
                                    + Add Option
                                </button>

                                <div className="poll-settings">
                                    <label className="poll-setting-label">
                                        <span>Poll Duration:</span>
                                        <select
                                            className="poll-duration-select"
                                            value={pollDuration}
                                            onChange={handlePollDurationChange}
                                        >
                                            <option value={1}>1 day</option>
                                            <option value={3}>3 days</option>
                                            <option value={7}>7 days</option>
                                            <option value={14}>14 days</option>
                                        </select>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'images' && (
                        <div className="form-section">
                            <div className="image-upload-area">
                                <div className="upload-prompt">
                                    <svg className="upload-icon" width="48" height="48" viewBox="0 0 24 24" fill="none">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="#2EFFC7" strokeWidth="2" strokeLinecap="round" />
                                        <polyline points="17 8 12 3 7 8" stroke="#2EFFC7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <line x1="12" y1="3" x2="12" y2="15" stroke="#2EFFC7" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                    <h3>Drag & drop images or videos</h3>
                                    <p>or click to browse files</p>
                                    <input type="file" className="file-input" multiple accept="image/*,video/*" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tags Section */}
                    <div className="form-section">
                        <label className="section-label">Tags (Optional)</label>
                        <div className="tags-container">
                            {availableTags.map(tag => (
                                <TagPill
                                    key={tag}
                                    tag={tag}
                                    isSelected={selectedTags.includes(tag)}
                                    onClick={handleTagSelect}
                                />
                            ))}
                        </div>
                        <div className="tags-counter">{selectedTags.length}/5 tags selected</div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="post-modal-footer">
                    <button className="cancel-btn" onClick={onClose}>
                        Cancel
                    </button>
                    <div className="footer-actions">
                        <button className="draft-btn">
                            Save Draft
                        </button>
                        <button
                            className="post-submit-btn"
                            onClick={handleSubmit}
                            disabled={isSubmitDisabled}
                        >
                            <span className="btn-glow"></span>
                            {activeTab === 'text' ? 'Create Post' :
                                activeTab === 'link' ? 'Share Link' :
                                    activeTab === 'poll' ? 'Create Poll' :
                                        'Upload Content'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(PostModal);