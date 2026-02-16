
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Search, Filter, Trophy, Users, MessageSquare, ArrowLeft } from 'lucide-react';
import NotificationBell from './NotificationBell';
import ChallengeComposer from './ChallengeComposer';
import CommunityLeftSidebar from './Community/CommunityLeftSidebar';
import CommunityRightSidebar from './Community/CommunityRightSidebar';
import StarBadge from './StarBadge';
import useCommunityStore from '../store/communityStore';

const Challenges = () => {
    const { selectedProfessionTags } = useCommunityStore();
    const [challenges, setChallenges] = useState([]);
    const [filteredChallenges, setFilteredChallenges] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('trending');
    const [expandedComments, setExpandedComments] = useState({});
    const [commentInputs, setCommentInputs] = useState({});
    const [commentAllowContact, setCommentAllowContact] = useState({});

    const [socket, setSocket] = useState(null);
    const [newChallengeIds, setNewChallengeIds] = useState(new Set());
    const [isSubmitting, setIsSubmitting] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const newSocket = io('http://localhost:5000');
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Connected to socket server');
            newSocket.emit('request_challenges');
        });

        newSocket.on('challenge:initial', (data) => {
            setChallenges(data);
            setFilteredChallenges(data);
        });

        newSocket.on('challenge:delete', ({ id }) => {
            setChallenges(prev => prev.filter(c => c._id !== id));
        });

        newSocket.on('new-challenge-post', (newChallenge) => {
            setChallenges(prev => [newChallenge, ...prev]);
            setNewChallengeIds(prev => new Set([...prev, newChallenge._id]));
            setTimeout(() => {
                setNewChallengeIds(prev => {
                    const next = new Set(prev);
                    next.delete(newChallenge._id);
                    return next;
                });
            }, 3000);
        });

        newSocket.on('challenge:update', (updatedChallenge) => {
            setChallenges(prev => prev.map(c => c._id === updatedChallenge._id ? updatedChallenge : c));
        });

        return () => newSocket.close();
    }, []);

    useEffect(() => {
        let filtered = [...challenges];

        if (searchQuery) {
            filtered = filtered.filter(challenge =>
                challenge.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                challenge.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                challenge.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        // Use selectedProfessionTags from store
        if (selectedProfessionTags && selectedProfessionTags.length > 0) {
            filtered = filtered.filter(challenge =>
                challenge.tags.some(tag =>
                    selectedProfessionTags.some(profTag =>
                        tag.toLowerCase().includes(profTag.toLowerCase()) ||
                        profTag.toLowerCase().includes(tag.toLowerCase())
                    )
                )
            );
        }

        if (sortBy === 'trending') {
            filtered.sort((a, b) => (b.votes?.length || 0) - (a.votes?.length || 0));
        } else if (sortBy === 'recent') {
            filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        setFilteredChallenges(filtered);
    }, [searchQuery, selectedProfessionTags, sortBy, challenges]);

    const handleVote = async (challengeId) => {
        try {
            const { token } = JSON.parse(localStorage.getItem('user'));
            await axios.put(`/api/challenges/${challengeId}/vote`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            console.error('Error voting:', error);
        }
    };

    const handleJoinChallenge = async (challengeId) => {
        try {
            const { token } = JSON.parse(localStorage.getItem('user'));
            await axios.put(`/api/challenges/${challengeId}/join`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert(`You have successfully joined the challenge!`);
        } catch (error) {
            console.error('Error joining:', error);
            alert(error.response?.data?.message || 'Failed to join challenge');
        }
    };

    const toggleComments = (challengeId) => {
        setExpandedComments(prev => ({
            ...prev,
            [challengeId]: !prev[challengeId]
        }));
    };

    const handleBackToDashboard = () => navigate('/dashboard');

    return (
        <div className="community-container min-h-screen">
            <header className="community-header">
                <div className="flex items-center gap-6">
                    <div className="brand-logo" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer', transform: 'scale(0.8)', transformOrigin: 'left center' }}>
                        <div className="brand-logo-container">
                            <div className="brand-logo-icon">
                                <div className="brand-logo-icon-inner">C</div>
                                <div className="brand-logo-icon-ring"></div>
                            </div>
                            <div className="brand-logo-text">CLUSTAURA</div>
                        </div>
                    </div>

                    <button
                        onClick={handleBackToDashboard}
                        className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-widest"
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                        <ArrowLeft size={14} />
                        Dashboard
                    </button>
                </div>

                <div className="search-wrapper">
                    <Search size={18} style={{ color: 'var(--node-green)' }} />
                    <input
                        type="text"
                        placeholder="Search global challenges..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-4">
                    <NotificationBell />
                </div>
            </header>

            <main className="community-main">
                {/* Left Sidebar */}
                <aside className="hidden lg:block">
                    <div className="sticky top-24">
                        <CommunityLeftSidebar />
                    </div>
                </aside>

                {/* Center Content */}
                <div className="community-content">
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-white mb-2">Global Challenges</h1>
                                <p className="text-sm text-gray-500">Discover and solve real-world problems with the community.</p>
                            </div>
                            <div className="flex gap-3">
                                <select
                                    className="bg-surface-bg border border-subtle text-xs text-gray-400 px-3 py-2 rounded-md outline-none focus:border-node-green transition-all"
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    style={{ width: 'auto' }}
                                >
                                    <option value="trending">Trending</option>
                                    <option value="recent">Recent</option>
                                </select>
                            </div>
                        </div>

                        <ChallengeComposer />
                    </div>

                    <div className="post-feed space-y-6">
                        {filteredChallenges.map(challenge => (
                            <div
                                key={challenge._id}
                                className={`post-card group ${newChallengeIds.has(challenge._id) ? 'new-item' : ''}`}
                                onClick={() => navigate(`/challenge/${challenge._id}`)}
                            >
                                <div className="flex gap-4">
                                    {/* Author & Header */}
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center text-xs font-bold text-node-green border border-subtle">
                                                    {challenge.author?.firstName?.charAt(0) || 'U'}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-gray-200">
                                                        {challenge.author?.firstName} {challenge.author?.lastName}
                                                        {challenge.author?._id && <StarBadge userId={challenge.author._id} />}
                                                    </span>
                                                    <span className="text-[10px] text-gray-600 font-bold uppercase tracking-wider">
                                                        {new Date(challenge.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border border-subtle ${challenge.difficulty === 'Expert' ? 'text-red-500 border-red-500/20' :
                                                challenge.difficulty === 'Advanced' ? 'text-orange-500 border-orange-500/20' :
                                                    challenge.difficulty === 'Intermediate' ? 'text-blue-500 border-blue-500/20' :
                                                        'text-green-500 border-green-500/20'
                                                }`}>
                                                {challenge.difficulty}
                                            </div>
                                        </div>

                                        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-node-green transition-colors">
                                            {challenge.title}
                                        </h3>

                                        <p className="text-sm text-gray-400 mb-4 line-clamp-3 leading-relaxed">
                                            {challenge.description}
                                        </p>

                                        <div className="flex flex-wrap gap-2 mb-6">
                                            {challenge.tags.map(tag => (
                                                <span key={tag} className="text-[10px] font-bold text-node-green bg-node-green/10 px-2 py-1 rounded uppercase tracking-widest">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-subtle" style={{ borderColor: 'var(--border-subtle)' }}>
                                            <div className="flex items-center gap-6">
                                                <button
                                                    className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-node-green transition-colors"
                                                    onClick={(e) => { e.stopPropagation(); handleVote(challenge._id); }}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                                                >
                                                    <Trophy size={14} />
                                                    {challenge.votes?.length || 0}
                                                </button>
                                                <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                                                    <Users size={14} />
                                                    {challenge.participants?.length || 0}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                                                    <MessageSquare size={14} />
                                                    {challenge.comments?.length || 0} solutions
                                                </div>
                                            </div>

                                            <button
                                                className="btn-primary py-2 px-6 text-[10px]"
                                                onClick={(e) => { e.stopPropagation(); handleJoinChallenge(challenge._id); }}
                                            >
                                                JOIN CHALLENGE
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {filteredChallenges.length === 0 && (
                            <div className="surface-panel p-12 text-center">
                                <Trophy size={48} className="mx-auto text-gray-700 mb-4 opacity-20" />
                                <h3 className="text-lg font-bold text-gray-400 mb-2">No challenges found</h3>
                                <p className="text-sm text-gray-600">Try adjusting your filters or be the first to post a challenge!</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Sidebar */}
                <aside className="hidden xl:block">
                    <div className="sticky top-24">
                        <CommunityRightSidebar />
                    </div>
                </aside>
            </main>
        </div>
    );
};

export default Challenges;
