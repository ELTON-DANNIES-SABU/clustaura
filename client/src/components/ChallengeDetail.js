
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import NotificationBell from './NotificationBell';
import '../styles.css';

const ChallengeDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [challenge, setChallenge] = useState(null);
    const [loading, setLoading] = useState(true);
    const [commentInput, setCommentInput] = useState('');
    const [allowContact, setAllowContact] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    const handleContactSolver = async (solverId) => {
        try {
            const userStr = localStorage.getItem('user');
            const { token } = JSON.parse(userStr);
            const config = { headers: { Authorization: `Bearer ${token}` } };

            await axios.post(`http://localhost:5000/api/challenges/${id}/invite`, { solverId }, config);
            alert('Invitation sent to solver!');
        } catch (error) {
            console.error('Error inviting solver:', error);
            alert('Failed to send invitation');
        }
    };

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            navigate('/login');
            return;
        }
        const userData = JSON.parse(userStr);
        setCurrentUser(userData);
        fetchChallengeDetail();
    }, [id, navigate]);

    const fetchChallengeDetail = async () => {
        try {
            const userStr = localStorage.getItem('user');
            const userData = JSON.parse(userStr);
            const token = userData.token;
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            };

            const { data } = await axios.get(`/api/challenges/${id}`, config);
            setChallenge(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching challenge:', error);
            setLoading(false);
        }
    };

    const handleVote = async () => {
        try {
            const userStr = localStorage.getItem('user');
            const userData = JSON.parse(userStr);
            const token = userData.token;
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };

            await axios.put(`/api/challenges/${id}/vote`, {}, config);
            fetchChallengeDetail(); // Refresh to see updated vote count
        } catch (error) {
            console.error('Error voting:', error);
        }
    };

    const handleJoinChallenge = async () => {
        try {
            const userStr = localStorage.getItem('user');
            const userData = JSON.parse(userStr);
            const token = userData.token;
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };

            await axios.put(`/api/challenges/${id}/join`, {}, config);
            alert('You have successfully joined the challenge!');
            fetchChallengeDetail();
        } catch (error) {
            console.error('Error joining:', error);
            alert(error.response?.data?.message || 'Failed to join challenge');
        }
    };

    const handleSubmitComment = async (e) => {
        e.preventDefault();
        if (!commentInput.trim()) return;

        try {
            const userStr = localStorage.getItem('user');
            const userData = JSON.parse(userStr);
            const token = userData.token;
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };

            await axios.post(`http://localhost:5000/api/challenges/${id}/comments`, { text: commentInput }, config);
            setCommentInput('');
            setAllowContact(false);
            fetchChallengeDetail(); // Refresh to show new comment
        } catch (error) {
            console.error('Error posting comment:', error);
            alert('Failed to post comment');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (loading) {
        return (
            <div className="challenge-detail-page">
                <div className="loading-spinner">Loading challenge...</div>
            </div>
        );
    }

    if (!challenge) {
        return (
            <div className="challenge-detail-page">
                <div className="error-message">Challenge not found</div>
                <button className="back-button" onClick={() => navigate('/challenges')}>
                    ← Back to Challenges
                </button>
            </div>
        );
    }

    const hasVoted = challenge.votes?.includes(currentUser?._id);
    const hasJoined = challenge.participants?.some(p => p._id === currentUser?._id);

    const handleBackdropClick = (e) => {
        // Only close if clicking the backdrop itself, not the content
        if (e.target === e.currentTarget) {
            navigate('/challenges');
        }
    };

    return (
        <div className="challenge-detail-page" onClick={handleBackdropClick}>
            <main className="challenge-detail-main">
                <div className="challenge-detail-container">
                    {/* Challenge Header */}
                    <header className="challenge-detail-header">
                        <button className="back-button" onClick={() => navigate('/challenges')}>
                            ← Back to Challenges
                        </button>

                    </header>

                    {/* Scrollable Content Wrapper */}
                    <div className="challenge-detail-content-wrapper">
                        {/* Challenge Header Section */}
                        <div className="challenge-detail-header-section">
                            <div className="challenge-meta">
                                <div className="author-info">
                                    <div className="author-avatar-large">
                                        {challenge.author?.firstName?.charAt(0) || 'U'}
                                    </div>
                                    <div className="author-details">
                                        <span className="author-name">
                                            {challenge.author?.firstName} {challenge.author?.lastName}
                                        </span>
                                        <span className="challenge-date">{formatDate(challenge.createdAt)}</span>
                                    </div>
                                </div>
                                <div className={`difficulty-badge ${challenge.difficulty?.toLowerCase()}`}>
                                    {challenge.difficulty}
                                </div>
                            </div>

                            <h1 className="challenge-detail-title">{challenge.title}</h1>

                            <div className="challenge-tags">
                                {challenge.tags?.map(tag => (
                                    <span key={tag} className="tag">{tag}</span>
                                ))}
                            </div>
                        </div>

                        {/* Challenge Description */}
                        <div className="challenge-detail-description">
                            <h2>Challenge Description</h2>
                            <p>{challenge.description}</p>
                        </div>

                        {/* Challenge Stats & Actions */}
                        <div className="challenge-detail-stats">
                            <div className="stats-row">
                                <div className="stat-item">
                                    <span className="stat-icon">🔥</span>
                                    <span className="stat-value">{challenge.votes?.length || 0}</span>
                                    <span className="stat-label">Votes</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-icon">👥</span>
                                    <span className="stat-value">{challenge.participants?.length || 0}</span>
                                    <span className="stat-label">Participants</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-icon">💬</span>
                                    <span className="stat-value">{challenge.comments?.length || 0}</span>
                                    <span className="stat-label">Comments</span>
                                </div>
                            </div>

                            <div className="action-buttons">
                                <button
                                    className={`vote-btn-large ${hasVoted ? 'voted' : ''}`}
                                    onClick={handleVote}
                                >
                                    {hasVoted ? '🔥 Voted' : '🔥 Vote'}
                                </button>
                                <button
                                    className={`join-btn-large ${hasJoined ? 'joined' : ''}`}
                                    onClick={handleJoinChallenge}
                                    disabled={hasJoined}
                                >
                                    {hasJoined ? '✓ Joined' : 'Join Challenge'}
                                </button>
                            </div>
                        </div>



                        {/* Comments Section */}
                        <div className="comments-section-detail">
                            <h2>Discussion (Solutions) ({challenge.comments?.length || 0})</h2>

                            {/* Comment Form */}
                            <form className="comment-form-detail" onSubmit={handleSubmitComment}>
                                <div className="current-user-avatar">
                                    {currentUser?.firstName?.charAt(0) || 'U'}
                                </div>
                                <div className="comment-input-wrapper" style={{ width: '100%' }}>
                                    <input
                                        type="text"
                                        className="comment-input-detail"
                                        placeholder="Share your solution..."
                                        value={commentInput}
                                        onChange={(e) => setCommentInput(e.target.value)}
                                    />
                                    <div className="comment-options" style={{ marginTop: '10px' }}>
                                        <label className="checkbox-container">
                                            <input
                                                type="checkbox"
                                                checked={allowContact}
                                                onChange={(e) => setAllowContact(e.target.checked)}
                                            />
                                            <span className="checkmark"></span>
                                            Allow challenge owner to contact me
                                        </label>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    className="comment-submit-btn-detail"
                                    disabled={!commentInput.trim()}
                                >
                                    Share Solution
                                </button>
                            </form>

                            {/* Comments List */}
                            <div className="comments-list-detail">
                                {challenge.comments && challenge.comments.length > 0 ? (
                                    challenge.comments.map((comment, idx) => (
                                        <div key={idx} className="comment-item-detail">
                                            <div className="comment-avatar">
                                                {comment.user?.firstName?.charAt(0) || 'U'}
                                            </div>
                                            <div className="comment-content">
                                                <div className="comment-header-detail">
                                                    <span className="comment-author">
                                                        {comment.user?.firstName} {comment.user?.lastName}
                                                    </span>
                                                    <span className="comment-time">
                                                        {formatDate(comment.createdAt)} at {formatTime(comment.createdAt)}
                                                    </span>
                                                </div>
                                                <p className="comment-text">{comment.text}</p>

                                                {/* Author Actions */}
                                                {currentUser?._id === challenge.author?._id &&
                                                    comment.user?._id !== currentUser._id &&
                                                    comment.allowContact && (
                                                        <button
                                                            className="contact-solver-btn"
                                                            onClick={() => handleContactSolver(comment.user._id)}
                                                        >
                                                            🤝 Contact Solver
                                                        </button>
                                                    )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="no-comments-detail">No solutions yet. Be the first to solve this!</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ChallengeDetail;
