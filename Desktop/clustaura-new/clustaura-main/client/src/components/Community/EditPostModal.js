import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import useCommunityStore from '../../store/communityStore';
import TagList from './shared/TagList';

const MAX_TITLE = 300;
const MAX_CONTENT = 10000;

const EditPostModal = ({ post, isOpen, onClose, onToast }) => {
    const { editPost } = useCommunityStore();
    const [title, setTitle] = useState(post.title);
    const [content, setContent] = useState(post.content);
    const [tagInput, setTagInput] = useState(post.tags.join(', '));
    const [loading, setLoading] = useState(false);
    const firstFocusRef = useRef(null);

    useEffect(() => {
        setTitle(post.title);
        setContent(post.content);
        setTagInput(post.tags.join(', '));
    }, [post]);

    // Focus trap: focus first element when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => firstFocusRef.current?.focus(), 50);
        }
    }, [isOpen]);

    // Close on Escape
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        if (isOpen) document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const parsedTags = tagInput
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

    const isValid = title.trim() && content.trim() &&
        title.length <= MAX_TITLE && content.length <= MAX_CONTENT;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isValid) return;
        setLoading(true);
        try {
            const result = await editPost(post.id, {
                title: title.trim(),
                content: content.trim(),
                tags: parsedTags,
            });
            if (result) {
                onToast?.('Post updated!', 'success');
                onClose();
            } else {
                onToast?.('Failed to update post. Please try again.', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    const CounterBadge = ({ current, max }) => {
        const pct = current / max;
        const cls = pct > 1 ? 'char-counter--over' : pct > 0.85 ? 'char-counter--warning' : '';
        return <span className={`char-counter ${cls}`}>{current}/{max}</span>;
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--sp-4)' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-modal-title"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                className="surface-panel"
                style={{ width: '100%', maxWidth: 640, boxShadow: 'var(--shadow-modal)', borderRadius: 'var(--radius-xl)' }}
                role="document"
            >
                {/* Header */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: 'var(--sp-6)', borderBottom: '1px solid var(--border-subtle)'
                }}>
                    <h2
                        id="edit-modal-title"
                        style={{ fontSize: 'var(--text-xl)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}
                    >
                        Edit Post
                    </h2>
                    <button
                        className="post-action-btn"
                        onClick={onClose}
                        aria-label="Close edit modal"
                        style={{ padding: 'var(--sp-2)' }}
                    >
                        <X size={20} aria-hidden="true" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: 'var(--sp-6)' }} className="community-container">
                    {/* Title */}
                    <div style={{ marginBottom: 'var(--sp-4)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--sp-2)' }}>
                            <label htmlFor="edit-title" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Title</label>
                            <CounterBadge current={title.length} max={MAX_TITLE} />
                        </div>
                        <input
                            id="edit-title"
                            ref={firstFocusRef}
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            aria-required="true"
                            style={{ fontWeight: 700 }}
                        />
                    </div>

                    {/* Content */}
                    <div style={{ marginBottom: 'var(--sp-4)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--sp-2)' }}>
                            <label htmlFor="edit-content" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Content</label>
                            <CounterBadge current={content.length} max={MAX_CONTENT} />
                        </div>
                        <textarea
                            id="edit-content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            aria-required="true"
                            style={{ minHeight: 150, fontSize: 'var(--text-sm)', lineHeight: 'var(--lh-relaxed)' }}
                        />
                    </div>

                    {/* Tags */}
                    <div style={{ marginBottom: 'var(--sp-6)' }}>
                        <label htmlFor="edit-tags" style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 'var(--sp-2)' }}>
                            Tags (comma separated)
                        </label>
                        <input
                            id="edit-tags"
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            placeholder="e.g. programming, react, help"
                        />
                        {parsedTags.length > 0 && (
                            <div className="tag-input-preview">
                                <TagList tags={parsedTags} />
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--sp-3)', paddingTop: 'var(--sp-4)', borderTop: '1px solid var(--border-subtle)' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            className="post-action-btn"
                            style={{ fontSize: 'var(--text-sm)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={loading || !isValid}
                            aria-busy={loading}
                            style={{ padding: '0.65rem var(--sp-8)' }}
                        >
                            {loading
                                ? <><span className="btn-spinner" aria-hidden="true" /> Saving...</>
                                : 'SAVE CHANGES'
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditPostModal;
