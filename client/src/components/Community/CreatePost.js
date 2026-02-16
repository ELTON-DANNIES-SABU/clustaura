import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import useCommunityStore from '../../store/communityStore';

const CreatePost = () => {
    const navigate = useNavigate();
    const { addPost, communities } = useCommunityStore();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [community, setCommunity] = useState(communities[0]?._id || '');
    const [tags, setTags] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim() || !content.trim() || !community) return;

        const postData = {
            communityId: community,
            title,
            content,
            tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
        };

        const result = await addPost(postData);
        if (result) {
            navigate('/community');
        }
    };

    return (
        <div className="community-container max-w-3xl mx-auto p-6">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-white tracking-tight">Create a new post</h2>
                <button
                    onClick={() => navigate('/community')}
                    className="text-gray-500 hover:text-white transition-colors p-2"
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                    <X size={24} />
                </button>
            </div>

            <div className="surface-panel rounded-xl p-8 shadow-2xl border border-subtle" style={{ background: 'var(--surface-bg)', borderColor: 'var(--border-subtle)' }}>
                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label htmlFor="community" className="block text-xs text-gray-400 mb-2 uppercase tracking-widest font-bold">Select Community</label>
                        <select
                            id="community"
                            value={community}
                            onChange={(e) => setCommunity(e.target.value)}
                        >
                            <option value="" disabled>Select a community</option>
                            {communities.map(comm => (
                                <option key={comm._id} value={comm._id}>r/{comm.slug}</option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-6">
                        <label htmlFor="title" className="block text-xs text-gray-400 mb-2 uppercase tracking-widest font-bold">Title</label>
                        <input
                            id="title"
                            type="text"
                            placeholder="Give your post a title"
                            className="font-bold text-lg"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="mb-6">
                        <label htmlFor="content" className="block text-xs text-gray-400 mb-2 uppercase tracking-widest font-bold">Content</label>
                        <textarea
                            id="content"
                            placeholder="What's on your mind? (use #tags for better reach)"
                            className="min-h-[300px] leading-relaxed"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                    </div>

                    <div className="mb-8">
                        <label htmlFor="tags" className="block text-xs text-gray-400 mb-2 uppercase tracking-widest font-bold">Tags (comma separated)</label>
                        <input
                            id="tags"
                            type="text"
                            placeholder="e.g. programming, frontend, help"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-end items-center gap-6 pt-8 border-t border-subtle" style={{ borderColor: 'var(--border-subtle)' }}>
                        <button
                            type="button"
                            onClick={() => navigate('/community')}
                            className="text-sm text-gray-500 hover:text-white transition-colors"
                            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!title.trim() || !content.trim()}
                            className="btn-primary px-12"
                        >
                            PUBLISH POST
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreatePost;
