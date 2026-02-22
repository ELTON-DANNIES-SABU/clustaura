import React, { useState } from 'react';
import axios from 'axios';
import { X, Plus, AlertCircle } from 'lucide-react';
import './Community/Community.css';

const ChallengeComposer = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [difficulty, setDifficulty] = useState('Intermediate');
    const [tags, setTags] = useState('');
    const [contactEnabled, setContactEnabled] = useState(true);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);

        try {
            const userStr = localStorage.getItem('user');
            const { token } = JSON.parse(userStr);

            const payload = {
                title,
                description,
                difficulty,
                tags: tags.split(',').map(t => t.trim()).filter(t => t),
                contactEnabled
            };

            await axios.post('/api/challenges', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });


            // Reset and close
            setTitle('');
            setDescription('');
            setTags('');
            setDifficulty('Intermediate');
            setContactEnabled(true);
            setIsOpen(false);
            setLoading(false);
        } catch (error) {
            console.error('Error creating challenge:', error);
            alert(error.response?.data?.message || 'Failed to create challenge');
            setLoading(false);
        }
    };

    return (
        <>
            <div
                className="surface-panel p-8 border border-subtle hover:border-node-green transition-all cursor-pointer group mb-10"
                onClick={() => setIsOpen(true)}
                style={{ background: 'var(--surface-bg)', borderColor: 'var(--border-subtle)' }}
            >
                <div className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-full bg-node-green/10 flex items-center justify-center text-node-green group-hover:bg-node-green group-hover:text-white transition-all shrink-0">
                            <Plus size={28} />
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-gray-100 font-bold text-lg block">Post a Global Challenge</span>
                            <span className="text-sm text-gray-500 max-w-md">Share a problem and collaborate with expert solvers to find a solution.</span>
                        </div>
                    </div>
                    <button className="btn-primary py-3 px-8 text-xs transition-all transform active:scale-95 shrink-0">
                        CREATE CHALLENGE
                    </button>
                </div>
            </div>

            {isOpen && (
                <div className="post-composer-overlay">
                    <div className="post-composer-modal max-w-2xl w-full mx-4" style={{ animation: 'slideUp 0.3s ease-out' }}>
                        <div className="surface-panel shadow-2xl overflow-hidden" style={{ background: 'var(--surface-bg)', border: '1px solid var(--border-subtle)' }}>
                            <div className="px-8 py-6 border-b border-subtle flex items-center justify-between" style={{ background: 'rgba(0,0,0,0.2)', borderColor: 'var(--border-subtle)' }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-8 bg-node-green rounded-full"></div>
                                    <h3 className="text-xl font-bold text-white tracking-tight">Create Challenge</h3>
                                </div>
                                <button
                                    className="p-2 text-gray-500 hover:text-white hover:bg-surface-hover rounded-full transition-all"
                                    onClick={() => setIsOpen(false)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                            Challenge Title *
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Enter a descriptive title..."
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                            Difficulty Level
                                        </label>
                                        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                                            <option>Beginner</option>
                                            <option>Intermediate</option>
                                            <option>Advanced</option>
                                            <option>Expert</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                        Challenge Description
                                    </label>
                                    <textarea
                                        placeholder="Describe the challenge in detail. What is the problem, and what kind of expertise are you looking for?"
                                        rows={6}
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        required
                                        className="resize-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                        Tech Stack Tags (Comma separated)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. React, Node.js, AI, Blockchain..."
                                        value={tags}
                                        onChange={(e) => setTags(e.target.value)}
                                    />
                                </div>

                                <div className="bg-dark-bg/50 p-4 rounded-lg border border-subtle flex items-start gap-3" style={{ background: 'var(--dark-bg)', borderColor: 'var(--border-subtle)' }}>
                                    <input
                                        type="checkbox"
                                        id="contactEnabled"
                                        checked={contactEnabled}
                                        onChange={(e) => setContactEnabled(e.target.checked)}
                                        className="mt-1 w-4 h-4 accent-node-green"
                                        style={{ width: 'auto' }}
                                    />
                                    <div>
                                        <label htmlFor="contactEnabled" className="text-sm font-bold text-gray-300 block mb-1 cursor-pointer">
                                            Enable Team Formation
                                        </label>
                                        <p className="text-xs text-gray-500">
                                            Allow expert solvers to contact you directly to propose solutions or join a team.
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-subtle flex justify-end gap-4" style={{ borderColor: 'var(--border-subtle)' }}>
                                    <button
                                        type="button"
                                        className="px-6 py-2 text-xs font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-widest"
                                        onClick={() => setIsOpen(false)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                                    >
                                        Discard
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn-primary py-3 px-8"
                                        disabled={loading || !title || !description}
                                    >
                                        {loading ? 'POSTING...' : 'PUBLISH CHALLENGE'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ChallengeComposer;
