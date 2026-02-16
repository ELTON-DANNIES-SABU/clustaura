import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles.css';

const LogoutIcon = () => (
    <svg className="pro-icon" viewBox="0 0 24 24" width="20" height="20">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="16 17 21 12 16 7" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const Profile = () => {
    const [user, setUser] = useState(null);
    const [profileImage, setProfileImage] = useState(null);
    const [profileImageUrl, setProfileImageUrl] = useState('');
    const [activeTab, setActiveTab] = useState('overview');
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        bio: '',
        skills: [],
        location: '',
        website: '',
        github: '',
        twitter: ''
    });
    const [creditStats, setCreditStats] = useState(null);
    const [newSkill, setNewSkill] = useState('');
    const [userPosts, setUserPosts] = useState([]);
    const [userComments, setUserComments] = useState([]);
    const [loadingActivity, setLoadingActivity] = useState(false);
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async () => {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const userData = JSON.parse(userStr);
                setUser(userData);

                try {
                    const token = userData.token;
                    const config = {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    };

                    const { data } = await axios.get('http://localhost:5000/api/profile/me', config);

                    if (data) {
                        setFormData({
                            firstName: data.user?.firstName || userData.firstName || '',
                            lastName: data.user?.lastName || userData.lastName || '',
                            email: data.user?.email || userData.email || '',
                            bio: data.bio || '',
                            skills: data.skills || [],
                            location: data.location || '',
                            website: data.website || '',
                            github: data.github || '',
                            twitter: data.twitter || ''
                        });
                        if (data.profileImageUrl) {
                            setProfileImageUrl(data.profileImageUrl);
                        }
                    }
                } catch (error) {
                    console.error('Error fetching profile:', error);
                    setFormData({
                        firstName: userData.firstName || '',
                        lastName: userData.lastName || '',
                        email: userData.email || '',
                        bio: '',
                        skills: [],
                        location: '',
                        website: '',
                        github: '',
                        twitter: ''
                    });
                }
            } else {
                navigate('/login');
            }
        };

        fetchProfile();
    }, [navigate]);

    useEffect(() => {
        const fetchActivity = async () => {
            if (!user) return;

            if (activeTab === 'posts' || activeTab === 'comments') {
                setLoadingActivity(true);
                try {
                    const token = user.token;
                    const config = {
                        headers: { Authorization: `Bearer ${token}` }
                    };

                    if (activeTab === 'posts') {
                        const { data } = await axios.get('/api/community/me/posts', config);
                        setUserPosts(data);
                    } else if (activeTab === 'comments') {
                        const { data } = await axios.get('/api/community/me/comments', config);
                        setUserComments(data);
                    }
                } catch (error) {
                    console.error('Error fetching activity:', error);
                } finally {
                    setLoadingActivity(false);
                }
            }
        };

        fetchActivity();
    }, [activeTab, user]);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileImage(file);
                setProfileImageUrl(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAddSkill = () => {
        if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
            const updatedSkills = [...(formData.skills || []), newSkill.trim()];
            setFormData(prev => ({
                ...prev,
                skills: updatedSkills
            }));
            setNewSkill('');
        }
    };

    const handleRemoveSkill = (skillToRemove) => {
        const updatedSkills = (formData.skills || []).filter(skill => skill !== skillToRemove);
        setFormData(prev => ({
            ...prev,
            skills: updatedSkills
        }));
    };

    const handleSaveProfile = async () => {
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

            const profileData = {
                ...formData,
                profileImageUrl
            };

            const { data } = await axios.put('/api/profile/me', profileData, config);

            if (data.user) {
                const updatedUser = { ...userData, ...data.user };
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }

            showNotification('Profile saved successfully!', 'success');
        } catch (error) {
            console.error('Error saving profile:', error);
            const errMsg = error.response?.data?.error || error.response?.data?.message || 'Failed to save profile.';
            showNotification(errMsg, 'error');
        }
    };

    const showNotification = (message, type = 'info') => {
        const notification = document.createElement('div');
        notification.className = `profile-notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.opacity = '0';
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => notification.remove(), 300);
            }
        }, 3000);
    };

    const handleBackToDashboard = () => {
        navigate('/dashboard');
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            showNotification('New passwords do not match', 'error');
            return;
        }

        try {
            const token = user.token;
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };

            await axios.put('/api/auth/update-password', {
                oldPassword: passwordData.oldPassword,
                newPassword: passwordData.newPassword
            }, config);

            showNotification('Password changed successfully!', 'success');
            setShowPasswordForm(false);
            setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            console.error('Error changing password:', error);
            const errMsg = error.response?.data?.message || 'Failed to change password.';
            showNotification(errMsg, 'error');
        }
    };

    const handleExportData = async () => {
        try {
            const token = user.token;
            const config = {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob' // Important for binary data
            };

            const { data } = await axios.get('/api/profile/export', config);

            // Create a blob and download it
            const blob = new Blob([data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `clustaura-export-${user.firstName}-${new Date().toISOString().split('T')[0]}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            showNotification('PDF report exported successfully!', 'success');
        } catch (error) {
            console.error('Error exporting PDF:', error);
            showNotification('Failed to export PDF report.', 'error');
        }
    };


    if (!user) {
        return <div className="profile-loading">Loading...</div>;
    }

    return (
        <div className="profile-page">
            <header className="profile-header">
                <button className="back-button" onClick={handleBackToDashboard}>
                    ← Back to Dashboard
                </button>
                <div className="header-content">
                    <h1>👤 Profile</h1>
                    <p>Manage your profile, settings, and preferences</p>
                </div>
            </header>

            <main className="profile-main">
                <div className="profile-layout">
                    {/* Left Sidebar - Navigation */}
                    <div className="profile-sidebar">
                        <div className="sidebar-user-card">
                            <div className="sidebar-avatar" onClick={() => document.getElementById('profile-image-upload-sidebar')?.click()}>
                                {profileImageUrl ? (
                                    <img src={profileImageUrl} alt="Profile" className="sidebar-avatar-img" />
                                ) : (
                                    <div className="sidebar-avatar-placeholder">
                                        {formData.firstName?.charAt(0) || 'U'}
                                    </div>
                                )}
                                <input
                                    type="file"
                                    id="profile-image-upload-sidebar"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    style={{ display: 'none' }}
                                />
                            </div>
                            <div className="sidebar-user-info">
                                <h3>{formData.firstName} {formData.lastName}</h3>
                                <p>@{formData.firstName?.toLowerCase() || 'user'}</p>
                            </div>
                        </div>

                        <nav className="sidebar-nav">
                            <button
                                className={`sidebar-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
                                onClick={() => setActiveTab('overview')}
                            >
                                👤 Overview
                            </button>
                            <button
                                className={`sidebar-nav-item ${activeTab === 'posts' ? 'active' : ''}`}
                                onClick={() => setActiveTab('posts')}
                            >
                                📝 Posts
                            </button>
                            <button
                                className={`sidebar-nav-item ${activeTab === 'comments' ? 'active' : ''}`}
                                onClick={() => setActiveTab('comments')}
                            >
                                💬 Comments
                            </button>
                            <button
                                className={`sidebar-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
                                onClick={() => setActiveTab('settings')}
                            >
                                ⚙️ Settings
                            </button>
                        </nav>

                        <div className="sidebar-stats">
                            <div className="stat-item">
                                <span className="stat-value">0</span>
                                <span className="stat-label">Followers</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">1</span>
                                <span className="stat-label">Karma</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">0</span>
                                <span className="stat-label">Contributions</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">0</span>
                                <span className="stat-label">Active in</span>
                            </div>
                        </div>

                        <div className="sidebar-achievements">
                            <h4>🏆 Achievements</h4>
                            <div className="achievements-grid">
                                <div className="achievement">🏠 Hometown Hero</div>
                                <div className="achievement">👋 Newcomer</div>
                                <div className="achievement">🔍 Feed Finder</div>
                                <div className="achievement">+2 more</div>
                            </div>
                            <div className="achievement-progress">
                                <span>5 unlocked</span>
                                <button className="view-all-btn">View All</button>
                            </div>
                        </div>

                        <div className="sidebar-settings">
                            <h4>⚙️ Settings</h4>
                            <select className="settings-select">
                                <option>Profile Settings</option>
                                <option>Account Settings</option>
                                <option>Privacy & Security</option>
                                <option>Notifications</option>
                            </select>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="profile-content">
                        <div className="content-header">
                            <h2>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
                        </div>

                        {activeTab === 'overview' && (
                            <div className="tab-content wider-tab">
                                {/* Profile Edit Form */}
                                <div className="profile-section-card">
                                    <h3>Profile Information</h3>
                                    <p className="card-subtitle">Update your personal details and professional bio.</p>

                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>First Name</label>
                                            <input
                                                type="text"
                                                name="firstName"
                                                value={formData.firstName}
                                                onChange={handleInputChange}
                                                className="form-input"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>Last Name</label>
                                            <input
                                                type="text"
                                                name="lastName"
                                                value={formData.lastName}
                                                onChange={handleInputChange}
                                                className="form-input"
                                            />
                                        </div>

                                        <div className="form-group full-width">
                                            <label>Email</label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                className="form-input"
                                            />
                                        </div>

                                        <div className="form-group full-width">
                                            <label>Bio</label>
                                            <textarea
                                                name="bio"
                                                value={formData.bio}
                                                onChange={handleInputChange}
                                                className="form-textarea"
                                                rows="4"
                                                placeholder="Tell us about yourself, your goals, and what you're working on..."
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>Location</label>
                                            <input
                                                type="text"
                                                name="location"
                                                value={formData.location}
                                                onChange={handleInputChange}
                                                className="form-input"
                                                placeholder="City, Country"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>Website</label>
                                            <input
                                                type="url"
                                                name="website"
                                                value={formData.website}
                                                onChange={handleInputChange}
                                                className="form-input"
                                                placeholder="https://example.com"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>GitHub</label>
                                            <input
                                                type="text"
                                                name="github"
                                                value={formData.github}
                                                onChange={handleInputChange}
                                                className="form-input"
                                                placeholder="username"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>Twitter</label>
                                            <input
                                                type="text"
                                                name="twitter"
                                                value={formData.twitter}
                                                onChange={handleInputChange}
                                                className="form-input"
                                                placeholder="@username"
                                            />
                                        </div>

                                        <div className="form-group full-width">
                                            <label>Skills</label>
                                            <div className="skills-input-group">
                                                <input
                                                    type="text"
                                                    value={newSkill}
                                                    onChange={(e) => setNewSkill(e.target.value)}
                                                    placeholder="Add a skill"
                                                    className="skill-input"
                                                />
                                                <button
                                                    className="add-skill-btn"
                                                    onClick={handleAddSkill}
                                                >
                                                    Add
                                                </button>
                                            </div>
                                            <div className="skills-tags">
                                                {formData.skills.map(skill => (
                                                    <div key={skill} className="skill-tag">
                                                        {skill}
                                                        <button
                                                            className="remove-skill-btn"
                                                            onClick={() => handleRemoveSkill(skill)}
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-actions">
                                        <button className="save-btn" onClick={handleSaveProfile}>
                                            Save Changes
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'settings' && (
                            <div className="tab-content wider-tab">
                                <div className="profile-section-card">
                                    <h3>Account Settings</h3>
                                    <p className="card-subtitle">Manage your account security and authentication.</p>

                                    {!showPasswordForm ? (
                                        <div className="account-buttons">
                                            <button className="account-btn" onClick={() => setShowPasswordForm(true)}>
                                                🔒 Change Password
                                            </button>
                                            <button className="account-btn" onClick={handleExportData}>
                                                📥 Export My Data
                                            </button>
                                        </div>
                                    ) : (
                                        <form className="password-form" onSubmit={handleChangePassword}>
                                            <div className="form-group">
                                                <label>Current Password</label>
                                                <input
                                                    type="password"
                                                    value={passwordData.oldPassword}
                                                    onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>New Password</label>
                                                <input
                                                    type="password"
                                                    value={passwordData.newPassword}
                                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Confirm New Password</label>
                                                <input
                                                    type="password"
                                                    value={passwordData.confirmPassword}
                                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="password-form-actions">
                                                <button type="button" className="cancel-btn" onClick={() => setShowPasswordForm(false)}>Cancel</button>
                                                <button type="submit" className="save-btn">Update Password</button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'posts' && (
                            <div className="tab-content wider-tab">
                                <div className="profile-section-card">
                                    <h3>My Posts</h3>
                                    <p className="card-subtitle">Browse all your community contributions and technical challenges.</p>

                                    {loadingActivity ? (
                                        <div className="profile-loading">Loading posts...</div>
                                    ) : userPosts.length > 0 ? (
                                        <div className="activity-list">
                                            {userPosts.map(post => {
                                                const isChallenge = post.community?.name === 'Technical Challenges';
                                                const link = isChallenge ? `/challenge/${post._id}` : `/community/post/${post._id}`;

                                                return (
                                                    <div key={post._id} className="activity-card" onClick={() => navigate(link)}>
                                                        <div className="activity-card-header">
                                                            <span className="community-tag" style={{
                                                                background: isChallenge ? 'rgba(52, 152, 219, 0.1)' : 'rgba(0, 255, 163, 0.1)',
                                                                color: isChallenge ? '#3498db' : 'var(--primary-mint)'
                                                            }}>
                                                                {post.community?.name || 'General'}
                                                            </span>
                                                            <span className="activity-date">{new Date(post.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                        <h4>{post.title}</h4>
                                                        <p className="activity-snippet">{post.content?.substring(0, 150)}...</p>
                                                        <div className="activity-meta">
                                                            <span>💬 {post.commentCount || 0} comments</span>
                                                            <span>👍 {post.votes?.length || 0} votes</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="empty-state-card">
                                            <h3>No posts yet</h3>
                                            <p>Your technical posts and community contributions will appear here.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'comments' && (
                            <div className="tab-content wider-tab">
                                <div className="profile-section-card">
                                    <h3>My Comments</h3>
                                    <p className="card-subtitle">Keep track of your discussion threads and replies.</p>

                                    {loadingActivity ? (
                                        <div className="profile-loading">Loading comments...</div>
                                    ) : userComments.length > 0 ? (
                                        <div className="activity-list">
                                            {userComments.map(comment => {
                                                const isChallenge = comment.post?.community?.name === 'Technical Challenges';
                                                const link = isChallenge ? `/challenge/${comment.post?._id}` : `/community/post/${comment.post?._id}`;

                                                return (
                                                    <div key={comment._id} className="activity-card" onClick={() => comment.post?._id && navigate(link)}>
                                                        <div className="activity-card-header">
                                                            <span className="comment-on">On: {comment.post?.title || 'Unknown Post'}</span>
                                                            {isChallenge && <span className="community-tag" style={{ background: 'rgba(52, 152, 219, 0.1)', color: '#3498db', marginLeft: '8px', fontSize: '10px' }}>Challenge</span>}
                                                            <span className="activity-date">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                        <p className="activity-content">"{comment.content}"</p>
                                                        <div className="activity-meta">
                                                            <span>👍 {comment.votes?.length || 0} votes</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="empty-state-card">
                                            <h3>No comments yet</h3>
                                            <p>Your replies and discussions will be tracked here.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Profile;