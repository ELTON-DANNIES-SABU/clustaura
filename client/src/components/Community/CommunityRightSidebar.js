import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, PlusCircle, X, TrendingUp, Users, Award, ChevronRight } from 'lucide-react';
import axios from 'axios';
import useCommunityStore from '../../store/communityStore';

const CommunityRightSidebar = ({ onClose, user, activeCommunityId, onOpenCreateModal }) => {
    const navigate = useNavigate();
    const { communities } = useCommunityStore();
    const [topExpert, setTopExpert] = useState(null);
    const [loadingExpert, setLoadingExpert] = useState(true);
    const [trendingTags, setTrendingTags] = useState(['react', 'javascript', 'typescript', 'node', 'python', 'api', 'database', 'security']);

    useEffect(() => {
        const fetchSidebarData = async () => {
            try {
                // Fetch Expert
                const expertRes = await axios.get('/api/credits/top-expert');
                setTopExpert(expertRes.data);

                // Fetch Trending Tags
                const tagsRes = await axios.get('/api/challenges/trending-tags');
                if (tagsRes.data && tagsRes.data.length > 0) {
                    setTrendingTags(tagsRes.data);
                }
            } catch (err) {
                console.error('Error fetching sidebar data:', err);
            } finally {
                setLoadingExpert(false);
            }
        };

        fetchSidebarData();
    }, []);

    // Get top communities by member count
    const topCommunities = communities
        ?.sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0))
        .slice(0, 5) || [];

    // Debug function to verify click handler works
    const handleNewChallengeClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('New Challenge button clicked in RightSidebar');
        if (onOpenCreateModal) {
            onOpenCreateModal();
        } else {
            console.error('onOpenCreateModal prop is not defined');
            // Fallback navigation if modal doesn't work
            navigate('/community/create');
        }
    };

    return (
        <div className="community-sidebar-right">
            {onClose && (
                <button className="sidebar-close-btn" onClick={onClose}>
                    <X size={20} />
                </button>
            )}

            {/* CTA Card */}
            <div className="cta-card" style={{ marginTop: '0' }}>
                <Rocket className="cta-icon" />
                <h3>Post a Challenge</h3>
                <p>Share your technical problem and get help from experts worldwide.</p>
                <button
                    className="btn-primary"
                    onClick={handleNewChallengeClick}
                    style={{
                        width: '100%',
                        marginTop: '16px',
                        cursor: 'pointer',
                        position: 'relative',
                        zIndex: 10,
                        background: 'linear-gradient(135deg, #339933, #40c0ff)',
                        border: 'none',
                        color: 'white',
                        padding: '12px 20px',
                        borderRadius: '30px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(51,153,51,0.4)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                >
                    <PlusCircle size={16} />
                    New Challenge
                </button>
            </div>

            {/* Top Communities */}
            {topCommunities.length > 0 && (
                <div className="top-communities-card" style={{ marginTop: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <TrendingUp size={16} color="#339933" />
                        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Top Communities</h4>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {topCommunities.map((community, index) => (
                            <div
                                key={community._id}
                                onClick={() => {
                                    console.log('Navigating to community:', community._id);
                                    navigate(`/community?community=${community._id}`);
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '8px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    background: 'rgba(255,255,255,0.02)',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(51,153,51,0.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                            >
                                <span style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '6px',
                                    background: `linear-gradient(135deg, ${index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#339933'}20)`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    color: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#339933',
                                }}>
                                    #{index + 1}
                                </span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '13px', fontWeight: 500 }}>r/{community.name}</div>
                                    <div style={{ fontSize: '11px', color: '#a0a0a0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Users size={10} />
                                        {community.memberCount || 0} members
                                    </div>
                                </div>
                                <ChevronRight size={14} color="#a0a0a0" />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Expert Spotlight */}
            <div className="expert-spotlight-card" style={{ marginTop: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <Award size={16} color="#ffaa33" />
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Expert Spotlight</h4>
                </div>

                {loadingExpert ? (
                    <div style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: '#666' }}>
                        Loading expert...
                    </div>
                ) : topExpert ? (
                    <div style={{
                        padding: '16px',
                        background: 'rgba(255,170,51,0.05)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,170,51,0.2)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #ffaa33, #ff8c00)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                fontSize: '16px',
                                color: 'white',
                                overflow: 'hidden'
                            }}>
                                {topExpert.user?.avatar ? (
                                    <img src={topExpert.user.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    (topExpert.user?.firstName?.charAt(0) || '') + (topExpert.user?.lastName?.charAt(0) || '')
                                )}
                            </div>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '14px' }}>
                                    {topExpert.user?.firstName} {topExpert.user?.lastName}
                                </div>
                                <div style={{ fontSize: '11px', color: '#a0a0a0' }}>
                                    {topExpert.user?.role || 'Expert Contributor'}
                                </div>
                            </div>
                        </div>
                        <p style={{ fontSize: '12px', color: '#a0a0a0', margin: '0 0 12px 0', lineHeight: '1.5' }}>
                            {topExpert.profile?.bio || `Top expert with ${topExpert.monthlyCredits || 0} credits earned this month. Helped ${topExpert.helpedCount || 0} developers with technical solutions.`}
                        </p>
                        {topExpert.profile?.bio && (
                            <div style={{ fontSize: '11px', color: '#339933', marginBottom: '12px', fontWeight: 600 }}>
                                Helped {topExpert.helpedCount || 0} developers this month
                            </div>
                        )}
                        <button
                            onClick={() => {
                                console.log('Navigating to expert profile');
                                navigate(`/profile/${topExpert.user?._id}`);
                            }}
                            style={{
                                width: '100%',
                                padding: '8px',
                                background: 'transparent',
                                border: '1px solid rgba(255,170,51,0.3)',
                                borderRadius: '6px',
                                color: '#ffaa33',
                                fontSize: '12px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255,170,51,0.1)';
                                e.currentTarget.style.borderColor = 'rgba(255,170,51,0.5)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.borderColor = 'rgba(255,170,51,0.3)';
                            }}
                        >
                            Connect with Expert
                        </button>
                    </div>
                ) : (
                    <div style={{ padding: '16px', textAlign: 'center', fontSize: '11px', color: '#666' }}>
                        Join the community to be featured!
                    </div>
                )}
            </div>

            {/* Trending Tags */}
            <div className="trending-tags-card" style={{ marginTop: '24px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600 }}>Trending Tags</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {trendingTags.map(tag => (
                        <span
                            key={tag}
                            onClick={() => {
                                console.log('Navigating to tag:', tag);
                                navigate(`/challenges?tag=${tag}`);
                            }}
                            style={{
                                padding: '4px 12px',
                                background: 'rgba(51,153,51,0.1)',
                                borderRadius: '20px',
                                fontSize: '11px',
                                color: '#339933',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                textTransform: 'lowercase'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(51,153,51,0.2)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(51,153,51,0.1)'}
                        >
                            #{tag}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default React.memo(CommunityRightSidebar);