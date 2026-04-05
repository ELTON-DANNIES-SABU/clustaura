
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { API_BASE_URL, SOCKET_URL } from '../config';
import { Search, Filter, Trophy, Users, MessageSquare, ArrowLeft, Trash2 } from 'lucide-react';
import NotificationBell from './NotificationBell';
import ChallengeComposer from './ChallengeComposer';
import CommunityLeftSidebar from './Community/CommunityLeftSidebar';
import CommunityRightSidebar from './Community/CommunityRightSidebar';
import StarBadge from './StarBadge';
import useCommunityStore from '../store/communityStore';
import './Community/Community.css'; // explicitly apply community header CSS to this page.

const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    const years = Math.floor(days / 365);
    return `${years}y ago`;
};

const Challenges = () => {
    const { selectedProfessionTags } = useCommunityStore();
    const [challenges, setChallenges] = useState([]);
    const [filteredChallenges, setFilteredChallenges] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('recent');
    const [expandedComments, setExpandedComments] = useState({});
    const [commentInputs, setCommentInputs] = useState({});
    const [commentAllowContact, setCommentAllowContact] = useState({});

    const [socket, setSocket] = useState(null);
    const [newChallengeIds, setNewChallengeIds] = useState(new Set());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        const userData = userStr ? JSON.parse(userStr) : null;
        const token = userData ? userData.token : null;
        if (userData && userData._id) setCurrentUserId(userData._id);

        const newSocket = io(SOCKET_URL, {
            auth: { token }
        });
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

    // HTTP Fallback to guarantee initial challenges load 
    useEffect(() => {
        const fetchExistingChallenges = async () => {
            try {
                const userStr = localStorage.getItem('user');
                const token = userStr ? JSON.parse(userStr).token : null;
                const response = await axios.get('/api/challenges', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                // Only set if we got actual data to prevent overwriting active socket state with empty array
                if (response.data && response.data.length > 0) {
                    setChallenges(prev => prev.length === 0 ? response.data : prev);
                }
            } catch (err) {
                console.error('Failed to fetch initial challenges:', err);
            }
        };

        fetchExistingChallenges();
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

    const handleDeleteChallenge = async (e, challengeId) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this challenge?')) return;

        try {
            const userStr = localStorage.getItem('user');
            const token = userStr ? JSON.parse(userStr).token : null;
            await axios.delete(`/api/challenges/${challengeId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // State will be updated by socket listener, but we can also do it here for immediate feedback
            setChallenges(prev => prev.filter(c => c._id !== challengeId));
        } catch (err) {
            console.error('Failed to delete challenge:', err);
            alert('Failed to delete challenge. Please try again.');
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
                <div className="header-container">
                    {/* Left: Logo and Dashboard Button */}
                    <div className="header-left">
                        <div className="brand-logo" onClick={handleBackToDashboard} role="button" tabIndex={0} style={{ transform: 'scale(0.8)', transformOrigin: 'left center' }}>
                            <div className="brand-logo-container">
                                <div className="brand-logo-icon">
                                    <span className="brand-logo-icon-inner">C</span>
                                </div>
                                <span className="brand-logo-text">CLUSTAURA</span>
                            </div>
                        </div>
                    </div>

                    {/* Center: Search */}
                    <div className="header-center">
                        <div className="search-wrapper">
                            <div className="search-input-wrapper">
                                <Search className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search global challenges..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right: Notifications */}
                    <div className="header-right">
                        <NotificationBell />
                    </div>
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
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] text-gray-500 font-medium tracking-wider mr-2" style={{ opacity: 0.6 }}>
                                                    {new Date(challenge.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} • {new Date(challenge.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border border-subtle ${challenge.difficulty === 'Expert' ? 'text-red-500 border-red-500/20' :
                                                    challenge.difficulty === 'Advanced' ? 'text-orange-500 border-orange-500/20' :
                                                        challenge.difficulty === 'Intermediate' ? 'text-blue-500 border-blue-500/20' :
                                                            'text-green-500 border-green-500/20'
                                                    }`}>
                                                    {challenge.difficulty}
                                                </div>
                                                {currentUserId === (challenge.author?._id || challenge.author) && (
                                                    <button
                                                        onClick={(e) => handleDeleteChallenge(e, challenge._id)}
                                                        title="Delete Challenge"
                                                        style={{ 
                                                            background: 'transparent', 
                                                            border: '1px solid rgba(255, 71, 87, 0.2)', 
                                                            color: '#ff4757', 
                                                            cursor: 'pointer',
                                                            padding: '6px',
                                                            borderRadius: '6px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            transition: 'all 0.2s ease'
                                                        }}
                                                        onMouseEnter={(e) => { 
                                                            e.currentTarget.style.backgroundColor = 'rgba(255, 71, 87, 0.1)'; 
                                                            e.currentTarget.style.borderColor = 'rgba(255, 71, 87, 0.5)';
                                                        }}
                                                        onMouseLeave={(e) => { 
                                                            e.currentTarget.style.backgroundColor = 'transparent'; 
                                                            e.currentTarget.style.borderColor = 'rgba(255, 71, 87, 0.2)';
                                                        }}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
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
            </main >
        </div >
    );
};

export default Challenges;
