import React, { useState, useCallback, useEffect } from 'react';
import {
    Code, PenTool, Database, Cpu, Zap, Server, X,
    TrendingUp, Users, Star, Award, ChevronRight,
    Sparkles, Flame, Hash, Bookmark, Settings,
    HelpCircle, Mail, Github, Twitter, Linkedin,
    ChevronDown, User, Clock, MessageSquare
} from 'lucide-react';
import useCommunityStore from '../../store/communityStore';

const PROFESSIONS = [
    {
        id: 'dev',
        name: 'Developers',
        icon: Code,
        color: '#339933',
        gradient: 'linear-gradient(135deg, #339933 0%, #40c0ff 100%)',
        tags: ['Programming', 'Development', 'Coding', 'Software', 'Engineering', 'DevOps'],
        stats: { members: '12.5k', posts: 345, active: 89 }
    },
    {
        id: 'design',
        name: 'Designers',
        icon: PenTool,
        color: '#ff6b6b',
        gradient: 'linear-gradient(135deg, #ff6b6b 0%, #ffb347 100%)',
        tags: ['Design', 'UI', 'UX', 'Creative', 'Product Design', 'Visuals'],
        stats: { members: '8.2k', posts: 234, active: 56 }
    },
    {
        id: 'data',
        name: 'Data Scientists',
        icon: Database,
        color: '#4ecdc4',
        gradient: 'linear-gradient(135deg, #4ecdc4 0%, #45b7d1 100%)',
        tags: ['Data', 'Analytics', 'Database', 'Big Data', 'Statistics', 'SQL'],
        stats: { members: '6.8k', posts: 189, active: 45 }
    },
    {
        id: 'ai',
        name: 'AI / ML',
        icon: Cpu,
        color: '#a55eea',
        gradient: 'linear-gradient(135deg, #a55eea 0%, #8854d0 100%)',
        tags: ['AI', 'ML', 'Intelligence', 'Gemini', 'Neural Networks', 'Automation'],
        stats: { members: '9.1k', posts: 267, active: 78 }
    },
    {
        id: 'frontend',
        name: 'Frontend',
        icon: Zap,
        color: '#f39c12',
        gradient: 'linear-gradient(135deg, #f39c12 0%, #f1c40f 100%)',
        tags: ['Frontend', 'React', 'HTML', 'CSS', 'JavaScript', 'Web'],
        stats: { members: '15.3k', posts: 456, active: 112 }
    },
    {
        id: 'backend',
        name: 'Backend',
        icon: Server,
        color: '#3498db',
        gradient: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
        tags: ['Backend', 'Node', 'Express', 'API', 'Server', 'Infrastructure'],
        stats: { members: '10.7k', posts: 312, active: 94 }
    },
];

const QUICK_LINKS = [
    { icon: TrendingUp, label: 'Trending', color: '#ff6b6b' },
    { icon: Flame, label: 'Hot Today', color: '#f39c12' },
    { icon: Star, label: 'Top Rated', color: '#f1c40f' },
    { icon: Award, label: 'Expert Picks', color: '#a55eea' },
    { icon: Bookmark, label: 'Saved', color: '#3498db' },
];

const CommunityLeftSidebar = ({ onClose, user }) => {
    const { fetchPosts, setSelectedProfessionTags } = useCommunityStore();
    const [activeId, setActiveId] = useState(null);
    const [hoveredId, setHoveredId] = useState(null);
    const [expandedSection, setExpandedSection] = useState('professions');
    const [showStats, setShowStats] = useState(false);

    useEffect(() => {
        setSelectedProfessionTags([]);
    }, [setSelectedProfessionTags]);

    const handleClear = useCallback(() => {
        setActiveId(null);
        setSelectedProfessionTags([]);
        fetchPosts();
    }, [setSelectedProfessionTags, fetchPosts]);

    const handleProfessionClick = useCallback((prof) => {
        setActiveId(prof.id);
        setSelectedProfessionTags(prof.tags);
        fetchPosts(prof.tags);
    }, [setSelectedProfessionTags, fetchPosts]);

    // Get user initials for avatar
    const getUserInitials = () => {
        if (!user?.name) return 'U';
        return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    // Mock user stats (replace with real data from your store)
    const userStats = {
        posts: user?.stats?.posts || 156,
        reputation: user?.stats?.reputation || '2.4k',
        joined: user?.joinedAt || '2024',
        comments: user?.stats?.comments || 342
    };

    return (
        <div className="community-sidebar-left">
            {onClose && (
                <button className="sidebar-close-btn" onClick={onClose}>
                    <X size={20} />
                </button>
            )}

            {/* Profile Card - Using Real User Data */}
            <div className="sidebar-profile-card">
                <div className="profile-avatar">
                    <span>{getUserInitials()}</span>
                    <span className="profile-status online"></span>
                </div>
                <div className="profile-info">
                    <div className="profile-name">{user?.name || 'User'}</div>
                    <div className="profile-title">{user?.role || 'Developer'}</div>
                    <div className="profile-meta">
                        <span>Joined {userStats.joined}</span>
                    </div>
                </div>
                <div className="profile-stats">
                    <div className="stat-item">
                        <div className="stat-value">{userStats.posts}</div>
                        <div className="stat-label">Posts</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-value">{userStats.reputation}</div>
                        <div className="stat-label">Rep</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-value">{userStats.comments}</div>
                        <div className="stat-label">Comments</div>
                    </div>
                </div>
            </div>

            {/* Quick Stats Row */}
            <div className="quick-stats-row">
                <div className="quick-stat">
                    <Clock size={14} />
                    <span>Active now</span>
                </div>
                <div className="quick-stat">
                    <MessageSquare size={14} />
                    <span>92% response rate</span>
                </div>
            </div>

            {/* Section Tabs */}
            <div className="sidebar-section-tabs">
                <button
                    className={`section-tab ${expandedSection === 'professions' ? 'active' : ''}`}
                    onClick={() => setExpandedSection('professions')}
                >
                    <Users size={14} />
                    <span>Professions</span>
                </button>
                <button
                    className={`section-tab ${expandedSection === 'quicklinks' ? 'active' : ''}`}
                    onClick={() => setExpandedSection('quicklinks')}
                >
                    <Zap size={14} />
                    <span>Quick</span>
                </button>
                <button
                    className={`section-tab ${expandedSection === 'resources' ? 'active' : ''}`}
                    onClick={() => setExpandedSection('resources')}
                >
                    <HelpCircle size={14} />
                    <span>Help</span>
                </button>
            </div>

            {/* Dynamic Content */}
            {expandedSection === 'professions' && (
                <>
                    <div className="section-header">
                        <div className="header-title">
                            <Sparkles className="title-icon" />
                            <h3>Professions</h3>
                        </div>
                        {activeId && (
                            <button className="clear-btn" onClick={handleClear}>
                                Clear
                            </button>
                        )}
                    </div>

                    <ul className="profession-list">
                        {PROFESSIONS.map((prof) => {
                            const Icon = prof.icon;
                            const isActive = activeId === prof.id;
                            const isHovered = hoveredId === prof.id;

                            return (
                                <li key={prof.id} className="profession-item-wrapper">
                                    <div
                                        className={`profession-item ${isActive ? 'is-active' : ''}`}
                                        onClick={() => handleProfessionClick(prof)}
                                        onMouseEnter={() => setHoveredId(prof.id)}
                                        onMouseLeave={() => setHoveredId(null)}
                                    >
                                        <div className="profession-icon-wrapper">
                                            <Icon size={18} className="profession-icon" />
                                        </div>
                                        <div className="profession-info">
                                            <span className="profession-name">{prof.name}</span>
                                            {showStats && (
                                                <div className="profession-stats">
                                                    <span className="stat-badge">
                                                        <Users size={8} />
                                                        {prof.stats.members}
                                                    </span>
                                                    <span className="stat-badge">
                                                        <Zap size={8} />
                                                        {prof.stats.active}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        {isActive && (
                                            <div className="profession-active-indicator">
                                                <div className="indicator-dot" />
                                            </div>
                                        )}
                                        {isHovered && !isActive && (
                                            <ChevronRight size={14} className="hover-arrow" />
                                        )}
                                    </div>

                                    {isHovered && (
                                        <div className="profession-preview">
                                            {prof.tags.slice(0, 3).map(tag => (
                                                <span key={tag} className="preview-tag">
                                                    <Hash size={6} />
                                                    {tag}
                                                </span>
                                            ))}
                                            {prof.tags.length > 3 && (
                                                <span className="preview-more">+{prof.tags.length - 3}</span>
                                            )}
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>

                    <button className="toggle-stats-btn" onClick={() => setShowStats(!showStats)}>
                        {showStats ? 'Hide' : 'Show'} profession stats
                    </button>
                </>
            )}

            {expandedSection === 'quicklinks' && (
                <>
                    <div className="section-header">
                        <div className="header-title">
                            <Zap className="title-icon" />
                            <h3>Quick Links</h3>
                        </div>
                    </div>

                    <ul className="quick-links">
                        {QUICK_LINKS.map((link, idx) => {
                            const Icon = link.icon;
                            return (
                                <li key={idx}>
                                    <a href="#" className="quick-link-item">
                                        <div className="quick-link-icon" style={{ background: `${link.color}15` }}>
                                            <Icon size={14} style={{ color: link.color }} />
                                        </div>
                                        <span className="quick-link-label">{link.label}</span>
                                        <ChevronRight size={12} className="quick-link-arrow" />
                                    </a>
                                </li>
                            );
                        })}
                    </ul>

                    <div className="quick-links-footer">
                        <a href="#" className="settings-link">
                            <Settings size={12} />
                            Customize sidebar
                        </a>
                    </div>
                </>
            )}

            {expandedSection === 'resources' && (
                <>
                    <div className="section-header">
                        <div className="header-title">
                            <HelpCircle className="title-icon" />
                            <h3>Resources</h3>
                        </div>
                    </div>

                    <div className="resources-section">
                        <div className="resource-card">
                            <h4>Community Guidelines</h4>
                            <p>Learn about our community standards</p>
                            <a href="#">Read more →</a>
                        </div>

                        <div className="resource-card">
                            <h4>Getting Started</h4>
                            <p>New here? Check out our guide</p>
                            <a href="#">Learn more →</a>
                        </div>

                        <div className="resource-card">
                            <h4>Expert Program</h4>
                            <p>Become a verified expert</p>
                            <a href="#">Apply now →</a>
                        </div>

                        <div className="support-section">
                            <h4>Need help?</h4>
                            <div className="support-links">
                                <a href="#" className="support-link">
                                    <Mail size={12} />
                                    Contact Support
                                </a>
                                <a href="#" className="support-link">
                                    <HelpCircle size={12} />
                                    FAQ
                                </a>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Footer */}
            <div className="sidebar-footer">
                <div className="social-links">
                    <a href="#" className="social-link">
                        <Github size={14} />
                    </a>
                    <a href="#" className="social-link">
                        <Twitter size={14} />
                    </a>
                    <a href="#" className="social-link">
                        <Linkedin size={14} />
                    </a>
                </div>
                <div className="footer-links">
                    <a href="#">About</a>
                    <span>•</span>
                    <a href="#">Privacy</a>
                    <span>•</span>
                    <a href="#">Terms</a>
                </div>
                <div className="copyright">© 2026 Clustaura</div>
            </div>
        </div>
    );
};

export default React.memo(CommunityLeftSidebar);