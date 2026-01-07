
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import NotificationBell from './NotificationBell';
import ChallengeComposer from './ChallengeComposer';
import StarBadge from './StarBadge';
import '../styles.css';

const Challenges = () => {
    const [challenges, setChallenges] = useState([]);
    const [filteredChallenges, setFilteredChallenges] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [category, setCategory] = useState('all');
    const [sortBy, setSortBy] = useState('trending');
    const [expandedComments, setExpandedComments] = useState({});
    const [commentInputs, setCommentInputs] = useState({});
    const [commentAllowContact, setCommentAllowContact] = useState({}); // New state for allowContact

    // Real-time state
    const [socket, setSocket] = useState(null);
    const [newChallengeIds, setNewChallengeIds] = useState(new Set());
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Create Challenge Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newChallenge, setNewChallenge] = useState({
        title: '',
        description: '',
        tags: '', // Comma separated
        difficulty: 'Intermediate'
    });

    // Challenge Detail Modal State
    const [selectedChallengeId, setSelectedChallengeId] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        // Connect socket
        const newSocket = io('http://localhost:5000');
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Socket connected');
        });

        newSocket.on('challenge:initial', (data) => {
            // Initial load
            setChallenges(data);
            setFilteredChallenges(data);
        });

        newSocket.on('challenge:delete', ({ id }) => {
            setChallenges(prev => prev.filter(c => c._id !== id));
        });

        newSocket.on('new-challenge-post', (newChallenge) => {
            setChallenges(prev => [newChallenge, ...prev]);
            // Add to new IDs for glow effect
            setNewChallengeIds(prev => {
                const newSet = new Set(prev);
                newSet.add(newChallenge._id);
                return newSet;
            });
            // Remove glow after animation
            setTimeout(() => {
                setNewChallengeIds(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(newChallenge._id);
                    return newSet;
                });
            }, 3000);

            // alert('New Challenge Posted!'); // Optional toast
        });

        newSocket.on('challenge:update', (updatedChallenge) => {
            setChallenges(prev => prev.map(c => c._id === updatedChallenge._id ? updatedChallenge : c));
        });

        return () => newSocket.close();
    }, []);

    // Fallback or Refresh manually if needed
    const fetchChallenges = async () => {
        // No-op or keep for manual refresh if socket fails? 
        // For strict real-time requirement, we rely on socket init.
        // But let's keep it functional just in case manual refresh is triggered.
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const userData = JSON.parse(userStr);
                const token = userData.token;
                const config = {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                };

                const { data } = await axios.get('http://localhost:5000/api/challenges', config);
                setChallenges(data);
                setFilteredChallenges(data);
            }
        } catch (error) {
            console.error('Error fetching challenges:', error);
        }
    };

    useEffect(() => {
        let filtered = [...challenges];

        // Apply search filter
        if (searchQuery) {
            filtered = filtered.filter(challenge =>
                challenge.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                challenge.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                challenge.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        // Apply category filter
        if (category !== 'all') {
            filtered = filtered.filter(challenge =>
                challenge.tags.some(tag => tag.toLowerCase().includes(category.toLowerCase()))
            );
        }

        // Apply sorting
        if (sortBy === 'trending') {
            filtered.sort((a, b) => (b.votes?.length || 0) - (a.votes?.length || 0));
        } else if (sortBy === 'recent') {
            filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else if (sortBy === 'comments') {
            // Comments not implemented in backend yet, strictly placeholder logic
            filtered.sort((a, b) => (b.comments || 0) - (a.comments || 0));
        }

        setFilteredChallenges(filtered);
    }, [searchQuery, category, sortBy, challenges]);

    const handleCreateChallenge = async (e) => {
        e.preventDefault();
        try {
            const userStr = localStorage.getItem('user');
            const userData = JSON.parse(userStr);
            const token = userData.token;
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                }
            };

            const payload = {
                ...newChallenge,
                tags: newChallenge.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
            };

            setIsSubmitting(true);
            await axios.post('http://localhost:5000/api/challenges', payload, config);

            setShowCreateModal(false);
            setNewChallenge({ title: '', description: '', tags: '', difficulty: 'Intermediate' });
            // Show toast/alert with backend message
            alert('Challenge posted successfully!');
        } catch (error) {
            console.error('Error creating challenge:', error);
            alert(error.response?.data?.message || 'Failed to create challenge.');
        } finally {
            setIsSubmitting(false);
        }


    };

    const handleVote = async (challengeId) => {
        try {
            const userStr = localStorage.getItem('user');
            const userData = JSON.parse(userStr);
            const token = userData.token;
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };

            await axios.put(`http://localhost:5000/api/challenges/${challengeId}/vote`, {}, config);
            // fetchChallenges(); // Handled by socket challenge:update
        } catch (error) {
            console.error('Error voting:', error);
        }
    };

    const handleJoinChallenge = async (challengeId) => {
        try {
            const userStr = localStorage.getItem('user');
            const userData = JSON.parse(userStr);
            const token = userData.token;
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };

            await axios.put(`http://localhost:5000/api/challenges/${challengeId}/join`, {}, config);
            alert(`You have successfully joined the challenge!`);
            // fetchChallenges(); // Handled by socket challenge:update
        } catch (error) {
            console.error('Error joining:', error);
            alert(error.response?.data?.message || 'Failed to join challenge');
        }
    };

    const handleTeamInvite = async (challengeId, solverId) => {
        try {
            const userStr = localStorage.getItem('user');
            const userData = JSON.parse(userStr);
            const token = userData.token;
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };

            await axios.post(`http://localhost:5000/api/challenges/${challengeId}/invite`, { solverId }, config);
            alert('Invitation sent successfully!');
        } catch (error) {
            console.error('Error sending invite:', error);
            alert(error.response?.data?.message || 'Failed to send invite');
        }
    };

    const handleBackToDashboard = () => {
        navigate('/dashboard');
    };

    // Helper to format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    const toggleComments = (challengeId) => {
        setExpandedComments(prev => ({
            ...prev,
            [challengeId]: !prev[challengeId]
        }));
    };

    const handleCommentInputChange = (challengeId, text) => {
        setCommentInputs(prev => ({
            ...prev,
            [challengeId]: text
        }));
    };

    const handleSubmitComment = async (challengeId) => {
        const text = commentInputs[challengeId];
        const allowContact = commentAllowContact[challengeId] || false;
        if (!text || !text.trim()) return;

        try {
            const userStr = localStorage.getItem('user');
            const userData = JSON.parse(userStr);
            const token = userData.token;
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };

            await axios.post(`http://localhost:5000/api/challenges/${challengeId}/comments`, { text, allowContact }, config);

            // Clear input and refresh
            // Clear input
            setCommentInputs(prev => ({ ...prev, [challengeId]: '' }));
            setCommentAllowContact(prev => ({ ...prev, [challengeId]: false }));

            // fetchChallenges(); // Handled by socket challenge:update
            // alert('Comment posted!');
        } catch (error) {
            console.error('Error posting comment:', error);
            alert('Failed to post comment');
        }
    };

    return (
        <div className="challenges-page">
            <header className="challenges-header">
                <button className="back-button" onClick={handleBackToDashboard}>
                    ← Back to Dashboard
                </button>
                <div className="header-content">
                    <h1>🌍 Trending Global Challenges</h1>
                    <p>Join the world's most pressing technical challenges and collaborate with experts</p>
                </div>
                <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>
                    {/* Replaced with ChallengeComposer below */}
                </div>
            </header>

            <ChallengeComposer />

            {/* Inline Modal removed in favor of ChallengeComposer */}

            <main className="challenges-main">
                <div className="challenges-filters">
                    <div className="search-container">
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search challenges..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <span className="search-icon">🔍</span>
                    </div>

                    <div className="filter-controls">
                        <div className="filter-group">
                            <label>Category:</label>
                            <select
                                className="filter-select"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                            >
                                <option value="all">All Categories</option>
                                <option value="ai">AI</option>
                                <option value="blockchain">Blockchain</option>
                                <option value="web">Web Development</option>
                                <option value="mobile">Mobile</option>
                                <option value="sustainability">Sustainability</option>
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>Sort by:</label>
                            <select
                                className="filter-select"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="trending">Most Trending</option>
                                <option value="recent">Most Recent</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="challenges-grid">
                    {filteredChallenges.map(challenge => (
                        <div
                            key={challenge._id}
                            className={`challenge-card ${newChallengeIds.has(challenge._id) ? 'new-item' : ''}`}
                            onClick={() => navigate(`/challenge/${challenge._id}`)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="challenge-header">
                                <div className="author-info" onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/profile/${challenge.author?._id}`);
                                }} style={{ cursor: 'pointer' }}>
                                    <div className="author-avatar">
                                        {challenge.author?.firstName?.charAt(0) || 'U'}
                                    </div>
                                    <div className="author-details">
                                        <span className="author-name">
                                            {challenge.author?.firstName} {challenge.author?.lastName}
                                        </span>
                                        {challenge.author?._id && <StarBadge userId={challenge.author._id} />}
                                        <span className="challenge-time">{formatDate(challenge.createdAt)}</span>
                                    </div>
                                </div>
                                <div className={`difficulty-badge ${challenge.difficulty?.toLowerCase()}`}>
                                    {challenge.difficulty}
                                </div>
                                <div className="post-type-badge challenge">CHALLENGE</div>
                            </div>

                            <h3 className="challenge-title">{challenge.title}</h3>
                            <p className="challenge-description">{challenge.description}</p>

                            <div className="challenge-tags">
                                {challenge.tags.map(tag => (
                                    <span key={tag} className="tag">{tag}</span>
                                ))}
                            </div>

                            <div className="challenge-stats">
                                <div className="stats-item">
                                    <button
                                        className="vote-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleVote(challenge._id);
                                        }}
                                    >
                                        🔥 {challenge.votes?.length || 0}
                                    </button>
                                </div>
                                <div className="stats-item">
                                    👥 {challenge.participants?.length || 0} participants
                                </div>
                            </div>

                            <div className="challenge-actions">
                                <button
                                    className="join-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleJoinChallenge(challenge._id);
                                    }}
                                >
                                    Join Challenge
                                </button>
                                <button
                                    className="details-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleComments(challenge._id);
                                    }}
                                >

                                    💬 {challenge.comments?.length || 0} Solutions
                                </button>
                            </div>

                            {expandedComments[challenge._id] && (
                                <div className="comments-section" style={{ marginTop: '1rem', borderTop: '1px solid #333', paddingTop: '1rem' }}>
                                    <h4 style={{ marginBottom: '1rem', color: '#00ffaa' }}>Proposed Solutions</h4>
                                    <div className="comment-list">
                                        {challenge.comments && challenge.comments.length > 0 ? (
                                            challenge.comments.map((comment, idx) => (
                                                <div key={idx} className="comment-item">
                                                    <div className="comment-header">
                                                        <span className="post-type-badge solution" style={{ fontSize: '0.7rem', marginRight: '0.5rem' }}>SOLUTION</span>
                                                        <span className="comment-author"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (comment.user?._id) navigate(`/profile/${comment.user._id}`);
                                                            }}
                                                            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                                        >
                                                            {comment.user?.firstName || 'User'}
                                                            {comment.user?._id && <StarBadge userId={comment.user._id} />}
                                                        </span>
                                                        <span className="comment-time">
                                                            {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <p className="comment-text">{comment.text}</p>
                                                    {/* Show Contact/Invite button if Current User is Author AND Commenter allows contact */}
                                                    {(() => {
                                                        const userStr = localStorage.getItem('user');
                                                        if (!userStr) return null;
                                                        const currUser = JSON.parse(userStr);
                                                        const isAuthor = challenge.author?._id === currUser.id || challenge.author === currUser.id; // Check ID match
                                                        const isSelf = comment.user?._id === currUser.id;

                                                        if (isAuthor && !isSelf && comment.allowContact) {
                                                            return (
                                                                <button
                                                                    className="invite-btn"
                                                                    style={{ marginTop: '0.5rem', padding: '0.3rem 0.8rem', fontSize: '0.8rem', background: '#00ccff', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#000' }}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleTeamInvite(challenge._id, comment.user._id);
                                                                    }}
                                                                >
                                                                    ✉️ Contact Solver / Invite
                                                                </button>
                                                            );
                                                        }
                                                        return null;
                                                    })()}
                                                </div>
                                            ))
                                        ) : (
                                            <p className="no-comments">No solutions yet. Be the first to solve this!</p>
                                        )}
                                    </div>
                                    <div className="comment-form" style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                                        <input
                                            type="text"
                                            className="comment-input"
                                            placeholder="Propose a solution..."
                                            value={commentInputs[challenge._id] || ''}
                                            onChange={(e) => {
                                                e.stopPropagation();
                                                handleCommentInputChange(challenge._id, e.target.value);
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            style={{ flex: 1, padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #333', background: '#1a1a1a', color: 'white' }}
                                        />
                                        <button
                                            className="comment-submit-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSubmitComment(challenge._id);
                                            }}
                                            disabled={!commentInputs[challenge._id]?.trim()}
                                            style={{ padding: '0.5rem 1rem', background: '#00ffaa', border: 'none', borderRadius: '0.5rem', color: 'black', fontWeight: 'bold', cursor: 'pointer' }}
                                        >
                                            Post
                                        </button>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem' }}>
                                            <input
                                                type="checkbox"
                                                id={`allow-contact-${challenge._id}`}
                                                checked={commentAllowContact[challenge._id] || false}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    setCommentAllowContact(prev => ({
                                                        ...prev,
                                                        [challenge._id]: e.target.checked
                                                    }));
                                                }}
                                                style={{ cursor: 'pointer' }}
                                            />
                                            <label htmlFor={`allow-contact-${challenge._id}`} style={{ fontSize: '0.8rem', color: '#aaa', cursor: 'pointer' }}>
                                                Allow Contact from Owner
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {filteredChallenges.length === 0 && (
                    <div className="no-challenges">
                        <h3>No challenges found</h3>
                        <p>Be the first to post a challenge!</p>
                    </div>
                )}
            </main>
        </div >
    );
};

export default Challenges;
