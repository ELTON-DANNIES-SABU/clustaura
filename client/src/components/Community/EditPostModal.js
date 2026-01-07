import React, { useState, useEffect } from 'react';
import { X, Type } from 'lucide-react';
import useCommunityStore from '../../store/communityStore';

const EditPostModal = ({ post, isOpen, onClose }) => {
    const { editPost } = useCommunityStore();
    const [title, setTitle] = useState(post.title);
    const [content, setContent] = useState(post.content);
    const [tags, setTags] = useState(post.tags.join(', '));
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setTitle(post.title);
        setContent(post.content);
        setTags(post.tags.join(', '));
    }, [post]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const postData = {
            title,
            content,
            tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
        };

        const result = await editPost(post.id, postData);
        setLoading(false);
        if (result) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-charcoal border border-gray-800 rounded-lg w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-300">
                <div className="flex justify-between items-center p-6 border-b border-gray-800">
                    <h2 className="text-xl font-bold text-white uppercase tracking-widest">Edit Post</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="mb-4">
                        <label className="block text-xs text-gray-400 mb-2 uppercase tracking-widest font-bold">Title</label>
                        <input
                            type="text"
                            className="cyber-input font-bold"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-xs text-gray-400 mb-2 uppercase tracking-widest font-bold">Content</label>
                        <textarea
                            className="cyber-input min-h-[150px] text-sm"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            required
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-xs text-gray-400 mb-2 uppercase tracking-widest font-bold">Tags (comma separated)</label>
                        <input
                            type="text"
                            className="cyber-input text-xs"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 text-gray-400 hover:text-white font-bold transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !title.trim() || !content.trim()}
                            className="btn-neon"
                        >
                            {loading ? 'SAVING...' : 'SAVE CHANGES'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditPostModal;
