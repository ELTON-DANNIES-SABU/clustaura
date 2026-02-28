import React, { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useCommunityStore from '../../store/communityStore';
import {
    TrendingUp, MessageSquare, PlusCircle, Globe, Award,
    Flame, Zap, Users, Rocket, ChevronRight, Star,
    Clock, Trophy, Medal, Crown, Sparkles, X
} from 'lucide-react';
import RecommendedExperts from './RecommendedExperts';

const CommunityRightSidebar = ({ onToast, onClose }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { posts } = useCommunityStore();
    const [activeTab, setActiveTab] = useState('trending');

    const match = location.pathname.match(/\/community\/post\/(.+)/);
    const currentPostId = match ? match[1] : null;

    const challenges = useMemo(() => {
        if (!posts) return [];
        return [...posts]
            .map(post => ({
                ...post,
                score: (post.votes * 3) + (post.commentCount * 5) + (new Date(post.timestamp).getTime() / 100000)
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);
    }, [posts]);

    const topChallenges = useMemo(() => {
        if (!posts) return [];
        return [...posts]
            .sort((a, b) => b.votes - a.votes)
            .slice(0, 5);
    }, [posts]);

    const risingChallenges = useMemo(() => {
        if (!posts) return [];
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return [...posts]
            .filter(post => new Date(post.timestamp) > oneDayAgo)
            .sort((a, b) => (b.commentCount * 2 + b.votes) - (a.commentCount * 2 + a.votes))
            .slice(0, 5);
    }, [posts]);

    const handleInvite = () => {
        onToast?.('✨ Invitation sent to expert!', 'success');
    };

    const getRankIcon = (index) => {
        if (index === 0) return <Crown size={12} style={{ color: '#ffd700' }} />;
        if (index === 1) return <Medal size={12} style={{ color: '#c0c0c0' }} />;
        if (index === 2) return <Medal size={12} style={{ color: '#cd7f32' }} />;
        return null;
    };

    const getRankClass = (index) => {
        if (index === 0) return 'gold';
        if (index === 1) return 'silver';
        if (index === 2) return 'bronze';
        return '';
    };

    const getCurrentChallenges = () => {
        switch (activeTab) {
            case 'trending': return challenges;
            case 'top': return topChallenges;
            case 'rising': return risingChallenges;
            default: return challenges;
        }
    };

    return (
        <div className="community-sidebar-right">
            {onClose && (
                <button className="sidebar-close-btn" onClick={onClose}>
                    <X size={20} />
                </button>
            )}

            {currentPostId && (
                <RecommendedExperts
                    challengeId={currentPostId}
                    onInvite={handleInvite}
                />
            )}

            {/* Stats Card */}
            <div className="stats-card">
                <div className="stats-header">
                    <div className="stats-icon">
                        <Globe size={20} color="white" />
                    </div>
                    <h3>Global Stats</h3>
                </div>

                <div className="stats-grid">
                    <div className="stat-box">
                        <div className="value">{posts?.length || 0}</div>
                        <div className="label">Challenges</div>
                    </div>
                    <div className="stat-box">
                        <div className="value">{posts?.reduce((acc, p) => acc + p.commentCount, 0) || 0}</div>
                        <div className="label">Solutions</div>
                    </div>
                </div>

                <div className="active-developers">
                    <span>Active Developers</span>
                    <span>
                        <Users size={14} />
                        {Math.floor(Math.random() * 500) + 1000}
                    </span>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="tab-nav">
                <button
                    className={`tab-btn ${activeTab === 'trending' ? 'active' : ''}`}
                    onClick={() => setActiveTab('trending')}
                >
                    <Flame size={14} />
                    Trending
                </button>
                <button
                    className={`tab-btn ${activeTab === 'top' ? 'active' : ''}`}
                    onClick={() => setActiveTab('top')}
                >
                    <Trophy size={14} />
                    Top
                </button>
                <button
                    className={`tab-btn ${activeTab === 'rising' ? 'active' : ''}`}
                    onClick={() => setActiveTab('rising')}
                >
                    <Rocket size={14} />
                    Rising
                </button>
            </div>

            {/* Challenge List */}
            <div className="stats-card">
                <div className="stats-header">
                    <h3 style={{ fontSize: '11px' }}>
                        {activeTab === 'trending' && 'Trending Challenges'}
                        {activeTab === 'top' && 'Top Challenges'}
                        {activeTab === 'rising' && 'Rising Challenges'}
                    </h3>
                    <span className="stat-label">Live</span>
                </div>

                <div className="challenge-list">
                    {getCurrentChallenges().map((challenge, index) => (
                        <div
                            key={challenge.id}
                            className="challenge-item"
                            onClick={() => navigate(`/community/post/${challenge.id}`)}
                        >
                            <div className="challenge-rank" />
                            <div className="challenge-content">
                                <div className={`rank-number ${getRankClass(index)}`}>
                                    {getRankIcon(index)}
                                    {index + 1}
                                </div>
                                <div className="challenge-info">
                                    <div className="challenge-title">{challenge.title}</div>
                                    <div className="challenge-meta">
                                        <span className="meta-item">
                                            <MessageSquare size={8} />
                                            {challenge.commentCount}
                                        </span>
                                        <span className="meta-item">
                                            <TrendingUp size={8} />
                                            {challenge.votes}
                                        </span>
                                        <span className="meta-item">
                                            <Clock size={8} />
                                            {new Date(challenge.timestamp).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                {activeTab === 'trending' && (
                                    <span className="score-badge trending">
                                        {challenge.score ? Math.round(challenge.score / 1000) : '🔥'}
                                    </span>
                                )}
                                {activeTab === 'top' && (
                                    <span className="score-badge top">
                                        {challenge.votes} pts
                                    </span>
                                )}
                                {activeTab === 'rising' && (
                                    <span className="score-badge rising">
                                        +{challenge.commentCount}
                                    </span>
                                )}
                            </div>
                            {challenge.tags && challenge.tags.length > 0 && (
                                <div className="challenge-tags">
                                    {challenge.tags.slice(0, 2).map(tag => (
                                        <span key={tag} className="tag-mini">
                                            #{tag}
                                        </span>
                                    ))}
                                    {challenge.tags.length > 2 && (
                                        <span className="tag-mini">+{challenge.tags.length - 2}</span>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}

                    {getCurrentChallenges().length === 0 && (
                        <div className="empty-state-small">
                            <Rocket size={24} />
                            <p>No challenges yet</p>
                        </div>
                    )}
                </div>

                {getCurrentChallenges().length > 0 && (
                    <button className="load-more-btn" onClick={() => setActiveTab('trending')}>
                        View All
                        <ChevronRight size={12} />
                    </button>
                )}
            </div>

            {/* Top Contributors */}
            <div className="stats-card">
                <div className="stats-header">
                    <Award size={16} style={{ color: '#ffd700' }} />
                    <h3 style={{ fontSize: '11px' }}>Top Contributors</h3>
                </div>

                <div className="contributors-list">
                    {[1, 2, 3].map((_, i) => (
                        <div key={i} className="contributor-item">
                            <div className="contributor-avatar">
                                {String.fromCharCode(65 + i)}
                            </div>
                            <div className="contributor-info">
                                <div className="contributor-name">Contributor {i + 1}</div>
                                <div className="contributor-stats">
                                    {Math.floor(Math.random() * 50) + 50} solutions
                                </div>
                            </div>
                            <div className={`contributor-medal ${i === 0 ? 'gold' : i === 1 ? 'silver' : 'bronze'}`}>
                                {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* CTA Card */}
            <div className="cta-card">
                <Rocket className="cta-icon" />
                <h3>Post a Challenge</h3>
                <p>Share your technical problem and get help from experts worldwide.</p>
                <button className="btn-primary" onClick={() => navigate('/community/create')}>
                    <PlusCircle size={14} />
                    New Challenge
                </button>
            </div>

            {/* Footer Links */}
            <div className="footer-links-row">
                <a href="#" className="footer-link">About</a>
                <a href="#" className="footer-link">Privacy</a>
                <a href="#" className="footer-link">Terms</a>
                <a href="#" className="footer-link">Guidelines</a>
            </div>
            <div className="footer-copyright">
                © 2026 Clustaura Global Community
            </div>
        </div>
    );
};

export default React.memo(CommunityRightSidebar);