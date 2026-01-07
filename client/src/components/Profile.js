
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import NotificationBell from './NotificationBell';
import '../styles.css';

const Profile = () => {
    const [user, setUser] = useState(null);
    const [profileImage, setProfileImage] = useState(null);
    const [profileImageUrl, setProfileImageUrl] = useState('');
    const [activeTab, setActiveTab] = useState('profile');
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
    const [newSkill, setNewSkill] = useState('');
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

                    const { data } = await axios.get('/api/profile/me', config);

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

            alert('Profile saved successfully!');
        } catch (error) {
            console.error('Error saving profile:', error);
            const errMsg = error.response?.data?.error || error.response?.data?.message || 'Failed to save profile.';
            alert(errMsg);
        }
    };

    const handleBackToDashboard = () => {
        navigate('/dashboard');
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleChangePassword = () => {
        const newPassword = prompt('Enter new password:');
        if (newPassword) {
            alert('Password changed successfully!');
        }
    };

    const handleDeleteAccount = () => {
        if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            localStorage.removeItem('user');
            localStorage.removeItem('userProfile');
            navigate('/register');
        }
    };

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div className="profile-page">
            <header className="profile-header">
                <button className="back-button" onClick={handleBackToDashboard}>
                    ← Back to Dashboard
                </button>
                <div className="header-content">
                    <h1>👤 My Profile</h1>
                    <p>Manage your profile settings and preferences</p>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>

                </div>
            </header>

            <main className="profile-main">
                <div className="profile-layout">
                    {/* Left Column - Profile Info */}
                    <div className="profile-left-column">
                        <div className="profile-card">
                            <div className="profile-image-section">
                                <div className="profile-image-container">
                                    {profileImageUrl ? (
                                        <img
                                            src={profileImageUrl}
                                            alt="Profile"
                                            className="profile-image"
                                        />
                                    ) : (
                                        <div className="profile-image-placeholder">
                                            {user.firstName?.charAt(0) || 'U'}
                                        </div>
                                    )}
                                </div>
                                <div className="image-upload-actions">
                                    <input
                                        type="file"
                                        id="profile-image-upload"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        style={{ display: 'none' }}
                                    />
                                    <label htmlFor="profile-image-upload" className="upload-btn">
                                        📷 Upload Photo
                                    </label>
                                    {profileImageUrl && (
                                        <button
                                            className="remove-btn"
                                            onClick={() => {
                                                setProfileImageUrl('');
                                                setProfileImage(null);
                                            }}
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="profile-info">
                                <h2 className="profile-name">
                                    {formData.firstName} {formData.lastName}
                                </h2>
                                <p className="profile-email">{formData.email}</p>
                                <p className="profile-location">📍 {formData.location}</p>

                                <div className="profile-bio">
                                    <h4>Bio</h4>
                                    <p>{formData.bio}</p>
                                </div>

                                <div className="profile-stats">
                                    <div className="stat-item">
                                        <span className="stat-value">24</span>
                                        <span className="stat-label">Challenges</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-value">156</span>
                                        <span className="stat-label">Solutions</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-value">42</span>
                                        <span className="stat-label">Connections</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="skills-card">
                            <h3>Skills & Expertise</h3>
                            <div className="skills-list">
                                {(formData.skills || []).map(skill => (
                                    <div key={skill} className="skill-item">
                                        <span>{skill}</span>
                                        <button
                                            className="remove-skill-btn"
                                            onClick={() => handleRemoveSkill(skill)}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="add-skill-section">
                                <input
                                    type="text"
                                    value={newSkill}
                                    onChange={(e) => setNewSkill(e.target.value)}
                                    placeholder="Add a new skill"
                                    className="skill-input"
                                />
                                <button
                                    className="add-skill-btn"
                                    onClick={handleAddSkill}
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Settings */}
                    <div className="profile-right-column">
                        <div className="settings-tabs">
                            <button
                                className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
                                onClick={() => setActiveTab('profile')}
                            >
                                Profile Settings
                            </button>
                            <button
                                className={`tab-btn ${activeTab === 'account' ? 'active' : ''}`}
                                onClick={() => setActiveTab('account')}
                            >
                                Account Settings
                            </button>
                            <button
                                className={`tab-btn ${activeTab === 'privacy' ? 'active' : ''}`}
                                onClick={() => setActiveTab('privacy')}
                            >
                                Privacy & Security
                            </button>
                            <button
                                className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
                                onClick={() => setActiveTab('notifications')}
                            >
                                Notifications
                            </button>
                        </div>

                        <div className="settings-content">
                            {activeTab === 'profile' && (
                                <div className="settings-section">
                                    <h3>Edit Profile Information</h3>

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

                                    <div className="form-group">
                                        <label>Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className="form-input"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Bio</label>
                                        <textarea
                                            name="bio"
                                            value={formData.bio}
                                            onChange={handleInputChange}
                                            className="form-textarea"
                                            rows="4"
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
                                            placeholder="https://"
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
                                            placeholder="github-username"
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

                                    <button
                                        className="save-btn"
                                        onClick={handleSaveProfile}
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            )}

                            {activeTab === 'account' && (
                                <div className="settings-section">
                                    <h3>Account Settings</h3>

                                    <div className="account-actions">
                                        <button
                                            className="action-btn"
                                            onClick={handleChangePassword}
                                        >
                                            🔒 Change Password
                                        </button>

                                        <button
                                            className="action-btn"
                                            onClick={() => alert('Export feature coming soon!')}
                                        >
                                            📥 Export My Data
                                        </button>

                                        <button
                                            className="action-btn danger"
                                            onClick={handleDeleteAccount}
                                        >
                                            🗑️ Delete Account
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'privacy' && (
                                <div className="settings-section">
                                    <h3>Privacy & Security</h3>

                                    <div className="privacy-settings">
                                        <div className="privacy-option">
                                            <div className="option-info">
                                                <h4>Profile Visibility</h4>
                                                <p>Control who can see your profile</p>
                                            </div>
                                            <select className="privacy-select">
                                                <option>Public</option>
                                                <option>Connections Only</option>
                                                <option>Private</option>
                                            </select>
                                        </div>

                                        <div className="privacy-option">
                                            <div className="option-info">
                                                <h4>Email Notifications</h4>
                                                <p>Receive email updates about challenges</p>
                                            </div>
                                            <label className="switch">
                                                <input type="checkbox" defaultChecked />
                                                <span className="slider"></span>
                                            </label>
                                        </div>

                                        <div className="privacy-option">
                                            <div className="option-info">
                                                <h4>Show Online Status</h4>
                                                <p>Let others see when you're online</p>
                                            </div>
                                            <label className="switch">
                                                <input type="checkbox" defaultChecked />
                                                <span className="slider"></span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'notifications' && (
                                <div className="settings-section">
                                    <h3>Notification Preferences</h3>

                                    <div className="notification-settings">
                                        <div className="notification-option">
                                            <div className="option-info">
                                                <h4>Challenge Updates</h4>
                                                <p>Get notified when challenges you joined are updated</p>
                                            </div>
                                            <label className="switch">
                                                <input type="checkbox" defaultChecked />
                                                <span className="slider"></span>
                                            </label>
                                        </div>

                                        <div className="notification-option">
                                            <div className="option-info">
                                                <h4>New Messages</h4>
                                                <p>Notifications for new messages</p>
                                            </div>
                                            <label className="switch">
                                                <input type="checkbox" defaultChecked />
                                                <span className="slider"></span>
                                            </label>
                                        </div>

                                        <div className="notification-option">
                                            <div className="option-info">
                                                <h4>Friend Requests</h4>
                                                <p>Get notified when someone sends you a friend request</p>
                                            </div>
                                            <label className="switch">
                                                <input type="checkbox" defaultChecked />
                                                <span className="slider"></span>
                                            </label>
                                        </div>

                                        <div className="notification-option">
                                            <div className="option-info">
                                                <h4>News Updates</h4>
                                                <p>Daily digest of trending news</p>
                                            </div>
                                            <label className="switch">
                                                <input type="checkbox" defaultChecked />
                                                <span className="slider"></span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Profile;
