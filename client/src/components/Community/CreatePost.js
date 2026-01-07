import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Image as ImageIcon, Link as LinkIcon, Type } from 'lucide-react';
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

            <div className="bg-charcoal border border-gray-800 rounded-xl p-8 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label className="block text-[10px] text-gray-500 mb-2 uppercase tracking-[0.2em] font-bold">Select Community</label>
                        <select
                            className="cyber-input bg-black/40 border-gray-800/50 focus:border-neon-green/50"
                            value={community}
                            onChange={(e) => setCommunity(e.target.value)}
                        >
                            <option value="" disabled className="bg-charcoal">Select a community</option>
                            {communities.map(comm => (
                                <option key={comm._id} value={comm._id} className="bg-charcoal text-white">r/{comm.slug}</option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-6">
                        <input
                            type="text"
                            placeholder="Post Title"
                            className="cyber-input font-bold text-lg bg-black/40 border-gray-800/50 focus:border-neon-green/50"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="mb-6">
                        <textarea
                            placeholder="What's on your mind? (use #tags for better reach)"
                            className="cyber-input min-h-[250px] text-sm leading-relaxed bg-black/40 border-gray-800/50 focus:border-neon-green/50 p-6"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                    </div>

                    <div className="mb-8">
                        <label className="block text-[10px] text-gray-500 mb-2 uppercase tracking-[0.2em] font-bold">Tags (comma separated)</label>
                        <input
                            type="text"
                            placeholder="e.g. programming, frontend, help"
                            className="cyber-input text-xs bg-black/40 border-gray-800/50 focus:border-neon-green/50"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-end gap-4 pt-6 border-t border-gray-800/50">
                        <button
                            type="button"
                            onClick={() => navigate('/community')}
                            className="px-6 py-2 text-xs text-gray-500 hover:text-white font-bold uppercase tracking-widest transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!title.trim() || !content.trim()}
                            className="btn-neon-solid px-10 py-3"
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
