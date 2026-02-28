import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TestBuilder from './TestBuilder';
import ResultsDashboard from './ResultsDashboard';
import TestAttempt from './TestAttempt';
import '../../styles.css';

const AssessmentPortal = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showBuilder, setShowBuilder] = useState(false);
    const [currentTestId, setCurrentTestId] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);

    useEffect(() => {
        fetchTests();
    }, []);

    const fetchTests = async () => {
        try {
            const userStr = localStorage.getItem('user');
            const userData = JSON.parse(userStr);
            const config = {
                headers: { Authorization: `Bearer ${userData.token}` }
            };
            const { data } = await axios.get('/api/assessment/tests', config);
            setTests(data.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching tests:', error);
            setLoading(false);
        }
    };

    const fetchAnalytics = async (testId) => {
        setLoadingAnalytics(true);
        try {
            const userStr = localStorage.getItem('user');
            const userData = JSON.parse(userStr);
            const config = {
                headers: { Authorization: `Bearer ${userData.token}` }
            };
            const { data } = await axios.get(`/api/assessment/tests/${testId}/analytics`, config);
            setAnalytics(data.data);
            setLoadingAnalytics(false);
        } catch (error) {
            console.error('Error fetching analytics:', error);
            alert('Failed to load analytics');
            setLoadingAnalytics(false);
        }
    };

    const handleDelete = async (testId) => {
        if (!window.confirm('Are you sure you want to delete this test? All associated data and attempts will be permanently removed.')) {
            return;
        }

        try {
            const userStr = localStorage.getItem('user');
            const userData = JSON.parse(userStr);
            const config = {
                headers: { Authorization: `Bearer ${userData.token}` }
            };
            await axios.delete(`/api/assessment/tests/${testId}`, config);

            // Update local state to remove the deleted test
            setTests(tests.filter(t => t._id !== testId));
            alert('Test deleted successfully');
        } catch (error) {
            console.error('Error deleting test:', error);
            alert(error.response?.data?.message || 'Failed to delete test');
        }
    };

    if (currentTestId) {
        return <TestAttempt testId={currentTestId} onFinish={() => setCurrentTestId(null)} />;
    }

    return (
        <div className="assessment-portal">
            <header className="assessment-header">
                <h1>Assessment Portal</h1>
                <nav className="assessment-nav">
                    <button
                        className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
                        onClick={() => setActiveTab('dashboard')}
                    >
                        Available Tests
                    </button>
                    <button
                        className={`nav-link ${activeTab === 'my-attempts' ? 'active' : ''}`}
                        onClick={() => setActiveTab('my-attempts')}
                    >
                        My Results
                    </button>
                    <button
                        className={`nav-link ${activeTab === 'manage' ? 'active' : ''}`}
                        onClick={() => setActiveTab('manage')}
                    >
                        Manage Tests
                    </button>
                </nav>
            </header>

            <main className="assessment-main">
                {activeTab === 'dashboard' && (
                    <div className="test-grid">
                        {loading ? (
                            <p>Loading tests...</p>
                        ) : tests.length > 0 ? (
                            tests.map(test => (
                                <div key={test._id} className="test-card">
                                    <div className="test-icon">📝</div>
                                    <h3>{test.title}</h3>
                                    <p className="test-desc">{test.description}</p>
                                    <div className="test-meta">
                                        <span>⏱️ {test.duration} mins</span>
                                        <span>🎯 {test.totalMarks} Marks</span>
                                    </div>
                                    <button
                                        className="btn-primary btn-full"
                                        onClick={() => setCurrentTestId(test._id)}
                                    >
                                        Start Test
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state">
                                <p>No assessments available at the moment.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'my-attempts' && <ResultsDashboard />}

                {activeTab === 'manage' && (
                    <div className="manage-section">
                        {!showBuilder ? (
                            <>
                                <div className="section-header">
                                    <h2>Manage Your Assessments</h2>
                                    <button className="btn-primary" onClick={() => setShowBuilder(true)}>Create New Test</button>
                                </div>
                                <div className="manage-content">
                                    <div className="manage-grid">
                                        {tests.filter(t => {
                                            const userData = JSON.parse(localStorage.getItem('user'));
                                            const currentUserId = userData._id || userData.id;
                                            return (t.creator._id || t.creator) === currentUserId;
                                        }).map(test => (
                                            <div key={test._id} className="manage-card">
                                                <h4>{test.title}</h4>
                                                <div className="manage-meta">
                                                    <span>⏱️ {test.duration}m</span>
                                                    <span>🎯 {test.totalMarks}pts</span>
                                                </div>
                                                <div className="manage-actions">
                                                    <button
                                                        className="btn-secondary btn-half"
                                                        onClick={() => fetchAnalytics(test._id)}
                                                    >
                                                        Analytics
                                                    </button>
                                                    <button
                                                        className="btn-danger btn-half"
                                                        onClick={() => handleDelete(test._id)}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {analytics && (
                                        <div className="analytics-overlay">
                                            <div className="analytics-modal">
                                                <div className="analytics-header">
                                                    <h2>{analytics.testTitle} - Reports</h2>
                                                    <button className="close-btn" onClick={() => setAnalytics(null)}>&times;</button>
                                                </div>

                                                <div className="stats-row">
                                                    <div className="stat-card">
                                                        <label>Invited</label>
                                                        <span>{analytics.stats.totalInvited}</span>
                                                    </div>
                                                    <div className="stat-card">
                                                        <label>Attended</label>
                                                        <span>{analytics.stats.totalAttended}</span>
                                                    </div>
                                                    <div className="stat-card">
                                                        <label>Avg. Score</label>
                                                        <span>{analytics.stats.averageScore}</span>
                                                    </div>
                                                </div>

                                                <div className="report-sections">
                                                    <section className="analytics-section">
                                                        <div className="section-title-row">
                                                            <h3>Attendees ({analytics.attendees.length})</h3>
                                                        </div>
                                                        <div className="report-table-container">
                                                            <table className="report-table">
                                                                <thead>
                                                                    <tr>
                                                                        <th>Candidate</th>
                                                                        <th>Score</th>
                                                                        <th>Status</th>
                                                                        <th>Violations</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {analytics.attendees.length > 0 ? (
                                                                        analytics.attendees.map(a => (
                                                                            <tr key={a.userId}>
                                                                                <td>
                                                                                    <div className="user-profile-item">
                                                                                        <div className="avatar-small">
                                                                                            {a.name.charAt(0)}
                                                                                        </div>
                                                                                        <div>
                                                                                            <div className="user-name">{a.name}</div>
                                                                                            <div className="user-email">{a.email}</div>
                                                                                        </div>
                                                                                    </div>
                                                                                </td>
                                                                                <td className="score-cell">
                                                                                    <span className="score-text">{a.score}</span>
                                                                                    <span className="score-max">/{a.maxScore}</span>
                                                                                </td>
                                                                                <td>
                                                                                    <span className={`status-badge ${a.status.toLowerCase().replace(' ', '-')}`}>
                                                                                        {a.status}
                                                                                    </span>
                                                                                </td>
                                                                                <td>
                                                                                    {a.violations > 0 ?
                                                                                        <span className="violation-badge">⚠️ {a.violations}</span> :
                                                                                        <span className="no-violations">None</span>
                                                                                    }
                                                                                </td>
                                                                            </tr>
                                                                        ))
                                                                    ) : (
                                                                        <tr>
                                                                            <td colSpan="4" className="table-empty">No one has attended this test yet.</td>
                                                                        </tr>
                                                                    )}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </section>

                                                    <section className="analytics-section">
                                                        <div className="section-title-row">
                                                            <h3>Not Attended Yet ({analytics.nonAttendees.length})</h3>
                                                        </div>
                                                        <div className="non-attendees-grid">
                                                            {analytics.nonAttendees.length > 0 ? (
                                                                analytics.nonAttendees.map(u => (
                                                                    <div key={u.userId} className="user-profile-card">
                                                                        <div className="avatar-medium">
                                                                            {u.name.charAt(0)}
                                                                        </div>
                                                                        <div className="user-details">
                                                                            <div className="user-name">{u.name}</div>
                                                                            <div className="user-email">{u.email}</div>
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <p className="all-attended">All invited users have completed the test! 🎉</p>
                                                            )}
                                                        </div>
                                                    </section>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="builder-container">
                                <button className="btn-secondary" onClick={() => setShowBuilder(false)} style={{ marginBottom: '1rem' }}>
                                    ← Back to Manage
                                </button>
                                <TestBuilder onTestCreated={() => {
                                    setShowBuilder(false);
                                    fetchTests();
                                }} />
                            </div>
                        )}
                    </div>
                )}
            </main>

            <style jsx>{`
                .assessment-portal {
                    padding: 2rem;
                    color: var(--text-primary);
                }
                .assessment-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                    border-bottom: 1px solid var(--border-primary);
                    padding-bottom: 1rem;
                }
                .assessment-nav {
                    display: flex;
                    gap: 1rem;
                }
                .nav-link {
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    font-weight: 600;
                    cursor: pointer;
                    padding: 0.5rem 1rem;
                    border-radius: var(--radius-md);
                    transition: all 0.2s;
                }
                .nav-link.active {
                    color: var(--primary-mint);
                    background: rgba(0, 255, 163, 0.1);
                }
                .test-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 1.5rem;
                }
                .test-card {
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-primary);
                    border-radius: var(--radius-xl);
                    padding: 1.5rem;
                    transition: transform 0.2s;
                }
                .test-card:hover {
                    transform: translateY(-5px);
                    border-color: var(--primary-mint);
                }
                .test-icon {
                    font-size: 2rem;
                    margin-bottom: 1rem;
                }
                .test-desc {
                    color: var(--text-secondary);
                    font-size: 0.9rem;
                    margin: 1rem 0;
                    height: 3rem;
                    overflow: hidden;
                }
                .test-meta {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 1.5rem;
                    font-size: 0.85rem;
                    color: var(--text-tertiary);
                }
                .manage-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                    gap: 1rem;
                    margin-top: 1rem;
                }
                .manage-card {
                    background: var(--bg-surface);
                    border: 1px solid var(--border-primary);
                    border-radius: var(--radius-lg);
                    padding: 1rem;
                }
                .manage-meta {
                    display: flex;
                    gap: 1rem;
                    font-size: 0.8rem;
                    color: var(--text-secondary);
                    margin: 0.5rem 0 1rem;
                }
                .analytics-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.8);
                    z-index: 1000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 2rem;
                }
                .analytics-modal {
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-primary);
                    border-radius: var(--radius-xl);
                    width: 100%;
                    max-width: 900px;
                    max-height: 90vh;
                    overflow-y: auto;
                    padding: 2rem;
                }
                .analytics-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                }
                .close-btn {
                    background: none; border: none; font-size: 2rem; color: var(--text-secondary); cursor: pointer;
                    transition: color 0.2s;
                }
                .close-btn:hover { color: var(--white); }
                .stats-row {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 1.5rem;
                    margin-bottom: 3rem;
                }
                .stat-card {
                    background: rgba(255, 255, 255, 0.03);
                    padding: 2rem 1.5rem;
                    border-radius: var(--radius-lg);
                    text-align: center;
                    border: 1px solid var(--border-primary);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                }
                .stat-card label { display: block; font-size: 0.85rem; color: var(--text-tertiary); margin-bottom: 0.8rem; text-transform: uppercase; letter-spacing: 1px; }
                .stat-card span { font-size: 2.5rem; font-weight: 800; color: var(--primary-mint); }
                
                .analytics-section {
                    margin-bottom: 3rem;
                }
                .section-title-row {
                    border-left: 4px solid var(--primary-mint);
                    padding-left: 1rem;
                    margin-bottom: 1.5rem;
                }
                .section-title-row h3 { font-size: 1.25rem; }

                .report-table-container { 
                    background: rgba(255, 255, 255, 0.02);
                    border-radius: var(--radius-lg);
                    border: 1px solid var(--border-primary);
                    overflow: hidden;
                }
                .report-table { width: 100%; border-collapse: collapse; }
                .report-table th { 
                    background: rgba(255, 255, 255, 0.05);
                    padding: 1.2rem 1rem;
                    text-align: left;
                    font-size: 0.85rem;
                    color: var(--text-secondary);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .report-table td { padding: 1.2rem 1rem; border-bottom: 1px solid var(--border-primary); vertical-align: middle; }
                .table-empty { text-align: center; padding: 3rem !important; color: var(--text-tertiary); font-style: italic; }

                .user-profile-item { display: flex; align-items: center; gap: 1rem; }
                .avatar-small { 
                    width: 36px; height: 36px; border-radius: 50%; 
                    background: var(--primary-mint); color: var(--black);
                    display: flex; align-items: center; justify-content: center;
                    font-weight: 700; font-size: 0.9rem;
                }
                .avatar-medium { 
                    width: 48px; height: 48px; border-radius: 50%; 
                    background: rgba(255, 255, 255, 0.1); color: var(--white);
                    display: flex; align-items: center; justify-content: center;
                    font-weight: 700; font-size: 1.2rem;
                    margin-bottom: 1rem;
                }
                .user-name { font-weight: 600; color: var(--text-primary); }
                .user-email { font-size: 0.75rem; color: var(--text-tertiary); }
                
                .score-text { font-size: 1.1rem; font-weight: 700; color: var(--white); }
                .score-max { font-size: 0.9rem; color: var(--text-tertiary); }
                
                .status-badge { 
                    padding: 0.3rem 0.8rem; border-radius: 50px; font-size: 0.7rem; font-weight: 700; 
                    text-transform: uppercase; letter-spacing: 0.5px;
                }
                .status-badge.submitted { background: rgba(0, 255, 163, 0.1); color: var(--primary-mint); }
                .status-badge.in-progress { background: rgba(255, 171, 0, 0.1); color: #ffab00; }
                .status-badge.evaluated { background: rgba(0, 150, 255, 0.1); color: #0096ff; }
                
                .violation-badge { background: rgba(255, 71, 87, 0.1); color: #ff4757; padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.8rem; font-weight: 600; }
                .no-violations { color: var(--text-tertiary); font-size: 0.85rem; }

                .non-attendees-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
                    gap: 1.5rem;
                }
                .user-profile-card {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid var(--border-primary);
                    padding: 1.5rem;
                    border-radius: var(--radius-lg);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    transition: transform 0.2s, background 0.2s;
                }
                .user-profile-card:hover { 
                    transform: translateY(-4px);
                    background: rgba(255, 255, 255, 0.05);
                }
                .all-attended { text-align: center; padding: 2rem; color: var(--primary-mint); font-weight: 600; font-size: 1.1rem; }

                .manage-actions {
                    display: flex;
                    gap: 0.5rem;
                }
                .btn-half { flex: 1; padding: 0.6rem; font-size: 0.85rem; }
                .btn-danger {
                    background: rgba(255, 71, 87, 0.1);
                    color: #ff4757;
                    border: 1px solid rgba(255, 71, 87, 0.2);
                    border-radius: var(--radius-md);
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-danger:hover {
                    background: #ff4757;
                    color: white;
                }
            `}</style>
        </div>
    );
};

export default AssessmentPortal;
