import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
    Search, Menu, X, ChevronRight, Sparkles, Bell, Settings,
    Home, TrendingUp as TrendingUpIcon, Clock, Users, PlusCircle,
    Globe, Zap
} from 'lucide-react';
import useCommunityStore from '../../store/communityStore';
import Feed from './Feed';
import PostDetail from './PostDetail';
import CreatePost from './CreatePost';
import CommunityLeftSidebar from './CommunityLeftSidebar';
import CommunityRightSidebar from './CommunityRightSidebar';
import { ToastProvider, useToast } from './shared/Toast';
import './Community.css';

const CommunityInner = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { fetchCommunities, fetchPosts, getLoggedInUser } = useCommunityStore();
    const toast = useToast();
    const user = getLoggedInUser();

    const [search, setSearch] = useState('');
    const [sidebarLeftOpen, setSidebarLeftOpen] = useState(false);
    const [sidebarRightOpen, setSidebarRightOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
    const debounceTimer = useRef(null);
    const searchRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setShowSearchSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearchChange = useCallback((e) => {
        const value = e.target.value;
        setSearch(value);
        setShowSearchSuggestions(value.length > 0);

        clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            fetchPosts(null, value);
        }, 300);
    }, [fetchPosts]);

    const handleSearchFocus = useCallback(() => {
        if (search.length > 0) {
            setShowSearchSuggestions(true);
        }
    }, [search]);

    const handleLogoClick = useCallback(() => {
        navigate('/dashboard');
    }, [navigate]);

    const handleCreateClick = useCallback(() => {
        navigate('/community/create');
    }, [navigate]);

    const closeSidebarLeft = useCallback(() => setSidebarLeftOpen(false), []);
    const closeSidebarRight = useCallback(() => setSidebarRightOpen(false), []);

    useEffect(() => {
        fetchCommunities();
        fetchPosts();
        return () => clearTimeout(debounceTimer.current);
    }, [fetchCommunities, fetchPosts]);

    const searchSuggestions = [
        { type: 'tag', text: 'react', count: 234 },
        { type: 'tag', text: 'javascript', count: 567 },
        { type: 'tag', text: 'python', count: 189 },
        { type: 'challenge', text: 'How to optimize React performance?', author: 'john_doe' },
        { type: 'challenge', text: 'Building a scalable API with Node.js', author: 'jane_smith' },
    ];

    const navItems = [
        { path: '/community', label: 'Home', icon: Home },
        { path: '/community/trending', label: 'Trending', icon: TrendingUpIcon, badge: 24 },
        { path: '/community/latest', label: 'Latest', icon: Clock },
        { path: '/community/experts', label: 'Experts', icon: Users },
    ];

    // Get user initials for avatar
    const getUserInitials = () => {
        if (!user?.name) return 'U';
        return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <div className="community-container">
            <div className="community-bg">
                <div className="bg-orb bg-orb-1"></div>
                <div className="bg-orb bg-orb-2"></div>
                <div className="bg-orb bg-orb-3"></div>
                <div className="bg-grid"></div>
            </div>

            <header className={`community-header ${isScrolled ? 'community-header--scrolled' : ''}`}>
                <div className="header-container">
                    {/* Left section with logo and navigation - all top-aligned */}
                    <div className="header-left">
                        <button
                            className="sidebar-toggle"
                            onClick={() => setSidebarLeftOpen(!sidebarLeftOpen)}
                            aria-label="Toggle left sidebar"
                        >
                            <Menu size={20} />
                        </button>

                        <div className="brand-logo" onClick={handleLogoClick} role="button" tabIndex={0}>
                            <div className="brand-logo-container">
                                <div className="brand-logo-icon">
                                    <span className="brand-logo-icon-inner">C</span>
                                </div>
                                <span className="brand-logo-text">CLUSTAURA</span>
                            </div>
                        </div>

                        {/* Desktop navigation */}
                        <nav className="desktop-nav">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.path;
                                return (
                                    <a
                                        key={item.path}
                                        href={item.path}
                                        className={`nav-link ${isActive ? 'active' : ''}`}
                                    >
                                        <Icon size={16} />
                                        <span>{item.label}</span>
                                        {item.badge && <span className="nav-badge">{item.badge}</span>}
                                    </a>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Center section with search - positioned to the right of logo */}
                    <div className="header-center" ref={searchRef}>
                        <div className="search-wrapper">
                            <div className="search-input-wrapper">
                                <Search className="search-icon" />
                                <input
                                    type="search"
                                    placeholder="Search challenges, tags, or experts..."
                                    value={search}
                                    onChange={handleSearchChange}
                                    onFocus={handleSearchFocus}
                                />
                                {search && (
                                    <button className="search-clear" onClick={() => setSearch('')}>
                                        <X size={14} />
                                    </button>
                                )}
                            </div>

                            {showSearchSuggestions && (
                                <div className="search-suggestions">
                                    <div className="suggestions-header">
                                        <span>Suggestions</span>
                                        <Sparkles size={10} />
                                    </div>
                                    {searchSuggestions.map((suggestion, idx) => (
                                        <div key={idx} className="suggestion-item">
                                            {suggestion.type === 'tag' ? (
                                                <>
                                                    <span className="suggestion-tag">#{suggestion.text}</span>
                                                    <span className="suggestion-count">{suggestion.count} posts</span>
                                                </>
                                            ) : (
                                                <div className="suggestion-challenge">
                                                    <span className="challenge-title">{suggestion.text}</span>
                                                    <span className="challenge-author">by @{suggestion.author}</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    <div className="suggestions-footer">
                                        Press Enter to search all
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right section - User menu and actions - top-aligned */}
                    <div className="header-right">
                        {/* Create Challenge Button - Prominent */}
                        <button
                            className="create-challenge-btn"
                            onClick={handleCreateClick}
                        >
                            <PlusCircle size={18} />
                            <span>Create</span>
                        </button>

                        <button className="icon-button notification-btn">
                            <Bell size={18} />
                            <span className="notification-badge">3</span>
                        </button>

                        <button className="icon-button">
                            <Settings size={18} />
                        </button>

                        <div className="user-menu">
                            <div className="user-avatar">
                                {getUserInitials()}
                            </div>
                            <div className="user-info">
                                <span className="user-name">{user?.name || 'User'}</span>
                                <span className="user-role">Developer</span>
                            </div>
                            <ChevronRight size={14} className="user-menu-arrow" />
                        </div>

                        <button
                            className="sidebar-toggle right"
                            onClick={() => setSidebarRightOpen(!sidebarRightOpen)}
                            aria-label="Toggle right sidebar"
                        >
                            <Menu size={20} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Global Challenges Banner - Optimized */}
            <div className="global-challenges-banner">
                <div className="banner-container">
                    <div className="banner-content">
                        <div className="banner-icon">
                            <Globe size={24} />
                        </div>
                        <div className="banner-text">
                            <h2>Global Challenges</h2>
                            <p>Discover solutions from developers worldwide</p>
                        </div>
                        <div className="banner-stats">
                            <div className="stat-item">
                                <Zap size={16} />
                                <span>1,234 active</span>
                            </div>
                            <div className="stat-item">
                                <Users size={16} />
                                <span>5.6k experts</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div
                className={`sidebar-overlay ${sidebarLeftOpen ? 'is-open' : ''}`}
                onClick={closeSidebarLeft}
            />
            <div
                className={`sidebar-overlay ${sidebarRightOpen ? 'is-open' : ''}`}
                onClick={closeSidebarRight}
            />

            <main className="community-main">
                <aside className={`sidebar-left-wrapper ${sidebarLeftOpen ? 'is-open' : ''}`}>
                    <CommunityLeftSidebar
                        onClose={closeSidebarLeft}
                        user={user}
                    />
                </aside>

                <div className="community-content">
                    <Routes>
                        <Route path="/" element={<Feed onToast={toast} />} />
                        <Route path="/post/:postId" element={<PostDetail onToast={toast} />} />
                        <Route path="/create" element={<CreatePost onToast={toast} />} />
                    </Routes>
                </div>

                <aside className={`sidebar-right-wrapper ${sidebarRightOpen ? 'is-open' : ''}`}>
                    <CommunityRightSidebar
                        onToast={toast}
                        onClose={closeSidebarRight}
                        user={user}
                    />
                </aside>
            </main>

            <button className="mobile-fab" onClick={handleCreateClick}>
                <PlusCircle size={24} />
            </button>
        </div>
    );
};

const Community = () => (
    <ToastProvider>
        <CommunityInner />
    </ToastProvider>
);

export default Community;