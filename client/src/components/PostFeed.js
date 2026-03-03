import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../services/api';
import useCommunityStore from '../store/communityStore';
import PostComposer from './PostComposer';
import PostCard from './PostCard';
import NotificationsDropdown from './NotificationsDropdown';
import CreateCommunityModal from './Community/CreateCommunityModal';
import '../styles.css';

const PostFeed = () => {
    const navigate = useNavigate();
    const { communities, fetchCommunities } = useCommunityStore();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState(null);
    const [activeCommunity, setActiveCommunity] = useState(null);
    const [isCreateCommunityOpen, setIsCreateCommunityOpen] = useState(false);
    const [isComposerOpen, setIsComposerOpen] = useState(false);

    const communityRules = [
        'Be respectful and professional',
        'No spam or self-promotion',
        'Keep discussions relevant',
        'Cite sources when sharing info',
        'No harassment or hate speech',
        'Follow platform guidelines'
    ];

    const quickLinks = [
        { name: 'Developer Resources', icon: '📚', url: '/resources' },
        { name: 'Code Snippets', icon: '💾', url: '/snippets' },
        { name: 'Job Board', icon: '💼', url: '/jobs' },
        { name: 'Events & Meetups', icon: '📅', url: '/events' },
    ];

    // Handle logo click to navigate to dashboard
    const handleLogoClick = useCallback(() => {
        navigate('/dashboard');
    }, [navigate]);

    const fetchInitialData = useCallback(async (communityId = null) => {
        setLoading(true);
        try {
            const url = communityId ? `/posts/feed?communityId=${communityId}` : '/posts/feed';
            const postsResponse = await api.get(url);
            if (postsResponse.data && postsResponse.data.posts) {
                setPosts(postsResponse.data.posts);
            }
        } catch (error) {
            console.error('Error fetching posts:', error);
            if (error.response?.status === 401) {
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    // Fetch posts when active community changes
    useEffect(() => {
        fetchInitialData(activeCommunity);
    }, [activeCommunity, fetchInitialData]);

    // Initial Fetch (Communities only)
    useEffect(() => {
        fetchCommunities();

        // Socket.IO Connection
        const newSocket = io('http://localhost:5000');
        setSocket(newSocket);

        return () => newSocket.close();
    }, [navigate, fetchInitialData, fetchCommunities]);

    // Socket Event Listeners
    useEffect(() => {
        if (!socket) return;

        socket.on('new-post', (newPost) => {
            if (newPost.isHidden) return;

            // Real-time filter: Only add to list if it matches active community (or we are on global feed)
            if (!activeCommunity || (newPost.community && (newPost.community._id === activeCommunity || newPost.community === activeCommunity))) {
                setPosts(prev => [newPost, ...prev]);
            }
        });

        socket.on('post-updated', (updatedData) => {
            setPosts(prev => prev.map(post => {
                if (post._id === updatedData.postId) {
                    if (updatedData.action === 'like') {
                        return { ...post, likes: updatedData.likes };
                    } else if (updatedData.action === 'comment') {
                        return { ...post, comments: [...(post.comments || []), updatedData.comment] };
                    } else if (updatedData.action === 'share') {
                        return { ...post, shares: updatedData.shares };
                    }
                }
                return post;
            }));
        });

        return () => {
            socket.off('new-post');
            socket.off('post-updated');
        };
    }, [socket]);

    const handleCommunitySelect = useCallback((communityId) => {
        setActiveCommunity(communityId);
    }, []);

    // Set default active community to null (Global Feed)
    useEffect(() => {
        if (activeCommunity === undefined) {
            setActiveCommunity(null);
        }
    }, [activeCommunity]);

    const handleUpvote = useCallback(async (postId) => {
        try {
            const response = await api.post(`/posts/${postId}/upvote`);
            if (socket) {
                socket.emit('post-update', {
                    postId,
                    action: 'like',
                    likes: response.data.likes
                });
            }
        } catch (error) {
            console.error('Error upvoting:', error);
        }
    }, [socket]);

    const handleBookmark = useCallback(async (postId) => {
        try {
            await api.post(`/posts/${postId}/bookmark`);
        } catch (error) {
            console.error('Error bookmarking:', error);
        }
    }, []);

    const handleShare = useCallback((postId) => {
        const url = `${window.location.origin}/post/${postId}`;
        navigator.clipboard.writeText(url);
    }, []);

    const handleJoinCommunity = useCallback(async (slug) => {
        try {
            await api.post(`/community/communities/${slug}/join`);
            fetchCommunities(); // Update UI
        } catch (error) {
            console.error('Error joining community:', error);
            alert('Failed to join community. Are you logged in?');
        }
    }, [fetchCommunities]);

    const handleLeaveCommunity = useCallback(async (slug) => {
        try {
            await api.post(`/community/communities/${slug}/leave`);
            fetchCommunities(); // Update UI
        } catch (error) {
            console.error('Error leaving community:', error);
            alert('Failed to leave community.');
        }
    }, [fetchCommunities]);

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user._id || user.id;

    const currentComm = communities.find(c => c._id === activeCommunity);
    const isMember = currentComm?.members?.flat().includes(userId);

    const LeftSidebar = () => (
        <div className="feed-left-sidebar">
            <div className="sidebar-header">
                <h3>Communities</h3>
                <button className="create-community-btn" onClick={() => setIsCreateCommunityOpen(true)}>
                    <span>+</span> Create
                </button>
            </div>

            <div className="communities-list">
                <button
                    className={`community-item ${activeCommunity === null ? 'active' : ''}`}
                    onClick={() => handleCommunitySelect(null)}
                >
                    <div className="community-icon-wrapper">
                        <span className="community-icon" style={{ color: 'var(--accent-neon)' }}>🌐</span>
                        {activeCommunity === null && <div className="active-indicator"></div>}
                    </div>
                    <div className="community-info">
                        <span className="community-name">Global Feed</span>
                        <span className="community-members">All communities</span>
                    </div>
                    {activeCommunity === null && <div className="neon-glow"></div>}
                </button>

                {communities && communities.length > 0 ? (
                    communities.map(community => (
                        <button
                            key={community._id}
                            className={`community-item ${activeCommunity === community._id ? 'active' : ''}`}
                            onClick={() => handleCommunitySelect(community._id)}
                        >
                            <div className="community-icon-wrapper">
                                <span
                                    className="community-icon"
                                    style={{ color: community.color || '#2EFFC7' }}
                                >
                                    {community.icon || '💻'}
                                </span>
                                {activeCommunity === community._id && (
                                    <div className="active-indicator"></div>
                                )}
                            </div>
                            <div className="community-info">
                                <span className="community-name">r/{community.name}</span>
                                <span className="community-members">{(community.memberCount || 0).toLocaleString()} members</span>
                            </div>
                            {activeCommunity === community._id && (
                                <div className="neon-glow"></div>
                            )}
                        </button>
                    ))
                ) : (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No communities found
                    </div>
                )}
            </div>


        </div>
    );

    const RightSidebar = () => (
        <div className="feed-right-sidebar">
            {communities && communities.length > 0 && activeCommunity && (
                <div className="community-info-card">
                    <div className="info-card-header">
                        <div className="community-banner">
                            <span className="community-large-icon">
                                {currentComm?.icon || '💻'}
                            </span>
                        </div>
                        <div className="community-details">
                            <h3>r/{currentComm?.name || 'Programming'}</h3>
                            <p className="community-description">
                                {currentComm?.description || 'A community for developers to share knowledge, ask questions, and discuss programming topics.'}
                            </p>
                            <div className="community-stats">
                                <div className="stat">
                                    <span className="stat-number">
                                        {(currentComm?.members?.length || 0).toLocaleString()}
                                    </span>
                                    <span className="stat-label">Members</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-number">{currentComm?.onlineCount || '0'}</span>
                                    <span className="stat-label">Online</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-number">{currentComm?.positiveScore || '100%'}</span>
                                    <span className="stat-label">Positive</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button
                        className={`join-community-btn ${isMember ? 'joined' : ''}`}
                        onClick={() => isMember ? handleLeaveCommunity(currentComm.slug) : handleJoinCommunity(currentComm.slug)}
                    >
                        <span className="join-icon">{isMember ? '✓' : '+'}</span>
                        {isMember ? 'Joined' : 'Join Community'}
                    </button>
                </div>
            )}

            {/* Community Rules */}
            <div className="rules-card">
                <h4>Community Rules</h4>
                <ul className="rules-list">
                    {communityRules.map((rule, index) => (
                        <li key={index} className="rule-item">
                            <span className="rule-number">0{index + 1}</span>
                            <span>{rule}</span>
                        </li>
                    ))}
                </ul>
            </div>


            {/* Trending Tags */}
            <div className="trending-tags">
                <h4>Trending Tags</h4>
                <div className="tags-cloud">
                    {['React', 'TypeScript', 'NextJS', 'AI', 'CSS', 'Backend', 'Security', 'DevOps'].map(tag => (
                        <span key={tag} className="trending-tag">
                            #{tag}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div className="post-feed-page">
            {/* Professional Header */}
            <header className="feed-header glass-panel">
                <div className="header-left">
                    <div className="brand-logo" onClick={handleLogoClick}>
                        <div className="brand-logo-icon">C</div>
                        <span className="brand-logo-text">CLUSTAURA</span>
                    </div>
                </div>


            </header>

            {/* Clustaura Logo Container (Reserved for brand positioning) */}
            <div className="feed-logo-container">
            </div>

            {/* Main Content */}
            <div className="feed-container">
                {/* Left Sidebar */}
                <LeftSidebar />

                {/* Center Feed */}
                <div className="feed-main-content">
                    {isComposerOpen && (
                        <PostComposer
                            isActive={isComposerOpen}
                            setIsActive={setIsComposerOpen}
                            onSuccess={fetchInitialData}
                            defaultCommunity={activeCommunity}
                        />
                    )}

                    <div className="inline-post-prompt glass-panel" onClick={() => setIsComposerOpen(true)}>
                        <div className="avatar-circle">U</div>
                        <input type="text" placeholder="Share something with the community..." readOnly />
                    </div>

                    {loading ? (
                        <div className="loading-state">
                            <div className="loading-spinner"></div>
                            <p>Loading feed...</p>
                        </div>
                    ) : (
                        <div className="posts-list">
                            {posts.map(post => (
                                <PostCard
                                    key={post._id}
                                    post={post}
                                    onUpvote={handleUpvote}
                                    onBookmark={handleBookmark}
                                    onShare={handleShare}
                                />
                            ))}
                            {posts.length === 0 && (
                                <div className="empty-state">
                                    <div className="empty-icon">📭</div>
                                    <h3>No posts yet</h3>
                                    <p>Be the first to share something with the community!</p>
                                    <button className="create-first-post-btn">
                                        Create First Post
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Sidebar */}
                <RightSidebar />
            </div>

            <CreateCommunityModal
                isOpen={isCreateCommunityOpen}
                onClose={() => setIsCreateCommunityOpen(false)}
                onSuccess={(newComm) => {
                    fetchCommunities();
                    setActiveCommunity(newComm._id);
                    alert(`Community "r/${newComm.name}" created!`);
                }}
            />
        </div>
    );
};

export default PostFeed;