
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import NotificationBell from './NotificationBell';
import '../styles.css';

const Challenges = () => {
    const [challenges, setChallenges] = useState([]);
    const [filteredChallenges, setFilteredChallenges] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [category, setCategory] = useState('all');
    const [sortBy, setSortBy] = useState('trending');
    const [expandedComments, setExpandedComments] = useState({});
    const [commentInputs, setCommentInputs] = useState({});

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

    // Fetch challenges from backend
    const fetchChallenges = async () => {
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
            } else {
                navigate('/login');
            }
        } catch (error) {
            console.error('Error fetching challenges:', error);
        }
    };

    useEffect(() => {
        fetchChallenges();
    }, [navigate]);

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

            await axios.post('http://localhost:5000/api/challenges', payload, config);

            setShowCreateModal(false);
            setNewChallenge({ title: '', description: '', tags: '', difficulty: 'Intermediate' });
            alert('Challenge posted successfully!');
            fetchChallenges(); // Refresh list

        } catch (error) {
            console.error('Error creating challenge:', error);
            alert('Failed to create challenge.');
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
            fetchChallenges(); // Refresh to see updated vote count
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
            fetchChallenges();
        } catch (error) {
            console.error('Error joining:', error);
            alert(error.response?.data?.message || 'Failed to join challenge');
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
        if (!text || !text.trim()) return;

        try {
            const userStr = localStorage.getItem('user');
            const userData = JSON.parse(userStr);
            const token = userData.token;
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };

            await axios.post(`http://localhost:5000/api/challenges/${challengeId}/comments`, { text }, config);

            // Clear input and refresh
            setCommentInputs(prev => ({ ...prev, [challengeId]: '' }));
            const { data } = await axios.get('http://localhost:5000/api/challenges', config);
            setChallenges(data); // Refresh main list to show new comment

            // Re-apply filters if needed (simple way: rely on useEffect to re-filter)
            setFilteredChallenges(data);
            alert('Comment posted!');
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

                    <button className="join-btn" onClick={() => setShowCreateModal(true)}>
                        + Post Challenge
                    </button>
                </div>
            </header>

            {/* Create Challenge Modal */}
            {
                showCreateModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h2>Post a New Challenge</h2>
                            <form onSubmit={handleCreateChallenge}>
                                <div className="form-group">
                                    <label>Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={newChallenge.title}
                                        onChange={(e) => setNewChallenge({ ...newChallenge, title: e.target.value })}
                                        className="modal-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea
                                        required
                                        rows="4"
                                        value={newChallenge.description}
                                        onChange={(e) => setNewChallenge({ ...newChallenge, description: e.target.value })}
                                        className="modal-textarea"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Tags (comma separated)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. AI, React, Sustainability"
                                        value={newChallenge.tags}
                                        onChange={(e) => setNewChallenge({ ...newChallenge, tags: e.target.value })}
                                        className="modal-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Difficulty</label>
                                    <select
                                        value={newChallenge.difficulty}
                                        onChange={(e) => setNewChallenge({ ...newChallenge, difficulty: e.target.value })}
                                        className="modal-select"
                                    >
                                        <option>Beginner</option>
                                        <option>Intermediate</option>
                                        <option>Advanced</option>
                                        <option>Expert</option>
                                    </select>
                                </div>
                                <div className="modal-actions">
                                    <button type="button" className="cancel-btn" onClick={() => setShowCreateModal(false)}>Cancel</button>
                                    <button type="submit" className="submit-btn">Post Challenge</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

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
                            className="challenge-card"
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
                                        <span className="challenge-time">{formatDate(challenge.createdAt)}</span>
                                    </div>
                                </div>
                                <div className={`difficulty-badge ${challenge.difficulty?.toLowerCase()}`}>
                                    {challenge.difficulty}
                                </div>
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
                                    💬 {challenge.comments?.length || 0} Comments
                                </button>
                            </div>

                            {expandedComments[challenge._id] && (
                                <div className="comments-section" style={{ marginTop: '1rem', borderTop: '1px solid #333', paddingTop: '1rem' }}>
                                    <div className="comment-list">
                                        {challenge.comments && challenge.comments.length > 0 ? (
                                            challenge.comments.map((comment, idx) => (
                                                <div key={idx} className="comment-item">
                                                    <div className="comment-header">
                                                        <span className="comment-author"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (comment.user?._id) navigate(`/profile/${comment.user._id}`);
                                                            }}
                                                            style={{ cursor: 'pointer' }}
                                                        >
                                                            {comment.user?.firstName || 'User'}
                                                        </span>
                                                        <span className="comment-time">
                                                            {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <p className="comment-text">{comment.text}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="no-comments">No comments yet.</p>
                                        )}
                                    </div>
                                    <div className="comment-form" style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                                        <input
                                            type="text"
                                            className="comment-input"
                                            placeholder="Write a comment..."
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
