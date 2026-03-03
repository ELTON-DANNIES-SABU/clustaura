import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    X, Hash, Type, AlignLeft, Send, Save, Globe, HelpCircle,
    Plus, Sparkles, Zap, ChevronRight, Code, Bold, Italic, List,
    Link as LinkIcon, AlertCircle, CheckCircle, Terminal, Cpu, Layout
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

        if (!validateForm()) return;
        if (submitting) return;

        setSubmitting(true);
        setErrors({});

        try {
            await addPost({
                title: formData.title.trim(),
                content: formData.content.trim(),
                communityId: formData.community,
                tags: parsedTags
            });

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
            if (!submitSuccess && window.confirm('You have unsaved changes. Do you want to save them as draft?')) {
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
                {/* Visual Accent */}
                <div className="modal-accent-line" />

                {/* Header */}
                <div className="modal-header">
                    <div className="modal-header-left">
                        <div className="modal-icon">
                            <Zap size={24} strokeWidth={2.5} />
                        </div>
                        <div className="modal-header-text">
                            <h2 className="modal-title">Create Challenge</h2>
                            <p className="modal-subtitle">Share your technical problem with the world</p>
                        </div>
                    </div>
                    <div className="modal-header-right">
                        {isDraftSaved && (
                            <div className="draft-indicator">
                                <Save size={14} />
                                <span>Draft saved</span>
                                <span className="draft-dot" />
                            </div>
                        )}
                        <button className="modal-close" onClick={handleClose} aria-label="Close">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Author Information */}
                <div className="author-info">
                    <div className="author-avatar">
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="author-details">
                        <span className="author-name">{user?.name || 'User'}</span>
                        <span className="author-badge">
                            <Globe size={12} />
                            Posting to r/{communities.find(c => c._id === formData.community)?.name || 'Community'}
                        </span>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <nav className="modal-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'write' ? 'active' : ''}`}
                        onClick={() => setActiveTab('write')}
                        type="button"
                    >
                        <AlignLeft size={16} />
                        Write
                        <span className="tab-indicator" />
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('preview')}
                        type="button"
                    >
                        <Layout size={16} />
                        Preview
                        <span className="tab-indicator" />
                    </button>
                </nav>

                {/* Modal Main Content */}
                <div className="modal-content">
                    {activeTab === 'write' ? (
                        <form onSubmit={handleSubmit} id="create-post-form">
                            {/* Community Selector */}
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
                                    className="form-select"
                                    required
                                >
                                    <option value="" disabled>Select a target community</option>
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

                            {/* Challenge Title */}
                            <div className={`form-group ${errors.title ? 'has-error' : ''}`}>
                                <div className="form-label-row">
                                    <label className="form-label">
                                        <Type size={16} />
                                        Challenge Title <span className="required">*</span>
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
                                    placeholder="e.g., Optimizing React performance for 10k items"
                                    className="form-input"
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

                            {/* Editor Area */}
                            <div className={`form-group ${errors.content ? 'has-error' : ''}`}>
                                <div className="form-label-row">
                                    <label className="form-label">
                                        <Terminal size={16} />
                                        Description <span className="required">*</span>
                                    </label>
                                    <span className="character-count">
                                        {formData.content.length}/{MAX_CONTENT}
                                    </span>
                                </div>

                                <div className="formatting-toolbar">
                                    {[
                                        { id: 'bold', icon: <Bold size={14} />, title: 'Bold' },
                                        { id: 'italic', icon: <Italic size={14} />, title: 'Italic' },
                                        { id: 'code', icon: <Code size={14} />, title: 'Code' },
                                        { id: 'link', icon: <LinkIcon size={14} />, title: 'Link' },
                                        { id: 'list', icon: <List size={14} />, title: 'List' },
                                    ].map(tool => (
                                        <button
                                            key={tool.id}
                                            type="button"
                                            className={`toolbar-btn ${selectedFormat === tool.id ? 'active' : ''}`}
                                            onClick={() => handleFormatClick(tool.id)}
                                            title={tool.title}
                                        >
                                            {tool.icon}
                                        </button>
                                    ))}
                                </div>

                                <textarea
                                    value={formData.content}
                                    onChange={(e) => {
                                        setFormData(prev => ({ ...prev, content: e.target.value }));
                                        setErrors(prev => ({ ...prev, content: null }));
                                    }}
                                    placeholder="Provide a detailed description of your challenge..."
                                    className="form-textarea"
                                    rows={10}
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

                            {/* Topics/Tags */}
                            <div className="form-group">
                                <label className="form-label">
                                    <Hash size={16} />
                                    Topics <span className="optional">(comma separated, max 5)</span>
                                </label>
                                <input
                                    type="text"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    placeholder="e.g., react, backend, architecture"
                                    className="form-input"
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

                            {/* Pro-Tips */}
                            <div className="tips-section">
                                <div className="tips-header">
                                    <Sparkles size={16} />
                                    <span>EXPERT POSTING TIPS</span>
                                </div>
                                <div className="tips-grid">
                                    {[
                                        'Be specific about your technical constraints',
                                        'Provide minimal reproducible examples',
                                        'Clearly state the expected behavior',
                                        'Use topics to target specific experts',
                                    ].map((tip, index) => (
                                        <div key={index} className="tip-item">
                                            <div className="tip-marker" />
                                            <span>{tip}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </form>
                    ) : (
                        <div className="preview-content">
                            <div className="preview-header">
                                {formData.title ? (
                                    <h3 className="preview-title">{formData.title}</h3>
                                ) : (
                                    <p className="preview-placeholder">Enter a title to see preview</p>
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
                            </div>

                            <div className="preview-divider" />

                            <div className="preview-body">
                                {formData.content ? (
                                    <div className="preview-content-text">
                                        {formData.content}
                                    </div>
                                ) : (
                                    <p className="preview-placeholder">Write some content to see preview</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="modal-footer">
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={handleClose}
                        disabled={submitting}
                    >
                        Discard
                    </button>
                    <button
                        type="submit"
                        form="create-post-form"
                        className={`btn-primary ${submitting ? 'is-loading' : ''} ${submitSuccess ? 'is-success' : ''}`}
                        disabled={submitting || !formData.title || !formData.content || !formData.community}
                    >
                        {submitting ? (
                            <>
                                <span className="spinner" />
                                Publishing...
                            </>
                        ) : submitSuccess ? (
                            <>
                                <CheckCircle size={18} />
                                Published!
                            </>
                        ) : (
                            <>
                                <Send size={18} />
                                Publish Challenge
                                <ChevronRight size={18} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreatePostModal;
