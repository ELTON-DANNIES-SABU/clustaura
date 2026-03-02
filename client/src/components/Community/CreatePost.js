import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    X, Hash, Type, AlignLeft, Send, Save, User, Globe,
    HelpCircle, Plus, Sparkles, Zap, Award, ChevronRight,
    Code, Image, Link, Bold, Italic, List, Eye, Edit
} from 'lucide-react';
import useCommunityStore from '../../store/communityStore';
import TagList from './shared/TagList';
import axios from 'axios';

const MAX_TITLE = 300;
const MAX_CONTENT = 10000;

const CreatePost = ({ onToast, activeCommunityId }) => {
    const navigate = useNavigate();
    const { communities, getLoggedInUser, addPost } = useCommunityStore();
    const user = getLoggedInUser();
    const formRef = useRef(null);
    const titleInputRef = useRef(null);

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        community: activeCommunityId || communities[0]?._id || '',
        tags: []
    });

    const [tagInput, setTagInput] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('write');
    const [isDraftSaved, setIsDraftSaved] = useState(false);
    const [showGuidelines, setShowGuidelines] = useState(false);
    const [charCount, setCharCount] = useState({ title: 0, content: 0 });
    const [selectedFormat, setSelectedFormat] = useState(null);
    const [isFocused, setIsFocused] = useState({ title: false, content: false, tags: false });

    const parsedTags = tagInput
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0 && t.length <= 30);

    const isValid = formData.title.trim() && formData.content.trim() && formData.community &&
        formData.title.length <= MAX_TITLE && formData.content.length <= MAX_CONTENT;

    // Auto-save draft with visual feedback
    useEffect(() => {
        const timer = setTimeout(() => {
            if (formData.title || formData.content || parsedTags.length > 0) {
                localStorage.setItem('postDraft', JSON.stringify({
                    ...formData,
                    tags: parsedTags
                }));
                setIsDraftSaved(true);
                setTimeout(() => setIsDraftSaved(false), 2000);
            }
        }, 2000);

        return () => clearTimeout(timer);
    }, [formData, parsedTags]);

    // Load draft with animation
    useEffect(() => {
        const draft = localStorage.getItem('postDraft');
        if (draft) {
            const parsedDraft = JSON.parse(draft);
            const shouldRestore = window.confirm('✨ Found a saved draft. Would you like to restore it?');
            if (shouldRestore) {
                setFormData(parsedDraft);
                setTagInput(parsedDraft.tags.join(', '));
                onToast?.('Draft restored successfully!', 'success');
            } else {
                localStorage.removeItem('postDraft');
            }
        }

        // Focus title input on mount
        setTimeout(() => {
            titleInputRef.current?.focus();
        }, 100);
    }, [onToast]);

    // Ensure a community is selected once communities are loaded
    useEffect(() => {
        if (!formData.community && communities.length > 0) {
            setFormData(prev => ({ ...prev, community: activeCommunityId || communities[0]._id }));
        }
    }, [communities, activeCommunityId, formData.community]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!isValid || submitting) return;

        setSubmitting(true);
        try {
            // Using the community store's addPost which correctly targets /api/community/posts
            await addPost({
                title: formData.title.trim(),
                content: formData.content.trim(), // Backend expects 'content'
                communityId: formData.community, // Backend expects 'communityId'
                tags: parsedTags
            });

            onToast?.('🚀 Challenge published successfully!', 'success');
            localStorage.removeItem('postDraft');

            // Redirect back to the community where it was posted
            navigate(`/community${formData.community ? `?community=${formData.community}` : ''}`);
        } catch (error) {
            console.error('Error creating challenge:', error);
            onToast?.('Failed to publish challenge. Please try again.', 'error');
        } finally {
            setSubmitting(false);
        }
    }, [isValid, submitting, formData, parsedTags, onToast, navigate, addPost]);

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

    const Counter = ({ current, max, label }) => {
        const percentage = (current / max) * 100;
        const getColor = () => {
            if (percentage > 100) return '#ff4d4d';
            if (percentage > 85) return '#ffaa33';
            return '#339933';
        };

        return (
            <div className="counter-container" style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 12px',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: 'var(--radius-full)',
                border: `1px solid ${getColor()}20`,
            }}>
                <span style={{ fontSize: 12, color: '#a0a0a0' }}>{label}</span>
                <div style={{
                    width: 60,
                    height: 4,
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: 'var(--radius-full)',
                    overflow: 'hidden',
                }}>
                    <div style={{
                        width: `${Math.min(percentage, 100)}%`,
                        height: '100%',
                        background: getColor(),
                        borderRadius: 'var(--radius-full)',
                        transition: 'width 0.3s ease',
                        boxShadow: `0 0 10px ${getColor()}`,
                    }} />
                </div>
                <span style={{
                    fontSize: 12,
                    color: getColor(),
                    fontVariantNumeric: 'tabular-nums',
                    fontWeight: 600,
                    minWidth: 60,
                    textAlign: 'right',
                }}>
                    {current}/{max}
                </span>
            </div>
        );
    };

    return (
        <div className="create-post-container" style={{
            maxWidth: 900,
            margin: '0 auto',
            padding: 'var(--sp-6)',
            position: 'relative',
        }}>
            {/* Animated background */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'radial-gradient(circle at 20% 30%, rgba(51,153,51,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(64,192,255,0.1) 0%, transparent 50%)',
                pointerEvents: 'none',
                zIndex: 0,
            }} />

            {/* Header with cyber effect */}
            <div className="glass-card" style={{
                padding: 'var(--sp-6) var(--sp-8)',
                marginBottom: 'var(--sp-8)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'relative',
                zIndex: 1,
                border: '1px solid rgba(51,153,51,0.3)',
                transform: 'translateY(0)',
                transition: 'all 0.3s ease',
            }}>
                <div>
                    <h1 style={{
                        fontSize: 'clamp(24px, 5vw, 36px)',
                        fontWeight: 800,
                        background: 'linear-gradient(135deg, #fff 0%, #339933 50%, #40c0ff 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: 'var(--sp-2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--sp-2)',
                        letterSpacing: '-0.5px',
                    }}>
                        <Zap size={32} style={{ color: '#339933' }} />
                        Create a Challenge
                    </h1>
                    <p style={{
                        fontSize: 'var(--text-sm)',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                    }}>
                        <Sparkles size={14} />
                        Share your technical problem with the community
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)' }}>
                    {isDraftSaved && (
                        <span style={{
                            fontSize: 'var(--text-xs)',
                            color: '#339933',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '6px 12px',
                            background: 'rgba(51,153,51,0.1)',
                            borderRadius: 'var(--radius-full)',
                            border: '1px solid rgba(51,153,51,0.3)',
                            animation: 'fadeInScale 0.3s ease',
                        }}>
                            <Save size={14} />
                            Draft saved
                            <span style={{
                                width: 8,
                                height: 8,
                                background: '#339933',
                                borderRadius: '50%',
                                animation: 'pulse 2s infinite',
                            }} />
                        </span>
                    )}
                    <button
                        onClick={() => navigate('/community')}
                        className="post-action-btn"
                        aria-label="Close"
                        style={{
                            padding: 'var(--sp-2)',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(51,153,51,0.3)',
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Author info with holographic effect */}
            <div className="glass-card" style={{
                padding: 'var(--sp-4)',
                marginBottom: 'var(--sp-8)',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                position: 'relative',
                zIndex: 1,
                border: '1px solid rgba(51,153,51,0.2)',
            }}>
                <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 'var(--radius-lg)',
                    background: 'linear-gradient(135deg, #339933, #40c0ff, #6f4fff)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: 20,
                    fontWeight: 700,
                    position: 'relative',
                    overflow: 'hidden',
                }}>
                    <div style={{
                        position: 'absolute',
                        top: -10,
                        left: -10,
                        right: -10,
                        bottom: -10,
                        background: 'radial-gradient(circle at center, rgba(255,255,255,0.3) 0%, transparent 70%)',
                        animation: 'rotate 10s linear infinite',
                    }} />
                    <span style={{ position: 'relative', zIndex: 1 }}>
                        {user?.name?.charAt(0) || 'U'}
                    </span>
                </div>
                <div>
                    <div style={{
                        fontWeight: 700,
                        fontSize: 'var(--text-base)',
                        background: 'linear-gradient(135deg, #fff, #a0a0a0)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: 2,
                    }}>
                        {user?.name || 'User'}
                    </div>
                    <div style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                    }}>
                        <Globe size={12} />
                        Posting publicly
                        <span style={{
                            width: 4,
                            height: 4,
                            background: '#339933',
                            borderRadius: '50%',
                        }} />
                        <span style={{ color: '#339933', cursor: 'pointer' }}>Edit</span>
                    </div>
                </div>
            </div>

            {/* Cyber tabs */}
            <div style={{
                display: 'flex',
                gap: 4,
                marginBottom: 24,
                position: 'relative',
                zIndex: 1,
                background: 'rgba(0,0,0,0.3)',
                padding: 4,
                borderRadius: 'var(--radius-full)',
                border: '1px solid rgba(51,153,51,0.2)',
                width: 'fit-content',
            }}>
                {[
                    { id: 'write', label: 'Write', icon: Edit },
                    { id: 'preview', label: 'Preview', icon: Eye },
                ].map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                padding: '10px 24px',
                                background: isActive ? 'linear-gradient(135deg, #339933, #40c0ff)' : 'transparent',
                                border: 'none',
                                borderRadius: 'var(--radius-full)',
                                color: isActive ? 'white' : 'var(--text-muted)',
                                fontWeight: isActive ? 700 : 500,
                                fontSize: 14,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                transition: 'all 0.3s ease',
                                position: 'relative',
                                overflow: 'hidden',
                            }}
                        >
                            <Icon size={16} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {activeTab === 'write' ? (
                <form ref={formRef} onSubmit={handleSubmit} style={{ position: 'relative', zIndex: 1 }}>
                    {/* Community selection with cyber effect */}
                    <div className="glass-card" style={{
                        padding: 'var(--sp-6)',
                        marginBottom: 'var(--sp-6)',
                    }}>
                        <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            fontSize: 'var(--text-sm)',
                            fontWeight: 600,
                            color: 'var(--text-muted)',
                            marginBottom: 'var(--sp-3)',
                        }}>
                            <Globe size={18} style={{ color: '#339933' }} />
                            Select Community
                        </label>
                        <select
                            value={formData.community}
                            onChange={(e) => setFormData(prev => ({ ...prev, community: e.target.value }))}
                            onFocus={() => setIsFocused(prev => ({ ...prev, community: true }))}
                            onBlur={() => setIsFocused(prev => ({ ...prev, community: false }))}
                            style={{
                                width: '100%',
                                padding: '14px 18px',
                                background: 'rgba(0,0,0,0.5)',
                                border: `2px solid ${isFocused.community ? '#339933' : 'rgba(51,153,51,0.2)'}`,
                                borderRadius: 'var(--radius-lg)',
                                color: 'var(--text-primary)',
                                fontSize: 'var(--text-base)',
                                outline: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                appearance: 'none',
                                backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23339933\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")',
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 16px center',
                            }}
                        >
                            <option value="" disabled>Choose a community</option>
                            {communities.map(comm => (
                                <option key={comm._id} value={comm._id} style={{ background: '#0a0a0a' }}>
                                    r/{comm.slug}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Title with cyber effect */}
                    <div className="glass-card" style={{
                        padding: 'var(--sp-6)',
                        marginBottom: 'var(--sp-6)',
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 'var(--sp-3)',
                        }}>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                fontSize: 'var(--text-sm)',
                                fontWeight: 600,
                                color: 'var(--text-muted)',
                            }}>
                                <Type size={18} style={{ color: '#339933' }} />
                                Title
                            </label>
                            <Counter current={formData.title.length} max={MAX_TITLE} label="chars" />
                        </div>

                        <input
                            ref={titleInputRef}
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            onFocus={() => setIsFocused(prev => ({ ...prev, title: true }))}
                            onBlur={() => setIsFocused(prev => ({ ...prev, title: false }))}
                            placeholder="e.g., How to implement real-time notifications with WebSocket?"
                            style={{
                                width: '100%',
                                padding: '14px 18px',
                                background: 'rgba(0,0,0,0.5)',
                                border: `2px solid ${isFocused.title ? '#339933' : 'rgba(51,153,51,0.2)'}`,
                                borderRadius: 'var(--radius-lg)',
                                color: 'var(--text-primary)',
                                fontSize: 'var(--text-base)',
                                fontWeight: 500,
                                outline: 'none',
                                transition: 'all 0.3s ease',
                            }}
                        />

                        <div style={{
                            fontSize: 'var(--text-xs)',
                            color: 'var(--text-muted)',
                            marginTop: 8,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                        }}>
                            <Sparkles size={12} />
                            Example: "How to optimize React rendering performance?"
                        </div>
                    </div>

                    {/* Content with cyber toolbar */}
                    <div className="glass-card" style={{
                        padding: 'var(--sp-6)',
                        marginBottom: 'var(--sp-6)',
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 'var(--sp-3)',
                        }}>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                fontSize: 'var(--text-sm)',
                                fontWeight: 600,
                                color: 'var(--text-muted)',
                            }}>
                                <AlignLeft size={18} style={{ color: '#339933' }} />
                                Content
                            </label>
                            <Counter current={formData.content.length} max={MAX_CONTENT} label="chars" />
                        </div>

                        {/* Cyber toolbar */}
                        <div style={{
                            display: 'flex',
                            gap: 4,
                            padding: '8px',
                            background: 'rgba(0,0,0,0.5)',
                            border: '2px solid rgba(51,153,51,0.2)',
                            borderBottom: 'none',
                            borderTopLeftRadius: 'var(--radius-lg)',
                            borderTopRightRadius: 'var(--radius-lg)',
                        }}>
                            {[
                                { icon: Bold, format: 'bold' },
                                { icon: Italic, format: 'italic' },
                                { icon: Code, format: 'code' },
                                { icon: Link, format: 'link' },
                                { icon: List, format: 'list' },
                                { icon: Image, format: 'image' },
                            ].map((item, index) => {
                                const Icon = item.icon;
                                const isSelected = selectedFormat === item.format;
                                return (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => handleFormatClick(item.format)}
                                        style={{
                                            padding: '8px 12px',
                                            background: isSelected ? 'rgba(51,153,51,0.2)' : 'transparent',
                                            border: 'none',
                                            borderRadius: 'var(--radius-md)',
                                            color: isSelected ? '#339933' : 'var(--text-muted)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(51,153,51,0.1)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = isSelected ? 'rgba(51,153,51,0.2)' : 'transparent'}
                                    >
                                        <Icon size={16} />
                                    </button>
                                );
                            })}
                        </div>

                        <textarea
                            value={formData.content}
                            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                            onFocus={() => setIsFocused(prev => ({ ...prev, content: true }))}
                            onBlur={() => setIsFocused(prev => ({ ...prev, content: false }))}
                            placeholder="Describe your challenge in detail. What have you tried? What specific help do you need?"
                            style={{
                                width: '100%',
                                minHeight: 280,
                                padding: '18px',
                                background: 'rgba(0,0,0,0.5)',
                                border: `2px solid ${isFocused.content ? '#339933' : 'rgba(51,153,51,0.2)'}`,
                                borderTop: 'none',
                                borderBottomLeftRadius: 'var(--radius-lg)',
                                borderBottomRightRadius: 'var(--radius-lg)',
                                color: 'var(--text-primary)',
                                fontSize: 'var(--text-base)',
                                lineHeight: 1.8,
                                outline: 'none',
                                resize: 'vertical',
                                transition: 'all 0.3s ease',
                            }}
                        />
                    </div>

                    {/* Tags with cyber effect */}
                    <div className="glass-card" style={{
                        padding: 'var(--sp-6)',
                        marginBottom: 'var(--sp-6)',
                    }}>
                        <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            fontSize: 'var(--text-sm)',
                            fontWeight: 600,
                            color: 'var(--text-muted)',
                            marginBottom: 'var(--sp-3)',
                        }}>
                            <Hash size={18} style={{ color: '#339933' }} />
                            Topics
                            <span style={{
                                fontSize: 'var(--text-xs)',
                                color: 'var(--text-subtle)',
                                fontWeight: 400,
                                marginLeft: 8,
                            }}>
                                (comma separated, max 5)
                            </span>
                        </label>

                        <input
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onFocus={() => setIsFocused(prev => ({ ...prev, tags: true }))}
                            onBlur={() => setIsFocused(prev => ({ ...prev, tags: false }))}
                            placeholder="e.g., react, performance, webdev, javascript"
                            style={{
                                width: '100%',
                                padding: '14px 18px',
                                background: 'rgba(0,0,0,0.5)',
                                border: `2px solid ${isFocused.tags ? '#339933' : 'rgba(51,153,51,0.2)'}`,
                                borderRadius: 'var(--radius-lg)',
                                color: 'var(--text-primary)',
                                fontSize: 'var(--text-base)',
                                outline: 'none',
                                transition: 'all 0.3s ease',
                            }}
                        />

                        {parsedTags.length > 0 && (
                            <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 8,
                                marginTop: 16,
                                animation: 'fadeInScale 0.3s ease',
                            }}>
                                {parsedTags.map(tag => (
                                    <span
                                        key={tag}
                                        className="tag-pill"
                                        style={{
                                            padding: '6px 16px',
                                            fontSize: 13,
                                        }}
                                    >
                                        <Hash size={10} />
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Tips section with cyber effect */}
                    <div className="glass-card" style={{
                        padding: 'var(--sp-6)',
                        marginBottom: 'var(--sp-8)',
                        border: '2px solid rgba(255,170,51,0.3)',
                        position: 'relative',
                        overflow: 'hidden',
                    }}>
                        <div style={{
                            position: 'absolute',
                            top: -20,
                            right: -20,
                            width: 100,
                            height: 100,
                            background: 'radial-gradient(circle at center, rgba(255,170,51,0.2) 0%, transparent 70%)',
                            borderRadius: '50%',
                        }} />

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            marginBottom: 12,
                        }}>
                            <HelpCircle size={20} color='#ffaa33' />
                            <span style={{
                                fontWeight: 700,
                                color: '#ffaa33',
                                fontSize: 'var(--text-base)',
                            }}>
                                Tips for a great challenge
                            </span>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: 12,
                        }}>
                            {[
                                'Be specific about your technical problem',
                                'Include code examples if relevant',
                                'Describe what you\'ve already tried',
                                'Add relevant topics to reach experts',
                            ].map((tip, index) => (
                                <div key={index} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '8px 12px',
                                    background: 'rgba(255,170,51,0.1)',
                                    borderRadius: 'var(--radius-lg)',
                                    border: '1px solid rgba(255,170,51,0.2)',
                                }}>
                                    <Zap size={14} color='#ffaa33' />
                                    <span style={{
                                        fontSize: 'var(--text-xs)',
                                        color: 'var(--text-secondary)',
                                    }}>
                                        {tip}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Action buttons with cyber effect */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        gap: 16,
                        paddingTop: 16,
                        position: 'relative',
                        zIndex: 1,
                    }}>
                        <button
                            type="button"
                            onClick={() => navigate('/community')}
                            className="post-action-btn"
                            style={{
                                padding: '12px 28px',
                                fontSize: 'var(--text-sm)',
                                background: 'rgba(255,255,255,0.03)',
                                border: '2px solid rgba(51,153,51,0.2)',
                                borderRadius: 'var(--radius-full)',
                            }}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={!isValid || submitting}
                            className="btn-primary"
                            style={{
                                padding: '12px 40px',
                                fontSize: 'var(--text-sm)',
                                minWidth: 200,
                                position: 'relative',
                                overflow: 'hidden',
                            }}
                        >
                            {submitting ? (
                                <>
                                    <span style={{
                                        width: 20,
                                        height: 20,
                                        border: '2px solid rgba(255,255,255,0.3)',
                                        borderTopColor: 'white',
                                        borderRadius: '50%',
                                        animation: 'spin 0.8s linear infinite',
                                        marginRight: 8,
                                    }} />
                                    Publishing...
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
                </form>
            ) : (
                /* Preview tab with cyber effect */
                <div className="glass-card" style={{
                    padding: 'var(--sp-8)',
                    position: 'relative',
                    zIndex: 1,
                }}>
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 3,
                        background: 'linear-gradient(90deg, #339933, #40c0ff, #6f4fff)',
                    }} />

                    {formData.title ? (
                        <h2 style={{
                            fontSize: 'clamp(20px, 4vw, 28px)',
                            fontWeight: 700,
                            background: 'linear-gradient(135deg, #fff 0%, #a0a0a0 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            marginBottom: 20,
                            lineHeight: 1.4,
                        }}>
                            {formData.title}
                        </h2>
                    ) : (
                        <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            No title yet
                        </p>
                    )}

                    {parsedTags.length > 0 && (
                        <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 8,
                            marginBottom: 20,
                        }}>
                            {parsedTags.map(tag => (
                                <span key={tag} style={{
                                    padding: '4px 12px',
                                    background: 'rgba(51,153,51,0.1)',
                                    color: '#339933',
                                    borderRadius: 'var(--radius-full)',
                                    fontSize: 12,
                                    fontWeight: 600,
                                    border: '1px solid rgba(51,153,51,0.3)',
                                }}>
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}

                    <hr style={{
                        border: 'none',
                        borderTop: '2px solid rgba(51,153,51,0.2)',
                        margin: '20px 0',
                    }} />

                    {formData.content ? (
                        <div style={{
                            fontSize: 'var(--text-base)',
                            lineHeight: 1.8,
                            color: 'var(--text-secondary)',
                            whiteSpace: 'pre-wrap',
                        }}>
                            {formData.content}
                        </div>
                    ) : (
                        <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            No content yet
                        </p>
                    )}
                </div>
            )}

            {/* Recommended topics with cyber effect */}
            {parsedTags.length === 0 && activeTab === 'write' && (
                <div className="glass-card" style={{
                    marginTop: 24,
                    padding: 'var(--sp-6)',
                    position: 'relative',
                    zIndex: 1,
                }}>
                    <div style={{
                        fontSize: 'var(--text-sm)',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        marginBottom: 16,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                    }}>
                        <Sparkles size={16} style={{ color: '#339933' }} />
                        Recommended Topics
                    </div>

                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 8,
                    }}>
                        {['react', 'javascript', 'python', 'devops', 'backend', 'frontend', 'database', 'api', 'security'].map(topic => (
                            <button
                                key={topic}
                                type="button"
                                onClick={() => {
                                    const currentTags = parsedTags;
                                    const newTags = currentTags.includes(topic)
                                        ? currentTags
                                        : [...currentTags, topic];
                                    setTagInput(newTags.join(', '));
                                }}
                                style={{
                                    padding: '8px 18px',
                                    background: 'rgba(51,153,51,0.05)',
                                    border: '2px solid rgba(51,153,51,0.2)',
                                    borderRadius: 'var(--radius-full)',
                                    color: 'var(--text-secondary)',
                                    fontSize: 13,
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(51,153,51,0.1)';
                                    e.currentTarget.style.borderColor = '#339933';
                                    e.currentTarget.style.color = 'white';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(51,153,51,0.05)';
                                    e.currentTarget.style.borderColor = 'rgba(51,153,51,0.2)';
                                    e.currentTarget.style.color = 'var(--text-secondary)';
                                }}
                            >
                                <Plus size={12} />
                                {topic}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreatePost;