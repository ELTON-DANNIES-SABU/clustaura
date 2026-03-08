import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    X, Hash, Type, AlignLeft, Send, Save, Globe, HelpCircle,
    Plus, Sparkles, Zap, ChevronRight, Code, Bold, Italic, List,
    Link as LinkIcon, AlertCircle, CheckCircle
} from 'lucide-react';
import useCommunityStore from '../../store/communityStore';
import './Community.css';

const MAX_TITLE = 300;
const MAX_CONTENT = 10000;

const CreatePostModal = ({ isOpen, onClose, onToast, activeCommunityId }) => {
    const navigate = useNavigate();
    const { communities, getLoggedInUser, addPost, fetchPosts } = useCommunityStore();
    const user = getLoggedInUser();
    const modalRef = useRef(null);
    const titleInputRef = useRef(null);

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        community: activeCommunityId || '',
        tags: []
    });

    const [tagInput, setTagInput] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [isDraftSaved, setIsDraftSaved] = useState(false);
    const [errors, setErrors] = useState({});
    const [activeTab, setActiveTab] = useState('write');
    const [selectedFormat, setSelectedFormat] = useState(null);
    const [isFocused, setIsFocused] = useState({
        title: false,
        content: false,
        tags: false,
        community: false
    });
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const parsedTags = tagInput
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0 && t.length <= 30);

    // Close modal on escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                handleClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen]);

    // Focus title input when modal opens
    useEffect(() => {
        if (isOpen && titleInputRef.current) {
            setTimeout(() => titleInputRef.current.focus(), 100);
        }
    }, [isOpen]);

    // Set default community when communities load
    useEffect(() => {
        if (isOpen && !formData.community && communities.length > 0) {
            setFormData(prev => ({
                ...prev,
                community: activeCommunityId || communities[0]._id
            }));
        }
    }, [isOpen, communities, activeCommunityId]);

    // Auto-save draft
    useEffect(() => {
        if (!isOpen) return;

        const timer = setTimeout(() => {
            if (formData.title || formData.content || parsedTags.length > 0) {
                localStorage.setItem('challengeDraft', JSON.stringify({
                    ...formData,
                    tags: parsedTags
                }));
                setIsDraftSaved(true);
                setTimeout(() => setIsDraftSaved(false), 2000);
            }
        }, 2000);

        return () => clearTimeout(timer);
    }, [formData, parsedTags, isOpen]);

    // Load draft
    useEffect(() => {
        if (!isOpen) return;

        const draft = localStorage.getItem('challengeDraft');
        if (draft) {
            const shouldRestore = window.confirm('📝 Found a saved draft. Would you like to restore it?');
            if (shouldRestore) {
                try {
                    const parsedDraft = JSON.parse(draft);
                    setFormData({
                        title: parsedDraft.title || '',
                        content: parsedDraft.content || '',
                        community: parsedDraft.community || activeCommunityId || '',
                        tags: parsedDraft.tags || []
                    });
                    setTagInput((parsedDraft.tags || []).join(', '));
                    onToast?.('Draft restored successfully', 'success');
                } catch (error) {
                    console.error('Error restoring draft:', error);
                    localStorage.removeItem('challengeDraft');
                }
            } else {
                localStorage.removeItem('challengeDraft');
            }
        }
    }, [isOpen, onToast, activeCommunityId]);

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            setSubmitSuccess(false);
            setErrors({});
        }
    }, [isOpen]);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Title is required';
        } else if (formData.title.length > MAX_TITLE) {
            newErrors.title = `Title must be less than ${MAX_TITLE} characters`;
        }

        if (!formData.content.trim()) {
            newErrors.content = 'Content is required';
        } else if (formData.content.length > MAX_CONTENT) {
            newErrors.content = `Content must be less than ${MAX_CONTENT} characters`;
        }

        if (!formData.community) {
            newErrors.community = 'Please select a community';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        console.log('Submit button clicked');
        console.log('Form data:', formData);
        console.log('Parsed tags:', parsedTags);

        if (!validateForm()) {
            console.log('Validation failed:', errors);
            return;
        }

        if (submitting) {
            console.log('Already submitting');
            return;
        }

        setSubmitting(true);
        setErrors({});

        try {
            console.log('Calling addPost with:', {
                title: formData.title.trim(),
                content: formData.content.trim(),
                communityId: formData.community,
                tags: parsedTags
            });

            const result = await addPost({
                title: formData.title.trim(),
                content: formData.content.trim(),
                communityId: formData.community,
                tags: parsedTags
            });

            console.log('Post created successfully:', result);

            setSubmitSuccess(true);
            onToast?.('✨ Challenge published successfully!', 'success');

            // Clear draft from localStorage
            localStorage.removeItem('challengeDraft');

            // Refresh posts in the feed
            await fetchPosts(formData.community);

            // Reset form
            setFormData({
                title: '',
                content: '',
                community: activeCommunityId || '',
                tags: []
            });
            setTagInput('');

            // Close modal after a brief delay to show success state
            setTimeout(() => {
                onClose();
                setSubmitSuccess(false);
            }, 1500);

        } catch (error) {
            console.error('Error creating challenge:', error);
            onToast?.('Failed to publish challenge. Please try again.', 'error');
            setErrors({
                submit: error.response?.data?.message || 'Failed to create challenge. Please try again.'
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        if (formData.title || formData.content || parsedTags.length > 0) {
            if (window.confirm('You have unsaved changes. Do you want to save them as draft?')) {
                localStorage.setItem('challengeDraft', JSON.stringify({
                    ...formData,
                    tags: parsedTags
                }));
                onToast?.('Draft saved', 'success');
            }
        }
        onClose();
    };

    const handleFormatClick = (format) => {
        setSelectedFormat(format);
        const textarea = document.querySelector('textarea');
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const text = formData.content;
            let newText = text;

            switch (format) {
                case 'bold':
                    newText = text.substring(0, start) + '**' + text.substring(start, end) + '**' + text.substring(end);
                    break;
                case 'italic':
                    newText = text.substring(0, start) + '*' + text.substring(start, end) + '*' + text.substring(end);
                    break;
                case 'code':
                    newText = text.substring(0, start) + '`' + text.substring(start, end) + '`' + text.substring(end);
                    break;
                case 'link':
                    newText = text.substring(0, start) + '[link](' + text.substring(start, end) + ')' + text.substring(end);
                    break;
                case 'list':
                    newText = text.substring(0, start) + '\n- ' + text.substring(start, end).replace(/\n/g, '\n- ') + text.substring(end);
                    break;
                default:
                    break;
            }

            setFormData(prev => ({ ...prev, content: newText }));
        }
        setTimeout(() => setSelectedFormat(null), 200);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
        }}>
            <div className="modal-container" ref={modalRef}>
                {/* Header */}
                <div className="modal-header">
                    <div className="modal-header-left">
                        <div className="modal-icon">
                            <Zap size={24} />
                        </div>
                        <div>
                            <h2 className="modal-title">Create New Challenge</h2>
                            <p className="modal-subtitle">Share your technical problem with the community</p>
                        </div>
                    </div>
                    <div className="modal-header-right">
                        {isDraftSaved && (
                            <span className="draft-indicator">
                                <Save size={14} />
                                Draft saved
                                <span className="draft-dot" />
                            </span>
                        )}
                        {submitSuccess && (
                            <span className="draft-indicator" style={{ background: 'rgba(51,153,51,0.2)', color: '#339933' }}>
                                <CheckCircle size={14} />
                                Published!
                            </span>
                        )}
                        <button className="modal-close" onClick={handleClose} aria-label="Close">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Author Info */}
                <div className="author-info">
                    <div className="author-avatar">
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="author-details">
                        <span className="author-name">{user?.name || 'User'}</span>
                        <span className="author-badge">
                            <Globe size={12} />
                            Posting publicly
                        </span>
                    </div>
                </div>

                {/* Tabs */}
                <div className="modal-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'write' ? 'active' : ''}`}
                        onClick={() => setActiveTab('write')}
                        type="button"
                    >
                        <span className="tab-indicator" />
                        Write
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('preview')}
                        type="button"
                    >
                        <span className="tab-indicator" />
                        Preview
                    </button>
                </div>

                {/* Content */}
                <div className="modal-content">
                    {activeTab === 'write' ? (
                        <form onSubmit={handleSubmit} id="create-post-form">
                            {/* Community Selection */}
                            <div className={`form-group ${errors.community ? 'has-error' : ''}`}>
                                <label className="form-label">
                                    <Globe size={16} />
                                    Community <span className="required">*</span>
                                </label>
                                <select
                                    value={formData.community}
                                    onChange={(e) => {
                                        setFormData(prev => ({ ...prev, community: e.target.value }));
                                        setErrors(prev => ({ ...prev, community: null }));
                                    }}
                                    onFocus={() => setIsFocused(prev => ({ ...prev, community: true }))}
                                    onBlur={() => setIsFocused(prev => ({ ...prev, community: false }))}
                                    className={`form-select ${isFocused.community ? 'focused' : ''}`}
                                    required
                                >
                                    <option value="" disabled>Select a community</option>
                                    {communities.map(comm => (
                                        <option key={comm._id} value={comm._id}>
                                            r/{comm.name || comm.slug}
                                        </option>
                                    ))}
                                </select>
                                {errors.community && (
                                    <div className="error-message">
                                        <AlertCircle size={12} />
                                        {errors.community}
                                    </div>
                                )}
                            </div>

                            {/* Title */}
                            <div className={`form-group ${errors.title ? 'has-error' : ''}`}>
                                <div className="form-label-row">
                                    <label className="form-label">
                                        <Type size={16} />
                                        Title <span className="required">*</span>
                                    </label>
                                    <span className="character-count">
                                        {formData.title.length}/{MAX_TITLE}
                                    </span>
                                </div>
                                <input
                                    ref={titleInputRef}
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => {
                                        setFormData(prev => ({ ...prev, title: e.target.value }));
                                        setErrors(prev => ({ ...prev, title: null }));
                                    }}
                                    onFocus={() => setIsFocused(prev => ({ ...prev, title: true }))}
                                    onBlur={() => setIsFocused(prev => ({ ...prev, title: false }))}
                                    placeholder="e.g., How to implement real-time notifications with WebSocket?"
                                    className={`form-input ${isFocused.title ? 'focused' : ''}`}
                                    maxLength={MAX_TITLE}
                                    required
                                />
                                {errors.title && (
                                    <div className="error-message">
                                        <AlertCircle size={12} />
                                        {errors.title}
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className={`form-group ${errors.content ? 'has-error' : ''}`}>
                                <div className="form-label-row">
                                    <label className="form-label">
                                        <AlignLeft size={16} />
                                        Content <span className="required">*</span>
                                    </label>
                                    <span className="character-count">
                                        {formData.content.length}/{MAX_CONTENT}
                                    </span>
                                </div>

                                {/* Formatting Toolbar */}
                                <div className="formatting-toolbar">
                                    <button
                                        type="button"
                                        className={`toolbar-btn ${selectedFormat === 'bold' ? 'active' : ''}`}
                                        onClick={() => handleFormatClick('bold')}
                                        title="Bold"
                                    >
                                        <Bold size={14} />
                                    </button>
                                    <button
                                        type="button"
                                        className={`toolbar-btn ${selectedFormat === 'italic' ? 'active' : ''}`}
                                        onClick={() => handleFormatClick('italic')}
                                        title="Italic"
                                    >
                                        <Italic size={14} />
                                    </button>
                                    <div className="toolbar-divider" />
                                    <button
                                        type="button"
                                        className={`toolbar-btn ${selectedFormat === 'code' ? 'active' : ''}`}
                                        onClick={() => handleFormatClick('code')}
                                        title="Code"
                                    >
                                        <Code size={14} />
                                    </button>
                                    <button
                                        type="button"
                                        className={`toolbar-btn ${selectedFormat === 'link' ? 'active' : ''}`}
                                        onClick={() => handleFormatClick('link')}
                                        title="Link"
                                    >
                                        <LinkIcon size={14} />
                                    </button>
                                    <button
                                        type="button"
                                        className={`toolbar-btn ${selectedFormat === 'list' ? 'active' : ''}`}
                                        onClick={() => handleFormatClick('list')}
                                        title="List"
                                    >
                                        <List size={14} />
                                    </button>
                                </div>

                                <textarea
                                    value={formData.content}
                                    onChange={(e) => {
                                        setFormData(prev => ({ ...prev, content: e.target.value }));
                                        setErrors(prev => ({ ...prev, content: null }));
                                    }}
                                    onFocus={() => setIsFocused(prev => ({ ...prev, content: true }))}
                                    onBlur={() => setIsFocused(prev => ({ ...prev, content: false }))}
                                    placeholder="Describe your challenge in detail. What have you tried? What specific help do you need?"
                                    className={`form-textarea ${isFocused.content ? 'focused' : ''}`}
                                    rows={8}
                                    maxLength={MAX_CONTENT}
                                    required
                                />
                                {errors.content && (
                                    <div className="error-message">
                                        <AlertCircle size={12} />
                                        {errors.content}
                                    </div>
                                )}
                            </div>

                            {/* Tags */}
                            <div className="form-group">
                                <label className="form-label">
                                    <Hash size={16} />
                                    Topics <span className="optional">(optional, max 5)</span>
                                </label>
                                <input
                                    type="text"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onFocus={() => setIsFocused(prev => ({ ...prev, tags: true }))}
                                    onBlur={() => setIsFocused(prev => ({ ...prev, tags: false }))}
                                    placeholder="e.g., react, javascript, api (comma separated)"
                                    className={`form-input ${isFocused.tags ? 'focused' : ''}`}
                                />

                                {parsedTags.length > 0 && (
                                    <div className="tags-preview">
                                        {parsedTags.map(tag => (
                                            <span key={tag} className="tag-pill">
                                                <Hash size={10} />
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Tips Section */}
                            <div className="tips-section">
                                <div className="tips-header">
                                    <HelpCircle size={16} color="#ffaa33" />
                                    <span>Tips for a great challenge</span>
                                </div>
                                <div className="tips-grid">
                                    {[
                                        'Be specific about your technical problem',
                                        'Include code examples if relevant',
                                        'Describe what you\'ve already tried',
                                        'Add relevant topics to reach experts',
                                    ].map((tip, index) => (
                                        <div key={index} className="tip-item">
                                            <Zap size={12} color="#ffaa33" />
                                            <span>{tip}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {errors.submit && (
                                <div className="error-message" style={{ marginTop: '16px', padding: '12px', background: 'rgba(255,77,77,0.1)', borderRadius: '8px' }}>
                                    <AlertCircle size={16} />
                                    {errors.submit}
                                </div>
                            )}
                        </form>
                    ) : (
                        /* Preview Tab */
                        <div className="preview-content">
                            {formData.title ? (
                                <h3 className="preview-title">{formData.title}</h3>
                            ) : (
                                <p className="preview-placeholder">No title yet</p>
                            )}

                            {parsedTags.length > 0 && (
                                <div className="preview-tags">
                                    {parsedTags.map(tag => (
                                        <span key={tag} className="preview-tag">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <hr className="preview-divider" />

                            {formData.content ? (
                                <div className="preview-content-text" style={{ whiteSpace: 'pre-wrap' }}>
                                    {formData.content}
                                </div>
                            ) : (
                                <p className="preview-placeholder">No content yet</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="modal-footer">
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={handleClose}
                        disabled={submitting}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="create-post-form"
                        className="btn-primary"
                        disabled={submitting || !formData.title || !formData.content || !formData.community}
                        style={{
                            opacity: (submitting || !formData.title || !formData.content || !formData.community) ? 0.6 : 1,
                            cursor: (submitting || !formData.title || !formData.content || !formData.community) ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {submitting ? (
                            <>
                                <span className="spinner" />
                                Publishing...
                            </>
                        ) : submitSuccess ? (
                            <>
                                <CheckCircle size={16} />
                                Published!
                            </>
                        ) : (
                            <>
                                <Send size={16} />
                                Publish Challenge
                                <ChevronRight size={16} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreatePostModal;