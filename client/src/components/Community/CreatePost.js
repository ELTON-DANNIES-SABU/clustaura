import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Image as ImageIcon, Link as LinkIcon, Type } from 'lucide-react';
import useCommunityStore from '../../store/communityStore';

const CreatePost = () => {
    const navigate = useNavigate();
    const { addPost, communities } = useCommunityStore();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [community, setCommunity] = useState(communities[0]?.id || '');
    const [tags, setTags] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) return;

        const newPost = {
            id: `post_${Date.now()}`,
            communityId: community,
            title,
            content,
            author: 'current_user',
            timestamp: new Date().toISOString(),
            votes: 1,
            userVote: 1,
            commentCount: 0,
            tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
        };

        addPost(newPost);
        navigate('/community');
    };

    return (
        <div className="max-w-2xl mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Create a post</h2>
                <button
                    onClick={() => navigate('/community')}
                    className="text-gray-400 hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>
            </div>

            <div className="bg-charcoal border border-gray-800 rounded-lg p-6 shadow-xl">
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-xs text-gray-400 mb-2 uppercase tracking-widest font-bold">Select Community</label>
                        <select
                            className="cyber-input"
                            value={community}
                            onChange={(e) => setCommunity(e.target.value)}
                        >
                            <option value="" disabled>Select a community</option>
                            {communities.map(comm => (
                                <option key={comm.id} value={comm.id}>r/{comm.slug}</option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-4">
                        <input
                            type="text"
                            placeholder="Title"
                            className="cyber-input font-bold"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="mb-4">
                        <div className="flex gap-2 mb-2 p-1 border-b border-gray-800">
                            <button type="button" className="p-2 text-neon-green hover:bg-gray-800 rounded transition-colors"><Type size={18} /></button>
                            <button type="button" className="p-2 text-gray-400 hover:bg-gray-800 rounded transition-colors" title="Coming soon"><ImageIcon size={18} /></button>
                            <button type="button" className="p-2 text-gray-400 hover:bg-gray-800 rounded transition-colors" title="Coming soon"><LinkIcon size={18} /></button>
                        </div>
                        <textarea
                            placeholder="Text (optional)"
                            className="cyber-input min-h-[200px] text-sm"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                    </div>

                    <div className="mb-6">
                        <input
                            type="text"
                            placeholder="Tags (comma separated)"
                            className="cyber-input text-xs"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                        <button
                            type="button"
                            onClick={() => navigate('/community')}
                            className="px-6 py-2 text-gray-400 hover:text-white font-bold transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!title.trim() || !content.trim()}
                            className="btn-neon"
                        >
                            POST
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreatePost;
