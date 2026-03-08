import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import PostCard from './PostCard';
import '../styles.css';

const UserProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [posts, setPosts] = useState([]);

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const userStr = localStorage.getItem('user');
                if (!userStr) {
                    navigate('/login');
                    return;
                }

                const userData = JSON.parse(userStr);

                // Redirect if viewing own profile
                if (userData._id === id || userData.id === id) {
                    navigate('/profile');
                    return;
                }

                const token = userData.token;
                const config = {
                    headers: { Authorization: `Bearer ${token}` }
                };

                const { data } = await axios.get(`/api/profile/user/${id}`, config);
                setProfile(data);
                if (data.posts) {
                    setPosts(data.posts);
                }
                setLoading(false);
            } catch (err) {
                console.error('Error fetching user profile:', err);
                setError('Failed to load profile');
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, [id, navigate]);

    const handleBack = () => {
        navigate(-1);
    };

    const handleMessage = () => {
        if (profile && profile.user) {
            navigate(`/chat/${profile.user._id}`);
        }
    };

    const handleConnect = async () => {
        try {
            const userStr = localStorage.getItem('user');
            const userData = JSON.parse(userStr);
            const token = userData.token;
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };

            await axios.post(`/api/friends/request/${profile.user._id}`, {}, config);
            alert('Friend request sent!');
        } catch (error) {
            console.error('Error sending friend request:', error);
            alert(error.response?.data?.message || 'Failed to send request');
        }
    };

    if (loading) return (
        <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading Profile...</p>
        </div>
    );

    if (error) return <div className="error-message">{error}</div>;
    if (!profile) return <div className="error-message">Profile not found</div>;

    const { user, bio, skills, location, website, github, twitter, profileImageUrl } = profile;

    // Inline styles for the improved design
    const styles = {
        container: {
            padding: '2rem',
            maxWidth: '1200px',
            margin: '0 auto',
            minHeight: '100vh',
            color: 'var(--white)'
        },
        header: {
            display: 'flex',
            alignItems: 'center',
            marginBottom: '2rem'
        },
        backButton: {
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            color: 'var(--white)',
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s',
            backdropFilter: 'blur(5px)'
        },
        mainContent: {
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '2rem',
            animation: 'fadeIn 0.5s ease-out'
        },
        card: {
            background: 'rgba(26, 26, 26, 0.6)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        },
        banner: {
            height: '200px',
            background: 'linear-gradient(135deg, rgba(0, 255, 163, 0.2) 0%, rgba(0, 0, 0, 0.8) 100%)',
            position: 'relative'
        },
        profileHeader: {
            padding: '0 2rem 2rem',
            marginTop: '-75px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
        },
        avatarDict: {
            width: '150px',
            height: '150px',
            borderRadius: '50%',
            overflow: 'hidden',
            border: '4px solid rgba(26, 26, 26, 1)',
            background: 'var(--gray-800)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '3rem',
            fontWeight: 'bold',
            color: 'var(--primary-mint)',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
            marginBottom: '1rem'
        },
        avatarImg: {
            width: '100%',
            height: '100%',
            objectFit: 'cover'
        },
        name: {
            fontSize: '2.5rem',
            fontWeight: '800',
            marginBottom: '0.25rem',
            background: 'linear-gradient(to right, #00FFA3, #00FFCC)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
        },
        email: {
            color: 'var(--gray-400)',
            marginBottom: '1rem',
            fontSize: '1.1rem'
        },
        location: {
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--gray-300)',
            marginBottom: '1.5rem',
            background: 'rgba(255,255,255,0.05)',
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-full)'
        },
        actions: {
            display: 'flex',
            gap: '1rem',
            marginBottom: '2rem'
        },
        primaryBtn: {
            background: 'var(--primary-mint)',
            color: 'var(--black)',
            border: 'none',
            padding: '0.75rem 2rem',
            borderRadius: 'var(--radius-full)',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'transform 0.2s',
            boxShadow: '0 0 20px rgba(0, 255, 163, 0.3)'
        },
        secondaryBtn: {
            background: 'transparent',
            color: 'var(--primary-mint)',
            border: '2px solid var(--primary-mint)',
            padding: '0.75rem 2rem',
            borderRadius: 'var(--radius-full)',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background 0.2s'
        },
        section: {
            padding: '2rem',
            borderTop: '1px solid rgba(255,255,255,0.05)'
        },
        sectionTitle: {
            fontSize: '1.25rem',
            fontWeight: '600',
            marginBottom: '1rem',
            color: 'var(--primary-mint)'
        },
        grid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem'
        },
        skillTag: {
            background: 'rgba(0, 255, 163, 0.1)',
            color: 'var(--primary-mint)',
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(0, 255, 163, 0.2)',
            fontSize: '0.9rem',
            display: 'inline-block',
            margin: '0 0.5rem 0.5rem 0'
        },
        socialLink: {
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1rem',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 'var(--radius-lg)',
            textDecoration: 'none',
            color: 'var(--white)',
            transition: 'background 0.2s'
        }
    };

    return (
        <div style={styles.container} className="user-profile-page">
            <header style={styles.header}>
                <button
                    style={styles.backButton}
                    onClick={handleBack}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                    onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                >
                    ← Back to Dashboard
                </button>
            </header>

            <main style={styles.mainContent}>
                {/* Main Profile Card */}
                <div style={styles.card}>
                    {/* Banner Area */}
                    <div style={styles.banner}></div>

                    {/* Profile Header (Avatar + Basic Info) */}
                    <div style={styles.profileHeader}>
                        <div style={styles.avatarDict}>
                            {profileImageUrl ? (
                                <img src={profileImageUrl} alt="Profile" style={styles.avatarImg} />
                            ) : (
                                <span>{user.firstName?.charAt(0) || 'U'}</span>
                            )}
                        </div>

                        <h1 style={styles.name}>{user.firstName} {user.lastName}</h1>
                        <p style={styles.email}>{user.email}</p>

                        {location && (
                            <div style={styles.location}>
                                <span>📍</span> {location}
                            </div>
                        )}

                        <div style={styles.actions}>
                            <button
                                style={styles.primaryBtn}
                                onClick={handleMessage}
                                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                Send Message
                            </button>
                            <button
                                style={styles.secondaryBtn}
                                onClick={handleConnect}
                                onMouseOver={e => e.currentTarget.style.background = 'rgba(0, 255, 163, 0.1)'}
                                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                            >
                                Connect
                            </button>
                            <button
                                style={{ ...styles.secondaryBtn, borderColor: '#ffd700', color: '#ffd700' }}
                                onClick={async () => {
                                    if (window.confirm(`Endorse ${user.firstName} for their collaboration?`)) {
                                        try {
                                            const userStr = localStorage.getItem('user');
                                            const userData = JSON.parse(userStr);
                                            await axios.post('http://localhost:5000/api/credits/endorse', {
                                                collaboratorId: profile.user._id,
                                                projectId: 'profile_endorsement', // General endorsement
                                                amount: 10
                                            }, {
                                                headers: { Authorization: `Bearer ${userData.token}` }
                                            });
                                            alert('Endorsement sent!');
                                        } catch (e) {
                                            console.error(e);
                                            alert('Failed to endorse');
                                        }
                                    }
                                }}
                                onMouseOver={e => e.currentTarget.style.background = 'rgba(255, 215, 0, 0.1)'}
                                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                            >
                                ⭐ Endorse
                            </button>
                        </div>
                    </div>

                    {/* Content Grid (Bio + Skills + Social) */}
                    <div style={styles.grid}>
                        {/* Bio Section */}
                        <div style={styles.section}>
                            <h3 style={styles.sectionTitle}>About</h3>
                            <p style={{ lineHeight: '1.6', color: 'var(--gray-300)' }}>
                                {bio || "This user hasn't added a bio yet."}
                            </p>
                        </div>

                        {/* Skills Section */}
                        <div style={styles.section}>
                            <h3 style={styles.sectionTitle}>Skills & Expertise</h3>
                            {skills && skills.length > 0 ? (
                                <div>
                                    {skills.map(skill => (
                                        <span key={skill} style={styles.skillTag}>
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ color: 'var(--gray-500)' }}>No skills listed</p>
                            )}
                        </div>
                    </div>

                    {/* Social Links Section (if any exist) */}
                    {(website || github || twitter) && (
                        <div style={styles.section}>
                            <h3 style={styles.sectionTitle}>Connect on Socials</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                {website && (
                                    <a href={website} target="_blank" rel="noopener noreferrer" style={styles.socialLink}>
                                        <span>🌍</span> Website
                                    </a>
                                )}
                                {github && (
                                    <a href={`https://github.com/${github}`} target="_blank" rel="noopener noreferrer" style={styles.socialLink}>
                                        <span>💻</span> GitHub
                                    </a>
                                )}
                                {twitter && (
                                    <a href={`https://twitter.com/${twitter}`} target="_blank" rel="noopener noreferrer" style={styles.socialLink}>
                                        <span>🐦</span> Twitter
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* User's Posts Section */}
                <div className="user-posts-section">
                    <h3 style={{ ...styles.sectionTitle, marginBottom: '1.5rem', marginTop: '1rem' }}>
                        Latest Posts by {user.firstName}
                    </h3>

                    {posts.length > 0 ? (
                        <div className="posts-feed">
                            {posts.map(post => (
                                <PostCard key={post._id} post={post} isPreview={true} />
                            ))}
                        </div>
                    ) : (
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            padding: '3rem',
                            borderRadius: 'var(--radius-lg)',
                            textAlign: 'center',
                            color: 'var(--gray-400)'
                        }}>
                            <p>No posts yet.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default UserProfile;
