
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import NotificationBell from './NotificationBell';
import '../styles.css';

const Friends = () => {
    const [friendRequests, setFriendRequests] = useState([]);
    const [friends, setFriends] = useState([]);
    const [activeTab, setActiveTab] = useState('requests');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const navigate = useNavigate();

    const getToken = () => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const userData = JSON.parse(userStr);
            return userData.token;
        }
        return null;
    };

    const fetchFriends = async () => {
        try {
            const token = getToken();
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.get('http://localhost:5000/api/friends', config);
            setFriends(data);
        } catch (error) {
            console.error('Error fetching friends:', error);
        }
    };

    const fetchFriendRequests = async () => {
        try {
            const token = getToken();
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.get('http://localhost:5000/api/friends/requests', config);
            setFriendRequests(data);
        } catch (error) {
            console.error('Error fetching friend requests:', error);
        }
    };

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            navigate('/login');
            return;
        }
        fetchFriends();
        fetchFriendRequests();
    }, [navigate]);

    // Perform search when typing (debounced or just on change for now)
    useEffect(() => {
        const performSearch = async () => {
            if (activeTab === 'suggested' && searchQuery.trim()) {
                try {
                    setIsSearching(true);
                    const token = getToken();
                    const config = { headers: { Authorization: `Bearer ${token}` } };
                    const { data } = await axios.get(`http://localhost:5000/api/friends/search?query=${searchQuery}`, config);
                    setSearchResults(data);
                } catch (error) {
                    console.error('Error searching users:', error);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
            }
        };

        const timer = setTimeout(performSearch, 500);
        return () => clearTimeout(timer);
    }, [searchQuery, activeTab]);

    const handleAcceptRequest = async (requestId) => {
        try {
            const token = getToken();
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.put(`http://localhost:5000/api/friends/accept/${requestId}`, {}, config);

            alert('Friend request accepted!');
            fetchFriends();
            fetchFriendRequests();
        } catch (error) {
            console.error('Error accepting request:', error);
            alert(error.response?.data?.message || 'Failed to accept request');
        }
    };

    const handleRejectRequest = async (requestId) => {
        try {
            const token = getToken();
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.put(`http://localhost:5000/api/friends/reject/${requestId}`, {}, config);

            alert('Friend request declined.');
            fetchFriendRequests();
        } catch (error) {
            console.error('Error rejecting request:', error);
            alert('Failed to reject request');
        }
    };

    const handleRemoveFriend = async (friendId) => {
        if (window.confirm('Are you sure you want to remove this friend?')) {
            try {
                const token = getToken();
                const config = { headers: { Authorization: `Bearer ${token}` } };
                await axios.delete(`http://localhost:5000/api/friends/${friendId}`, config);

                alert('Friend removed successfully.');
                fetchFriends();
            } catch (error) {
                console.error('Error removing friend:', error);
                alert('Failed to remove friend');
            }
        }
    };

    const handleSendRequest = async (userId) => {
        try {
            const token = getToken();
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.post(`http://localhost:5000/api/friends/request/${userId}`, {}, config);

            alert('Friend request sent!');
            // Refresh search results to update status
            const { data } = await axios.get(`http://localhost:5000/api/friends/search?query=${searchQuery}`, config);
            setSearchResults(data);
        } catch (error) {
            console.error('Error sending request:', error);
            alert(error.response?.data?.message || 'Failed to send request');
        }
    };

    const handleMessageFriend = (friend) => {
        navigate(`/chat/${friend._id}`);
    };

    const handleBackToDashboard = () => {
        navigate('/dashboard');
    };

    // Filter local lists for tabs other than 'suggested'
    const filteredFriends = friends.filter(friend =>
        `${friend.firstName} ${friend.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        friend.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredRequests = friendRequests.filter(request =>
        `${request.firstName} ${request.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getInitials = (firstName, lastName) => {
        return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`;
    };

    return (
        <div className="friends-page">
            <header className="friends-header">
                <button className="back-button" onClick={handleBackToDashboard}>
                    ← Back to Dashboard
                </button>
                <div className="header-content">
                    <h1>🤝 Friends & Connections</h1>
                    <p>Manage your connections and collaborate with like-minded professionals</p>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>

                </div>
            </header>

            <main className="friends-main">
                <div className="friends-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
                        onClick={() => setActiveTab('requests')}
                    >
                        Friend Requests
                        {friendRequests.length > 0 && (
                            <span className="tab-badge">{friendRequests.length}</span>
                        )}
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'friends' ? 'active' : ''}`}
                        onClick={() => setActiveTab('friends')}
                    >
                        My Friends ({friends.length})
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'suggested' ? 'active' : ''}`}
                        onClick={() => setActiveTab('suggested')}
                    >
                        Find People
                    </button>
                </div>

                <div className="search-section">
                    <input
                        type="text"
                        className="friends-search"
                        placeholder={activeTab === 'suggested' ? "Type to search users..." : "Search in current list..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <circle cx="11" cy="11" r="8" stroke="#00ffaa" strokeWidth="2" />
                        <path d="M21 21l-4.35-4.35" stroke="#00ffaa" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </div>

                {activeTab === 'requests' && (
                    <div className="requests-section">
                        <h2>Pending Friend Requests ({friendRequests.length})</h2>

                        {friendRequests.length === 0 ? (
                            <div className="empty-state">
                                <p>No pending friend requests</p>
                            </div>
                        ) : (
                            <div className="requests-list">
                                {filteredRequests.map(request => (
                                    <div key={request._id} className="request-card">
                                        <div className="request-header" onClick={() => navigate(`/profile/${request._id}`)} style={{ cursor: 'pointer' }}>
                                            <div className="user-avatar">
                                                {getInitials(request.firstName, request.lastName)}
                                            </div>
                                            <div className="user-info">
                                                <h3>{request.firstName} {request.lastName}</h3>
                                                <p>{request.email}</p>
                                            </div>
                                        </div>

                                        <div className="request-footer">
                                            <div className="request-actions">
                                                <button
                                                    className="accept-btn"
                                                    onClick={() => handleAcceptRequest(request._id)}
                                                >
                                                    Accept
                                                </button>
                                                <button
                                                    className="reject-btn"
                                                    onClick={() => handleRejectRequest(request._id)}
                                                >
                                                    Decline
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'friends' && (
                    <div className="friends-list-section">
                        <h2>My Friends ({filteredFriends.length})</h2>

                        {filteredFriends.length === 0 ? (
                            <div className="empty-state">
                                <p>No friends found</p>
                            </div>
                        ) : (
                            <div className="friends-grid">
                                {filteredFriends.map(friend => (
                                    <div key={friend._id} className="friend-card">
                                        <div className="friend-header" onClick={() => navigate(`/profile/${friend._id}`)} style={{ cursor: 'pointer' }}>
                                            <div className="user-avatar status-indicator">
                                                <div className="status-dot online"></div>
                                                {getInitials(friend.firstName, friend.lastName)}
                                            </div>
                                            <div className="user-info">
                                                <h3>{friend.firstName} {friend.lastName}</h3>
                                                <p>{friend.email}</p>
                                            </div>
                                        </div>

                                        <div className="friend-actions">
                                            <button
                                                className="message-btn"
                                                onClick={() => handleMessageFriend(friend)}
                                            >
                                                Message
                                            </button>
                                            <button
                                                className="remove-btn"
                                                onClick={() => handleRemoveFriend(friend._id)}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'suggested' && (
                    <div className="suggested-section">
                        <h2>Find Connections</h2>
                        <p className="suggested-description">
                            Search for people by name or email
                        </p>

                        {!searchQuery && (
                            <div className="suggested-empty">
                                <p>Start typing to search for users...</p>
                            </div>
                        )}

                        {searchQuery && searchResults.length === 0 && !isSearching && (
                            <div className="suggested-empty">
                                <p>No users found matching "{searchQuery}"</p>
                            </div>
                        )}

                        <div className="friends-grid">
                            {searchResults.map(user => (
                                <div key={user._id} className="friend-card">
                                    <div className="friend-header" onClick={() => navigate(`/profile/${user._id}`)} style={{ cursor: 'pointer' }}>
                                        <div className="user-avatar">
                                            {getInitials(user.firstName, user.lastName)}
                                        </div>
                                        <div className="user-info">
                                            <h3>{user.firstName} {user.lastName}</h3>
                                            <p>{user.email}</p>
                                        </div>
                                    </div>

                                    <div className="friend-actions">
                                        {user.isFriend ? (
                                            <button className="message-btn" disabled>Already Friends</button>
                                        ) : user.isRequested ? (
                                            <button className="message-btn" disabled>Request Sent</button>
                                        ) : (
                                            <button
                                                className="accept-btn"
                                                onClick={() => handleSendRequest(user._id)}
                                                style={{ width: '100%' }}
                                            >
                                                Add Friend
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Friends;
