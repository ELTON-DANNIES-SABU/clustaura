import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../services/api';
import PostComposer from './PostComposer';
import PostCard from './PostCard';
import NotificationsDropdown from './NotificationsDropdown';
import '../styles.css';

const PostFeed = () => {
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState(null);
    const [activeCommunity, setActiveCommunity] = useState('programming');
    const [trendingCommunities, setTrendingCommunities] = useState([]);

    const communities = [
        { id: 'programming', name: 'Programming', icon: '💻', members: '2.5m', color: '#2EFFC7' },
        { id: 'webdev', name: 'Web Dev', icon: '🌐', members: '1.8m', color: '#FF6B9D' },
        { id: 'reactjs', name: 'ReactJS', icon: '⚛️', members: '950k', color: '#61DAFB' },
        { id: 'javascript', name: 'JavaScript', icon: '📜', members: '3.2m', color: '#F7DF1E' },
        { id: 'uiux', name: 'UI/UX', icon: '🎨', members: '1.2m', color: '#9C6ADE' },
        { id: 'backend', name: 'Backend', icon: '⚙️', members: '890k', color: '#00D8FF' },
        { id: 'ai', name: 'AI & ML', icon: '🧠', members: '1.5m', color: '#FF4D4D' },
        { id: 'cyber', name: 'Cybersecurity', icon: '🛡️', members: '650k', color: '#00FFAA' },
    ];

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

    // Initial Fetch
    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);

            // Fetch posts independently
            try {
                const postsResponse = await api.get('/posts/feed');
                if (postsResponse.data && postsResponse.data.posts) {
                    setPosts(postsResponse.data.posts);
                }
            } catch (error) {
                console.error('Error fetching posts:', error);
                if (error.response?.status === 401) {
                    navigate('/login');
                }
            }

            // Fetch trending communities independently
            try {
                const trendingResponse = await api.get('/communities/trending');
                setTrendingCommunities(trendingResponse.data.communities || communities.slice(0, 4));
            } catch (error) {
                console.warn('Error fetching trending communities (expected if route missing):', error.message);
                setTrendingCommunities(communities.slice(0, 4));
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();

        // Socket.IO Connection
        const newSocket = io('http://localhost:5000');
        setSocket(newSocket);

        return () => newSocket.close();
    }, []);

    // Socket Event Listeners
    useEffect(() => {
        if (!socket) return;

        socket.on('new-post', (newPost) => {
            if (newPost.isHidden) return;
            setPosts(prev => [newPost, ...prev]);
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
        // In a real app, you would fetch posts for this community
        console.log(`Switching to community: ${communityId}`);
    }, []);

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
            // Show success feedback
        } catch (error) {
            console.error('Error bookmarking:', error);
        }
    }, []);

    const handleShare = useCallback((postId) => {
        const url = `${window.location.origin}/post/${postId}`;
        navigator.clipboard.writeText(url);
        // Show toast notification
        console.log('Link copied to clipboard!');
    }, []);

    const LeftSidebar = () => (
        <div className="feed-left-sidebar">
            <div className="sidebar-header">
                <h3>Communities</h3>
                <button className="create-community-btn">
                    <span>+</span> Create
                </button>
            </div>

            <div className="communities-list">
                {communities.map(community => (
                    <button
                        key={community.id}
                        className={`community-item ${activeCommunity === community.id ? 'active' : ''}`}
                        onClick={() => handleCommunitySelect(community.id)}
                    >
                        <div className="community-icon-wrapper">
                            <span
                                className="community-icon"
                                style={{ color: community.color }}
                            >
                                {community.icon}
                            </span>
                            {activeCommunity === community.id && (
                                <div className="active-indicator"></div>
                            )}
                        </div>
                        <div className="community-info">
                            <span className="community-name">r/{community.name}</span>
                            <span className="community-members">{community.members} members</span>
                        </div>
                        {activeCommunity === community.id && (
                            <div className="neon-glow"></div>
                        )}
                    </button>
                ))}
            </div>

            <div className="sidebar-footer">
                <div className="user-stats">
                    <div className="stat-item">
                        <span className="stat-value">42</span>
                        <span className="stat-label">Posts</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">256</span>
                        <span className="stat-label">Upvotes</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">18</span>
                        <span className="stat-label">Following</span>
                    </div>
                </div>
            </div>
        </div>
    );

    const RightSidebar = () => (
        <div className="feed-right-sidebar">
            {/* Community Info Card */}
            <div className="community-info-card">
                <div className="info-card-header">
                    <div className="community-banner">
                        <span className="community-large-icon">
                            {communities.find(c => c.id === activeCommunity)?.icon || '💻'}
                        </span>
                    </div>
                    <div className="community-details">
                        <h3>r/{communities.find(c => c.id === activeCommunity)?.name || 'Programming'}</h3>
                        <p className="community-description">
                            A community for developers to share knowledge, ask questions, and discuss programming topics.
                        </p>
                        <div className="community-stats">
                            <div className="stat">
                                <span className="stat-number">
                                    {communities.find(c => c.id === activeCommunity)?.members || '2.5m'}
                                </span>
                                <span className="stat-label">Members</span>
                            </div>
                            <div className="stat">
                                <span className="stat-number">42k</span>
                                <span className="stat-label">Online</span>
                            </div>
                            <div className="stat">
                                <span className="stat-number">98%</span>
                                <span className="stat-label">Positive</span>
                            </div>
                        </div>
                    </div>
                </div>

                <button className="join-community-btn">
                    <span className="join-icon">+</span>
                    Join Community
                </button>
            </div>

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

            {/* Quick Links */}
            <div className="quick-links-card">
                <h4>Quick Links</h4>
                <div className="links-list">
                    {quickLinks.map((link, index) => (
                        <a
                            key={index}
                            href={link.url}
                            className="link-item"
                            onClick={(e) => {
                                e.preventDefault();
                                navigate(link.url);
                            }}
                        >
                            <span className="link-icon">{link.icon}</span>
                            <span>{link.name}</span>
                        </a>
                    ))}
                </div>
            </div>

            {/* Bookmarks Section */}
            <div className="bookmarks-card">
                <div className="bookmarks-header">
                    <h4>Your Bookmarks</h4>
                    <span className="bookmarks-count">12</span>
                </div>
                <div className="bookmarks-preview">
                    <p className="bookmarks-note">
                        Save interesting posts to access them later
                    </p>
                    <button className="view-bookmarks-btn">
                        View All Bookmarks →
                    </button>
                </div>
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

    const CommunityHighlights = () => (
        <div className="community-highlights">
            <div className="highlights-header">
                <h3>Community Highlights</h3>
                <button className="view-all-highlights">View All →</button>
            </div>
            <div className="highlights-scroll">
                {trendingCommunities.map(community => (
                    <div key={community.id} className="highlight-card">
                        <div
                            className="highlight-icon"
                            style={{
                                background: `linear-gradient(135deg, ${community.color}20, ${community.color}10)`,
                                borderColor: community.color
                            }}
                        >
                            <span style={{ color: community.color }}>{community.icon}</span>
                        </div>
                        <div className="highlight-info">
                            <h4>r/{community.name}</h4>
                            <p>{community.members} members</p>
                        </div>
                        <div className="highlight-trend">
                            <span className="trend-up">↑ 12%</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="post-feed-page">
            {/* Header */}
            <header className="feed-header">
                <div className="header-left">
                    <button className="back-button" onClick={() => navigate('/dashboard')}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M19 12H5M12 19l-7-7 7-7" stroke="#2EFFC7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Dashboard
                    </button>
                    <div className="header-search">
                        <input
                            type="text"
                            placeholder="Search posts, communities, users..."
                            className="search-input"
                        />
                        <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <circle cx="11" cy="11" r="8" stroke="#2EFFC7" strokeWidth="2" />
                            <path d="M21 21l-4.35-4.35" stroke="#2EFFC7" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </div>
                </div>

                <div className="header-center">
                    <h1 className="feed-title">
                        <span className="neon-text">Community Feed</span>
                    </h1>
                    <p className="feed-subtitle">Connect, share, and discover what's happening</p>
                </div>

                <div className="header-right">
                    <NotificationsDropdown socket={socket} />
                    <button className="create-post-btn" onClick={() => navigate('/create-post')}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M12 5v14M5 12h14" stroke="#000" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                        Create Post
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <div className="feed-container">
                {/* Left Sidebar */}
                <LeftSidebar />

                {/* Center Feed */}
                <div className="feed-main-content">
                    <PostComposer />

                    <CommunityHighlights />

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

            {/* Bottom Navigation for Mobile */}
            <div className="feed-mobile-nav">
                <button className="mobile-nav-btn active">
                    <span className="nav-icon">🏠</span>
                    <span className="nav-label">Home</span>
                </button>
                <button className="mobile-nav-btn">
                    <span className="nav-icon">🔥</span>
                    <span className="nav-label">Trending</span>
                </button>
                <button className="mobile-nav-btn create-post-mobile">
                    <span className="nav-icon">+</span>
                </button>
                <button className="mobile-nav-btn">
                    <span className="nav-icon">🔔</span>
                    <span className="nav-label">Notifications</span>
                </button>
                <button className="mobile-nav-btn">
                    <span className="nav-icon">👤</span>
                    <span className="nav-label">Profile</span>
                </button>
            </div>
        </div>
    );
};

export default PostFeed;