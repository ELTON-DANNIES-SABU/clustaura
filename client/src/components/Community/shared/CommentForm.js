import React, { useState, useRef, useCallback } from 'react';
import { Send, X } from 'lucide-react';

/**
 * CommentForm — Reusable textarea + submit button for new comments/replies.
 *
 * Props:
 *  onSubmit       — async (content: string) => void
 *  onCancel       — () => void (optional – shows Cancel button if provided)
 *  placeholder    — string
 *  submitLabel    — string
 *  autoFocus      — boolean
 *  authorName     — string (shown in "Comment as X" header)
 *  minHeight      — CSS string
 */
const CommentForm = ({
    onSubmit,
    onCancel,
    placeholder = 'What are your thoughts?',
    submitLabel = 'POST COMMENT',
    autoFocus = false,
    authorName = '',
    minHeight = '140px',
}) => {
    const [value, setValue] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const textareaRef = useRef(null);

    const handleSubmit = useCallback(async () => {
        const trimmed = value.trim();
        if (!trimmed || submitting) return;
        setSubmitting(true);
        try {
            await onSubmit?.(trimmed);
            setValue('');
        } finally {
            setSubmitting(false);
        }
    }, [value, submitting, onSubmit]);

    const handleKeyDown = useCallback((e) => {
        // Ctrl/Cmd + Enter to submit
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
        }
    }, [handleSubmit]);

    const charCount = value.length;
    const MAX = 4000;
    const overLimit = charCount > MAX;
    const hasContent = value.trim().length > 0;

    return (
        <div className="comment-form" aria-label="Comment form">
            {authorName && (
                <p className="comment-form__byline">
                    Comment as <span className="comment-form__username">{authorName}</span>
                </p>
            )}
            <div className={`comment-form__panel ${hasContent ? 'comment-form__panel--focused' : ''}`}>
                <textarea
                    ref={textareaRef}
                    className="comment-form__textarea"
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus={autoFocus}
                    style={{ minHeight }}
                    aria-label={placeholder}
                    aria-required="true"
                    aria-describedby="comment-form-hint"
                    maxLength={MAX + 100}
                />
                <div className="comment-form__footer">
                    <span
                        id="comment-form-hint"
                        className={`comment-form__counter ${overLimit ? 'comment-form__counter--over' : ''}`}
                        aria-live="polite"
                    >
                        {charCount}/{MAX}
                    </span>
                    <div className="comment-form__actions">
                        {onCancel && (
                            <button
                                type="button"
                                className="comment-form__cancel"
                                onClick={onCancel}
                                aria-label="Cancel comment"
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            type="button"
                            className="btn-primary comment-form__submit"
                            onClick={handleSubmit}
                            disabled={!hasContent || overLimit || submitting}
                            aria-label={submitLabel}
                            aria-busy={submitting}
                        >
                            {submitting ? (
                                <span className="btn-spinner" aria-hidden="true" />
                            ) : (
                                submitLabel
                            )}
                        </button>
                    </div>
                </div>
            </div>
            <p className="comment-form__tip">
                Ctrl + Enter to submit
            </p>
        </div>
    );
};

export default React.memo(CommentForm);
