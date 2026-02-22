
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PostModal from './PostModal';
import NotificationBell from './NotificationBell';
import Sidebar from './Sidebar';
import ProjectsView from './ProjectsView';
import Friends from './Friends';
import Profile from './Profile';
import AIGuide from './AIGuide';
import '../styles.css';

// SVG Icons
const ChatIcon = () => (
    <svg className="pro-icon" viewBox="0 0 24 24" fill="none">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round" />
    </svg>
);

const NotificationIcon = () => (
    <svg className="pro-icon" viewBox="0 0 24 24" fill="none">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round" />
    </svg>
);

const ThemeIcon = ({ isDark }) => (
    <svg className="pro-icon" viewBox="0 0 24 24">
        {isDark ? (
            <>
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </>
        ) : (
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        )}
    </svg>
);

const LogoutIcon = () => (
    <svg className="pro-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
);

const SearchIcon = () => (
    <svg className="pro-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="11" cy="11" r="8" stroke="#00ffaa" strokeWidth="2" />
        <path d="M21 21l-4.35-4.35" stroke="#00ffaa" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

const HomeIcon = ({ isActive }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
            stroke={isActive ? "#00ffaa" : "currentColor"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round" />
        <polyline points="9 22 9 12 15 12 15 22"
            stroke={isActive ? "#00ffaa" : "currentColor"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round" />
    </svg>
);

const ProjectsIcon = ({ isActive }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
            stroke={isActive ? "#00ffaa" : "currentColor"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round" />
    </svg>
);

const FriendRequestIcon = ({ isActive, hasRequests }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
            stroke={isActive ? "#00ffaa" : "currentColor"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round" />
        <circle cx="8.5" cy="7" r="4"
            stroke={isActive ? "#00ffaa" : "currentColor"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round" />
        <path d="M20 8v6M23 11h-6"
            stroke={isActive ? "#00ffaa" : "currentColor"}
            strokeWidth="2"
            strokeLinecap="round" />
    </svg>
);

const ProfileIcon = ({ isActive }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
            stroke={isActive ? "#00ffaa" : "currentColor"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round" />
        <circle cx="12" cy="7" r="4"
            stroke={isActive ? "#00ffaa" : "currentColor"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round" />
    </svg>
);

const SettingsIcon = ({ isActive }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="3"
            stroke={isActive ? "#00ffaa" : "currentColor"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
            stroke={isActive ? "#00ffaa" : "currentColor"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round" />
    </svg>
);

const PlusIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 5v14M5 12h14"
            stroke="#000"
            strokeWidth="3"
            strokeLinecap="round" />
    </svg>
);

// Dashboard Components
const ChallengesSection = ({
    recentChallenges,
    user,
    expandedComments,
    commentInputs,
    handleChallengesClick,
    loadNews,
    navigate,
    handleVote,
    toggleComments,
    handleShare,
    handleCommentInputChange,
    handleSubmitComment,
    setShowPostModal
}) => (
    <div className="dashboard-section">
        <div className="section-header">
            <h2>Recent Discussions</h2>
            <div className="section-actions">
                <button className="text-btn" onClick={handleChallengesClick}>View All</button>
                <button className="icon-btn" onClick={() => loadNews()}>↻</button>
            </div>
        </div>

        <div className="recent-challenges-list">
            {recentChallenges.length > 0 ? (
                recentChallenges.map(challenge => (
                    <div key={challenge._id} className="forum-card">
                        <div className="forum-header">
                            <div className="forum-author" onClick={() => navigate(`/profile/${challenge.author?._id}`)} style={{ cursor: 'pointer' }}>
                                <div className="author-avatar-small">
                                    {challenge.author?.firstName?.charAt(0) || 'U'}
                                </div>
                                <span className="author-name">
                                    {challenge.author?.firstName} {challenge.author?.lastName}
                                </span>
                                <span className={`difficulty-dot ${challenge.difficulty?.toLowerCase() || 'intermediate'}`} title={challenge.difficulty}></span>
                            </div>
                            <span className="post-time">
                                {new Date(challenge.createdAt).toLocaleDateString()}
                            </span>
                        </div>

                        <h3 className="forum-title">{challenge.title}</h3>
                        <pre className="forum-description">{challenge.description}</pre>

                        <div className="forum-actions">
                            <button
                                className={`action-btn ${challenge.votes?.includes(user?._id) ? 'active' : ''}`}
                                onClick={() => handleVote(challenge._id)}
                            >
                                ❤️ {challenge.votes?.length || 0}
                            </button>
                            <button
                                className="action-btn"
                                onClick={() => toggleComments(challenge._id)}
                            >
                                💬 {challenge.comments?.length || 0} Comments
                            </button>
                            <button
                                className="action-btn"
                                onClick={() => handleShare(challenge._id)}
                            >
                                ↗️ Share
                            </button>
                        </div>

                        {expandedComments[challenge._id] && (
                            <div className="comments-section">
                                <div className="comment-list">
                                    {challenge.comments && challenge.comments.length > 0 ? (
                                        challenge.comments.map((comment, idx) => (
                                            <div key={idx} className="comment-item">
                                                <div className="comment-header">
                                                    <span className="comment-author">
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
                                        <p className="no-comments">No comments yet. Be the first!</p>
                                    )}
                                </div>
                                <div className="comment-form">
                                    <textarea
                                        className="comment-input"
                                        placeholder="Write a comment..."
                                        value={commentInputs[challenge._id] || ''}
                                        onChange={(e) => handleCommentInputChange(challenge._id, e.target.value)}
                                    />
                                    <button
                                        className="comment-submit-btn"
                                        onClick={() => handleSubmitComment(challenge._id)}
                                        disabled={!commentInputs[challenge._id]?.trim()}
                                    >
                                        Post
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))
            ) : (
                <div className="no-data-placeholder">
                    <p>No recent discussions found.</p>
                    <button className="create-btn-small" onClick={() => setShowPostModal(true)}>
                        Start a Discussion
                    </button>
                </div>
            )}
        </div>
    </div>
);

const FooterNavbar = ({ activeNav, setActiveNav, handleFriendsClick, handleProfileClick, friendRequests, setShowPostModal }) => (
    <nav className="footer-navbar">
        <div className="navbar-content">
            <button
                className={`navbar-btn ${activeNav === 'home' ? 'active' : ''}`}
                onClick={() => setActiveNav('home')}
                title="Home"
            >
                <span className="navbar-icon">
                    <HomeIcon isActive={activeNav === 'home'} />
                </span>
                <span className="navbar-label">Home</span>
            </button>

            <button
                className={`navbar-btn ${activeNav === 'projects' ? 'active' : ''}`}
                onClick={() => setActiveNav('projects')}
                title="My Projects"
            >
                <span className="navbar-icon">
                    <ProjectsIcon isActive={activeNav === 'projects'} />
                </span>
                <span className="navbar-label">Projects</span>
            </button>

            <button
                className="navbar-btn navbar-plus-btn"
                onClick={() => setShowPostModal(true)}
                title="Create New Post"
                style={{ position: 'relative', top: '0' }}
            >
                <span className="navbar-icon" style={{ display: 'flex', alignItems: 'center' }}>
                    <PlusIcon />
                </span>
                <span className="navbar-label">Create</span>
            </button>

            <button
                className={`navbar-btn ${activeNav === 'friends' ? 'active' : ''}`}
                onClick={handleFriendsClick}
                title="Friend Requests"
            >
                <span className="navbar-icon">
                    <FriendRequestIcon isActive={activeNav === 'friends'} hasRequests={friendRequests > 0} />
                </span>

                <span className="navbar-label">Requests</span>
            </button>

            <button
                className={`navbar-btn ${activeNav === 'profile' ? 'active' : ''}`}
                onClick={handleProfileClick}
                title="My Profile"
            >
                <span className="navbar-icon">
                    <ProfileIcon isActive={activeNav === 'profile'} />
                </span>
                <span className="navbar-label">Profile</span>
            </button>
        </div>
    </nav>
);

const ChatPanel = ({ showChat, setShowChat, chatMessages, handleSendMessage }) => (
    <div className={`chat-panel ${showChat ? 'active' : ''}`}>
        <div className="chat-header">
            <h3>Messages</h3>
            <button className="close-chat-btn" onClick={() => setShowChat(false)}>
                ×
            </button>
        </div>

        <div className="chat-messages">
            {chatMessages.length === 0 ? (
                <div className="no-messages">
                    <p>No messages yet</p>
                </div>
            ) : (
                chatMessages.map(msg => (
                    <div key={msg.id} className={`chat-message ${msg.sender === 'You' ? 'sent' : 'received'}`}>
                        <div className="message-sender">{msg.sender}</div>
                        <div className="message-content">{msg.message}</div>
                        <div className="message-time">{msg.time}</div>
                        {msg.unread && <div className="unread-dot"></div>}
                    </div>
                ))
            )}
        </div>

        <div className="chat-input-area">
            <input
                type="text"
                id="chat-input"
                className="chat-input"
                placeholder="Type your message..."
                onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                        handleSendMessage();
                    }
                }}
            />
            <button className="send-btn" onClick={handleSendMessage}>
                Send
            </button>
        </div>
    </div>
);

const NotificationsPanel = ({ showNotifications, notificationList, handleMarkAllAsRead, handleClearNotifications, setShowNotifications }) => (
    <div className={`notifications-panel ${showNotifications ? 'active' : ''}`}>
        <div className="notifications-header">
            <h3>Notifications ({notificationList.length})</h3>
            <div className="notification-actions">
                <button className="action-btn" onClick={handleMarkAllAsRead}>
                    Mark all as read
                </button>
                <button className="action-btn clear-btn" onClick={handleClearNotifications}>
                    Clear all
                </button>
                <button className="close-notifications-btn" onClick={() => setShowNotifications(false)}>
                    ×
                </button>
            </div>
        </div>

        <div className="notifications-list">
            {notificationList.length === 0 ? (
                <div className="no-notifications">
                    <p>No notifications</p>
                </div>
            ) : (
                notificationList.map(notif => (
                    <div key={notif.id} className={`notification-item ${notif.read ? 'read' : 'unread'}`}>
                        <div className="notification-icon">🔔</div>
                        <div className="notification-content">
                            <div className="notification-title">{notif.title}</div>
                            <div className="notification-message">{notif.message}</div>
                            <div className="notification-time">{notif.time}</div>
                        </div>
                        {!notif.read && <div className="unread-indicator"></div>}
                    </div>
                ))
            )}
        </div>
    </div>
);

const Dashboard = () => {
    const [darkMode, setDarkMode] = useState(true);
    const [notifications, setNotifications] = useState(3);
    const [messages, setMessages] = useState(2);
    const [friendRequests, setFriendRequests] = useState(2);
    const [currentTime, setCurrentTime] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState({ users: [], challenges: [] });
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [activeNav, setActiveNav] = useState('home');
    const [news, setNews] = useState([]);
    const [newsCategory, setNewsCategory] = useState('all');
    const [lastUpdate, setLastUpdate] = useState('');
    const [postTitle, setPostTitle] = useState('');
    const [postContent, setPostContent] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);
    const [activeLayoutBtn, setActiveLayoutBtn] = useState('challenges');
    const [showPostModal, setShowPostModal] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [notificationList, setNotificationList] = useState([]);

    const navigate = useNavigate();

    useEffect(() => {
        const user = localStorage.getItem('user');
        if (!user) {
            navigate('/login');
        }

        const updateTime = () => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        };

        updateTime();
        const timer = setInterval(updateTime, 60000);

        // Load initial news
        loadNews();

        // Set up auto-refresh every 60 seconds
        const newsTimer = setInterval(() => {
            refreshNews();
        }, 60000);

        // Load friend requests count
        const savedRequests = localStorage.getItem('friendRequests');
        if (savedRequests) {
            const requests = JSON.parse(savedRequests);
            setFriendRequests(requests.length);
        }

        // Load chat messages
        const savedChats = localStorage.getItem('chatMessages');
        if (savedChats) {
            const chats = JSON.parse(savedChats);
            setChatMessages(chats);

            // Update messages count
            const unreadCount = chats.filter(msg => msg.unread).length;
            setMessages(unreadCount);
        } else {
            // Mock chat data
            const mockChats = [
                {
                    id: 1,
                    sender: "Alex Johnson",
                    message: "Hey! I saw your post about React optimization. Can you share the code?",
                    time: "10:30 AM",
                    unread: true
                },
                {
                    id: 2,
                    sender: "Sarah Miller",
                    message: "The meeting is scheduled for 3 PM today",
                    time: "9:45 AM",
                    unread: true
                },
                {
                    id: 3,
                    sender: "Mike Chen",
                    message: "Thanks for helping with the database issue!",
                    time: "Yesterday",
                    unread: false
                }
            ];
            setChatMessages(mockChats);
            localStorage.setItem('chatMessages', JSON.stringify(mockChats));

            // Update messages count
            const unreadCount = mockChats.filter(msg => msg.unread).length;
            setMessages(unreadCount);
        }

        return () => {
            clearInterval(timer);
            clearInterval(newsTimer);
        };
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    const getUser = () => {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    };

    const user = getUser();

    const loadNews = async () => {
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const userData = JSON.parse(userStr);
                const config = {
                    headers: { Authorization: `Bearer ${userData.token}` }
                };

                const { data } = await axios.get('/api/news', config);

                const now = new Date();
                setLastUpdate(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

                // If the user has a category selected, we still filter locally for now 
                // or we could update the backend to handle categories
                const filteredNews = newsCategory === 'all'
                    ? data
                    : data.filter(item => item.category === newsCategory || item.title.toLowerCase().includes(newsCategory.toLowerCase()));

                setNews(filteredNews);
            }
        } catch (error) {
            console.error('Error loading news:', error);
            showNotification('Failed to load real-time news. Using regional tech news.');

            // We don't set mock news anymore as per user request
            // Just keep the existing news or show an empty state
        }
    };

    const refreshNews = () => {
        const now = new Date();
        setLastUpdate(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

        setNews(prevNews => {
            const shuffled = [...prevNews].sort(() => Math.random() - 0.5);
            return shuffled;
        });

        showNotification('News updated with latest stories');
    };

    const showNotification = (message) => {
        console.log('Notification:', message);
        // In a real app, you might use a toast notification library
    };

    const handleNewsCategoryChange = (category) => {
        setNewsCategory(category);
        loadNews();
    };

    // Navigation handlers
    const handlePostsClick = () => {
        navigate('/posts');
    };

    const handleChallengesClick = () => {
        navigate('/challenges');
    };

    const handleProfileClick = () => {
        setActiveNav('profile');
        setShowChat(false);
    };

    const handleFriendsClick = () => {
        setActiveNav('friends');
        setShowChat(false);
    };

    // Layout button handler
    const handleLayoutButtonClick = (buttonName) => {
        setActiveLayoutBtn(buttonName);
        showNotification(`${buttonName} section activated`);

        // Handle navigation for specific buttons
        switch (buttonName) {
            case 'posts':
                handlePostsClick();
                break;
            case 'challenges':
                handleChallengesClick();
                break;
            case 'community':
                navigate('/community');
                break;
            case 'communication':
                navigate('/communication');
                break;
            case 'workplace':
                navigate('/workplace');
                break;
            default:
                break;
        }
    };

    // Problem posting handlers (for the dashboard posting section)
    const handlePostSubmit = async () => {
        if (!postTitle.trim()) {
            alert('Please enter a title for your problem');
            return;
        }
        if (!postContent.trim()) {
            alert('Please enter some content for your problem');
            return;
        }

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

            // Auto-generate title from first 50 chars of content
            const generatedTitle = postContent.length > 50
                ? postContent.substring(0, 50) + '...'
                : postContent;

            const payload = {
                title: postTitle,
                description: postContent,
                tags: selectedTags,
                difficulty: 'Intermediate', // Default for quick posts
                type: 'problem'
            };

            await axios.post('/api/challenges', payload, config);

            // Log for debugging
            console.log('Problem posted to API:', payload);

            // Reset form
            setPostTitle('');
            setPostContent('');
            setSelectedTags([]);

            // Show success message
            showNotification('Problem posted successfully! Check the Challenges page.');

            // Add notification
            const newNotification = {
                id: Date.now(),
                title: "Post Published",
                message: "Your challenge has been posted successfully",
                time: "Just now",
                read: false
            };
            addNotification(newNotification);

        } catch (error) {
            console.error('Error posting challenge:', error);
            showNotification('Failed to post challenge to server.');
        }
    };

    const handleTagSelect = (tag) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter(t => t !== tag));
        } else {
            setSelectedTags([...selectedTags, tag]);
        }
    };

    // Post modal handler
    const handlePostModalSubmit = async (postData) => {
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
                title: postData.title,
                description: postData.content,
                tags: postData.tags,
                type: postData.type, // Sending type if backend supports it
                difficulty: 'Intermediate'
            };

            await axios.post('/api/challenges', payload, config);

            showNotification('Post published successfully!');

            // Refresh challenges list
            const { data } = await axios.get('/api/challenges', config);
            setRecentChallenges(data.slice(0, 10));

            // Add notification
            const newNotification = {
                id: Date.now(),
                title: "Post Published",
                message: `Your ${postData.type} has been posted successfully`,
                time: "Just now",
                read: false
            };
            addNotification(newNotification);

        } catch (error) {
            console.error('Error posting from modal:', error);
            showNotification('Failed to publish post');
        }
    };

    // Chat and Notification handlers
    const handleChatClick = () => {
        setShowChat(!showChat);
        setShowNotifications(false); // Close notifications if open

        if (!showChat) {
            // Mark all messages as read when opening chat
            const updatedChats = chatMessages.map(msg => ({ ...msg, unread: false }));
            setChatMessages(updatedChats);
            localStorage.setItem('chatMessages', JSON.stringify(updatedChats));
            setMessages(0); // Reset badge count
            showNotification('Chat opened');
        }
    };

    const handleNotificationsClick = () => {
        setShowNotifications(!showNotifications);
        setShowChat(false); // Close chat if open

        if (!showNotifications) {
            // Mark all notifications as read when opening
            const updatedNotifications = notificationList.map(notif => ({ ...notif, read: true }));
            setNotificationList(updatedNotifications);
            localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
            setNotifications(0); // Reset badge count
            showNotification('Notifications opened');
        }
    };

    const handleSendMessage = () => {
        const messageInput = document.getElementById('chat-input');
        if (messageInput && messageInput.value.trim()) {
            const newMessage = {
                id: Date.now(),
                sender: "You",
                message: messageInput.value,
                time: "Just now",
                unread: false
            };

            const updatedChats = [...chatMessages, newMessage];
            setChatMessages(updatedChats);
            localStorage.setItem('chatMessages', JSON.stringify(updatedChats));

            // Clear input
            messageInput.value = '';

            // Auto-reply (mock)
            setTimeout(() => {
                const autoReply = {
                    id: Date.now() + 1,
                    sender: "Support",
                    message: "Thanks for your message! We'll get back to you soon.",
                    time: "Just now",
                    unread: true
                };

                const updatedChatsWithReply = [...updatedChats, autoReply];
                setChatMessages(updatedChatsWithReply);
                localStorage.setItem('chatMessages', JSON.stringify(updatedChatsWithReply));

                // Update badge count
                setMessages(prev => prev + 1);

                // Show notification for new message
                if (!showChat) {
                    showNotification('New message from Support');
                }
            }, 1000);
        }
    };

    const handleClearNotifications = () => {
        if (window.confirm('Clear all notifications?')) {
            setNotificationList([]);
            localStorage.setItem('notifications', JSON.stringify([]));
            setNotifications(0);
            setShowNotifications(false);
            showNotification('Notifications cleared');
        }
    };

    const handleMarkAllAsRead = () => {
        const updatedNotifications = notificationList.map(notif => ({ ...notif, read: true }));
        setNotificationList(updatedNotifications);
        localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
        setNotifications(0);
        showNotification('All notifications marked as read');
    };

    const addNotification = (notification) => {
        const updatedNotifications = [notification, ...notificationList];
        setNotificationList(updatedNotifications);
        localStorage.setItem('notifications', JSON.stringify(updatedNotifications));

        // Update badge count if notification is unread
        if (!notification.read) {
            setNotifications(prev => prev + 1);
        }
    };

    // Available tags for problems
    const availableTags = [
        'Programming', 'Design', 'Bug', 'Feature Request',
        'UI/UX', 'Backend', 'Frontend', 'Database',
        'Security', 'Performance', 'Documentation', 'Other'
    ];


    const toggleTheme = () => {
        setDarkMode(!darkMode);
    };

    // State for recent challenges
    const [recentChallenges, setRecentChallenges] = useState([]);
    const [expandedComments, setExpandedComments] = useState({}); // Tracking which challenge has comments open
    const [commentInputs, setCommentInputs] = useState({}); // Tracking inputs for each challenge

    // Fetch challenges on mount
    useEffect(() => {
        const fetchRecentChallenges = async () => {
            try {
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    const userData = JSON.parse(userStr);
                    const token = userData.token;
                    const config = {
                        headers: { Authorization: `Bearer ${token}` }
                    };

                    const { data } = await axios.get('/api/challenges', config);
                    // Take top 10 for the global feed
                    setRecentChallenges(data.slice(0, 10));
                }
            } catch (error) {
                console.error('Error fetching recent challenges:', error);
            }
        };

        fetchRecentChallenges();
    }, []);

    // Helper functions for forum interactions

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

    const handleVote = async (challengeId) => {
        try {
            const userStr = localStorage.getItem('user');
            const userData = JSON.parse(userStr);
            const token = userData.token;
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };

            await axios.put(`/api/challenges/${challengeId}/vote`, {}, config);

            // Optimistically update UI or re-fetch
            const { data } = await axios.get('/api/challenges', config);
            setRecentChallenges(data.slice(0, 10));
        } catch (error) {
            console.error('Error voting:', error);
        }
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

            await axios.post(`/api/challenges/${challengeId}/comments`, { text }, config);

            // Clear input and refresh
            setCommentInputs(prev => ({ ...prev, [challengeId]: '' }));
            const { data } = await axios.get('/api/challenges', config);
            setRecentChallenges(data.slice(0, 10));
            showNotification('Comment posted!');
        } catch (error) {
            console.error('Error posting comment:', error);
            showNotification('Failed to post comment');
        }
    };

    const handleShare = (challengeId) => {
        const url = `${window.location.origin}/challenges/${challengeId}`; // Assuming route exists
        navigator.clipboard.writeText(url);
        showNotification('Link copied to clipboard!');
    };

    // Search handlers
    useEffect(() => {
        const performSearch = async () => {
            if (searchQuery.trim().length > 1) {
                try {
                    const userStr = localStorage.getItem('user');
                    if (userStr) {
                        const userData = JSON.parse(userStr);
                        const token = userData.token;
                        const config = { headers: { Authorization: `Bearer ${token}` } };

                        const { data } = await axios.get(`/api/search?q=${searchQuery}`, config);
                        setSearchResults(data);
                        setShowSearchResults(true);
                    }
                } catch (error) {
                    console.error('Search error:', error);
                }
            } else {
                setSearchResults({ users: [], challenges: [] });
                setShowSearchResults(false);
            }
        };

        const timer = setTimeout(performSearch, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSearchResultClick = (type, id) => {
        setShowSearchResults(false);
        setSearchQuery('');

        if (type === 'user') {
            navigate(`/profile/${id}`);
        } else if (type === 'challenge') {
            navigate(`/challenge/${id}`);
        }
    };






    return (
        <div className={`dashboard-layout ${darkMode ? '' : 'light'}`}>
            <header className="pro-header">
                <div className="pro-header-content">
                    <div className="pro-logo">
                        <div className="logo-animation-container">
                            <div className="logo-pulse-ring"></div>
                            <div className="logo-pulse-ring delay-1"></div>
                            <div className="logo-pulse-ring delay-2"></div>
                            <div className="pro-logo-icon">C</div>
                        </div>
                        <div className="pro-logo-text">CLUSTAURA</div>
                    </div>

                    <div className="pro-search-container">
                        <div className="pro-search-bar">
                            <input
                                type="text"
                                className="pro-search-input"
                                placeholder="Search challenges, users, or topics..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => searchQuery.length > 1 && setShowSearchResults(true)}
                            />
                            <SearchIcon />
                        </div>

                        {showSearchResults && (searchResults.users.length > 0 || searchResults.challenges.length > 0) && (
                            <div className="search-results-dropdown">
                                {searchResults.users.length > 0 && (
                                    <div className="search-section">
                                        <h4>People</h4>
                                        {searchResults.users.map(user => (
                                            <div
                                                key={user._id}
                                                className="search-result-item"
                                                onClick={() => handleSearchResultClick('user', user._id)}
                                            >
                                                <div className="result-icon">👤</div>
                                                <div className="result-info">
                                                    <div className="result-title">{user.firstName} {user.lastName}</div>
                                                    <div className="result-subtitle">{user.email}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {searchResults.challenges.length > 0 && (
                                    <div className="search-section">
                                        <h4>Challenges</h4>
                                        {searchResults.challenges.map(challenge => (
                                            <div
                                                key={challenge._id}
                                                className="search-result-item"
                                                onClick={() => handleSearchResultClick('challenge', challenge._id)}
                                            >
                                                <div className="result-icon">🏆</div>
                                                <div className="result-info">
                                                    <div className="result-title">{challenge.title}</div>
                                                    <div className="result-subtitle">
                                                        {challenge.difficulty} • by {challenge.author?.firstName}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Click outside handler overlay */}
                        {showSearchResults && (
                            <div
                                className="search-overlay"
                                onClick={() => setShowSearchResults(false)}
                                style={{
                                    position: 'fixed',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    zIndex: 90,
                                    background: 'transparent'
                                }}
                            />
                        )}
                    </div>

                    <div className="pro-icons-container">
                        <div className="pro-user-profile">
                            <div className="pro-user-avatar">
                                {user?.firstName?.charAt(0) || 'U'}
                            </div>
                            <div className="pro-user-info">
                                <div className="user-name-visible">
                                    {user?.firstName || 'User'}
                                </div>
                                <div className="user-email-visible">
                                    {user?.email || 'user@example.com'}
                                </div>
                            </div>
                        </div>

                        <button
                            className="pro-icon-btn"
                            onClick={handleLogout}
                            title="Logout"
                        >
                            <LogoutIcon />
                        </button>
                    </div>
                </div>
            </header>

            <main className="dashboard-main">
                <div className="dashboard-wrapper">
                    <Sidebar
                        activeLayout={activeLayoutBtn}
                        onLayoutChange={handleLayoutButtonClick}
                    />

                    <div className={`dashboard-container ${activeNav !== 'home' ? 'full-width' : ''}`}>
                        {activeNav === 'home' ? (
                            <>
                                {/* Left Section - Problem Posting (Blue Area) */}
                                <div className="posting-section">
                                    <div className="posting-card">
                                        <h2 className="posting-title">Post a Problem Statement</h2>
                                        <p className="posting-subtitle">Share a specific challenge or technical hurdle to get expert help and feedback.</p>

                                        <div className="posting-form">
                                            <div className="form-group">
                                                <label htmlFor="problem-title" className="form-label">
                                                    Problem Title
                                                </label>
                                                <input
                                                    type="text"
                                                    id="problem-title"
                                                    className="posting-input"
                                                    placeholder="E.g., How to optimize React context re-renders?"
                                                    value={postTitle}
                                                    onChange={(e) => setPostTitle(e.target.value)}
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label htmlFor="problem-description" className="form-label">
                                                    Detail your Challenge
                                                </label>
                                                <textarea
                                                    id="problem-description"
                                                    className="posting-textarea"
                                                    placeholder="Provide technical details, what you've tried, and what help you need..."
                                                    value={postContent}
                                                    onChange={(e) => setPostContent(e.target.value)}
                                                    rows={6}
                                                />
                                                <div className="textarea-counter">
                                                    {postContent.length}/1000 characters
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label className="form-label">
                                                    Tags (Select relevant categories)
                                                </label>
                                                <div className="tags-container">
                                                    {availableTags.map(tag => (
                                                        <button
                                                            key={tag}
                                                            className={`tag-btn ${selectedTags.includes(tag) ? 'selected' : ''}`}
                                                            onClick={() => handleTagSelect(tag)}
                                                        >
                                                            {tag}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="posting-actions">
                                                <button
                                                    className="posting-submit-btn"
                                                    onClick={handlePostSubmit}
                                                    disabled={!postContent.trim() || !postTitle.trim()}
                                                >
                                                    Post Challenge
                                                </button>
                                                <button
                                                    className="posting-cancel-btn"
                                                    onClick={() => {
                                                        setPostTitle('');
                                                        setPostContent('');
                                                        setSelectedTags([]);
                                                    }}
                                                >
                                                    Clear
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="recent-posts">
                                        <h3 className="recent-posts-title">
                                            Global Activity Feed

                                        </h3>
                                        <div className="recent-posts-list">
                                            {recentChallenges.length > 0 ? (
                                                recentChallenges.map(challenge => (
                                                    <div key={challenge._id} className="recent-post-item">
                                                        <div className="recent-post-header">
                                                            <span className="recent-post-author">
                                                                {challenge.author?.firstName || 'User'}
                                                            </span>
                                                            <span className="recent-post-time">
                                                                {new Date(challenge.createdAt).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        <p className="recent-post-content">{challenge.title}</p>
                                                        <div className="recent-post-tags">
                                                            {challenge.tags && challenge.tags.slice(0, 2).map((tag, index) => (
                                                                <span key={index} className="recent-post-tag">{tag}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="no-messages">
                                                    <p>No challenges yet.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Section - Live News Feed (Yellow Area) */}
                                <div className="news-feed-section">
                                    <div className="news-feed-header">
                                        <h2 className="news-feed-title">
                                            <span className="live-indicator"></span>
                                            Trending Tech News
                                        </h2>
                                        <div className="news-feed-actions">
                                            <button
                                                className="news-refresh-btn"
                                                onClick={refreshNews}
                                                title="Refresh News"
                                            >

                                            </button>
                                            <div className="last-update">
                                                Updated: {lastUpdate}
                                            </div>
                                        </div>
                                    </div>


                                    <div className="news-feed-list">
                                        {news.map(item => (
                                            <div
                                                key={item.id}
                                                className="news-item"
                                                onClick={() => item.url && window.open(item.url, '_blank')}
                                                style={{ cursor: item.url ? 'pointer' : 'default' }}
                                            >
                                                <div className="news-item-top">
                                                    <h3 className="news-item-title">{item.title}</h3>
                                                    {item.trending && (
                                                        <div className="trending-badge">
                                                            Trending
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="news-item-time">{item.time}</div>

                                                <p className="news-item-description">{item.description}</p>

                                                <div className="news-item-footer">
                                                    <span className="news-item-source">{item.source}</span>
                                                    <span className="news-item-category">{item.category}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="news-feed-footer">
                                        <p className="news-feed-note">
                                            News automatically refreshes every 60 seconds
                                        </p>
                                    </div>
                                </div>
                            </>
                        ) : activeNav === 'projects' ? (
                            <ProjectsView />
                        ) : activeNav === 'friends' ? (
                            <div className="section-fade-in">
                                <Friends />
                            </div>
                        ) : activeNav === 'profile' ? (
                            <div className="section-fade-in">
                                <Profile />
                            </div>
                        ) : null}
                    </div>
                </div>
            </main>

            <FooterNavbar
                activeNav={activeNav}
                setActiveNav={setActiveNav}
                handleFriendsClick={handleFriendsClick}
                handleProfileClick={handleProfileClick}
                friendRequests={friendRequests}
                setShowPostModal={setShowPostModal}
            />

            {/* Overlay for panels */}
            {showChat && <div className="panel-overlay" onClick={() => setShowChat(false)}></div>}

            {/* Chat Panel */}
            <ChatPanel
                showChat={showChat}
                setShowChat={setShowChat}
                chatMessages={chatMessages}
                handleSendMessage={handleSendMessage}
            />

            <NotificationsPanel
                showNotifications={showNotifications}
                notificationList={notificationList}
                handleMarkAllAsRead={handleMarkAllAsRead}
                handleClearNotifications={handleClearNotifications}
                setShowNotifications={setShowNotifications}
            />

            {/* Post Modal */}
            <PostModal
                isOpen={showPostModal}
                onClose={() => setShowPostModal(false)}
                onSubmit={handlePostModalSubmit}
            />

        </div>
    );
};

export default Dashboard;
