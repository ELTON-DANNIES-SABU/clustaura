import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
    Menu, X, ChevronRight, Sparkles, Bell, Settings,
    Home, TrendingUp as TrendingUpIcon, Clock, Users, PlusCircle,
    Globe, Zap
} from 'lucide-react';
import useCommunityStore from '../../store/communityStore';
import Feed from './Feed';
import PostDetail from './PostDetail';
import CommunityLeftSidebar from './CommunityLeftSidebar';
import CommunityRightSidebar from './CommunityRightSidebar';
import CreatePostModal from './CreatePostModal';
import { ToastProvider, useToast } from './shared/Toast';
import './Community.css';

const CommunityInner = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { communities, fetchCommunities, fetchPosts, getLoggedInUser } = useCommunityStore();
    const toast = useToast();
    const user = getLoggedInUser();

    useEffect(() => {
        if (!user || !user.token) {
            navigate('/login');
        }
    }, [user, navigate]);

    const [sidebarLeftOpen, setSidebarLeftOpen] = useState(false);
    const [sidebarRightOpen, setSidebarRightOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const debounceTimer = useRef(null);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogoClick = useCallback(() => {
        // Logo no longer redirects to home/dashboard per request
    }, []);

    const handleCreateClick = useCallback(() => {
        console.log('✅ handleCreateClick called - opening modal');
        setIsCreateModalOpen(true);
    }, []);

    const closeSidebarLeft = useCallback(() => setSidebarLeftOpen(false), []);
    const closeSidebarRight = useCallback(() => setSidebarRightOpen(false), []);

    const query = new URLSearchParams(location.search);
    const activeCommunityId = query.get('community');
    const activeCommunity = communities.find(c => c._id === activeCommunityId || c.slug === activeCommunityId);

    useEffect(() => {
        fetchCommunities();
        fetchPosts(null, '', activeCommunity?._id);
        return () => clearTimeout(debounceTimer.current);
    }, [fetchCommunities, fetchPosts, activeCommunity?._id]);

    const navItems = [];

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

                    {/* Right section - User menu and actions - top-aligned */}
                    <div className="header-right">
                        <button
                            className="icon-button create-challenge-btn"
                            onClick={handleCreateClick}
                            title="Create new challenge"
                            style={{
                                background: 'linear-gradient(135deg, #339933, #40c0ff)',
                                color: 'white',
                                marginRight: '8px'
                            }}
                        >
                            <PlusCircle size={18} />
                        </button>

                        <button className="icon-button notification-btn">
                            <Bell size={18} />
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
                        community={activeCommunity}
                    />
                </aside>

                <div className="community-content">
                    <Routes>
                        <Route path="/" element={
                            <Feed
                                onToast={toast}
                                activeCommunityId={activeCommunity?._id}
                                onOpenCreateModal={handleCreateClick}
                            />
                        } />
                        <Route path="/post/:postId" element={<PostDetail onToast={toast} />} />
                    </Routes>
                </div>

                <aside className={`sidebar-right-wrapper ${sidebarRightOpen ? 'is-open' : ''}`}>
                    <CommunityRightSidebar
                        onToast={toast}
                        onClose={closeSidebarRight}
                        user={user}
                        activeCommunityId={activeCommunity?._id}
                        onOpenCreateModal={handleCreateClick}
                    />
                </aside>
            </main>

            {/* Floating Action Button for creating new challenge */}
            <button className="mobile-fab" onClick={handleCreateClick} aria-label="Create new challenge">
                <PlusCircle size={24} />
            </button>

            {/* Professional Challenge Creation Modal */}
            <CreatePostModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onToast={toast}
                activeCommunityId={activeCommunity?._id}
            />
        </div>
    );
};

const Community = () => (
    <ToastProvider>
        <CommunityInner />
    </ToastProvider>
);

export default Community;