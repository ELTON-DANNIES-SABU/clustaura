import React, { useState } from 'react';
import axios from 'axios';

const TestBuilder = ({ onTestCreated }) => {
    const [testData, setTestData] = useState({
        title: '',
        description: '',
        duration: 30,
        totalMarks: 100,
        passMarks: 40,
        rules: {
            shuffleQuestions: true,
            fullScreenEnforcement: true,
            tabSwitchDetection: true
        },
        invitedUsers: []
    });

    const [userSearch, setUserSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    const [requirements, setRequirements] = useState([
        { category: 'Aptitude', difficulty: 'Easy', count: 0 },
        { category: 'Logical Reasoning', difficulty: 'Intermediate', count: 0 },
        { category: 'Verbal', difficulty: 'Intermediate', count: 0 },
        { category: 'Technical', difficulty: 'Hard', count: 0 },
    ]);

    const handleReqChange = (idx, field, value) => {
        const newReqs = [...requirements];
        newReqs[idx][field] = field === 'count' ? parseInt(value) || 0 : value;
        setRequirements(newReqs);
    };

    const handleUserSearch = async (query) => {
        setUserSearch(query);
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }
        try {
            const userStr = localStorage.getItem('user');
            const userData = JSON.parse(userStr);
            const { data } = await axios.get(`/api/search?q=${query}`, {
                headers: { Authorization: `Bearer ${userData.token}` }
            });
            setSearchResults(data.users || []);
        } catch (error) {
            console.error('Search error:', error);
        }
    };

    const toggleUserInvite = (user) => {
        const isInvited = testData.invitedUsers.some(u => u._id === user._id);
        if (isInvited) {
            setTestData({
                ...testData,
                invitedUsers: testData.invitedUsers.filter(u => u._id !== user._id)
            });
        } else {
            setTestData({
                ...testData,
                invitedUsers: [...testData.invitedUsers, user]
            });
        }
        setUserSearch('');
        setSearchResults([]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const userStr = localStorage.getItem('user');
            const userData = JSON.parse(userStr);
            const config = {
                headers: { Authorization: `Bearer ${userData.token}` }
            };

            const payload = {
                ...testData,
                invitedUsers: testData.invitedUsers.map(u => u._id),
                requirements: requirements.filter(r => r.count > 0)
            };
            const response = await axios.post('/api/assessment/tests/auto-generate', payload, config);

            if (response.data.success) {
                if (response.data.warnings && response.data.warnings.length > 0) {
                    alert('Test created, but with some issues:\n' + response.data.warnings.join('\n'));
                } else {
                    alert('Test created successfully!');
                }
                onTestCreated && onTestCreated();
            }
        } catch (error) {
            console.error('Error creating test:', error);
            alert(error.response?.data?.message || 'Failed to create test');
        }
    };

    return (
        <div className="test-builder">

            <form onSubmit={handleSubmit} className="builder-form">
                <div className="form-group">
                    <label>Test Title</label>
                    <input
                        type="text"
                        value={testData.title}
                        onChange={(e) => setTestData({ ...testData, title: e.target.value })}
                        placeholder="e.g. Senior Fullstack Screening"
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Description</label>
                    <textarea
                        value={testData.description}
                        onChange={(e) => setTestData({ ...testData, description: e.target.value })}
                        placeholder="e.g. This test evaluates your logical and technical skills..."
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Duration (mins)</label>
                        <input
                            type="number"
                            value={testData.duration}
                            onChange={(e) => setTestData({ ...testData, duration: parseInt(e.target.value) })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Pass Marks</label>
                        <input
                            type="number"
                            value={testData.passMarks}
                            onChange={(e) => setTestData({ ...testData, passMarks: parseInt(e.target.value) })}
                        />
                    </div>
                </div>

                <div className="auto-gen-section">
                    <h4>Question Requirements</h4>
                    <p className="helper-text">Specify how many questions you want from each category.</p>
                    {requirements.map((req, idx) => (
                        <div key={idx} className="req-row">
                            <span className="category-label">{req.category}</span>
                            <select
                                value={req.difficulty}
                                onChange={(e) => handleReqChange(idx, 'difficulty', e.target.value)}
                            >
                                <option value="Easy">Easy</option>
                                <option value="Intermediate">Intermediate</option>
                                <option value="Hard">Hard</option>
                            </select>
                            <input
                                type="number"
                                placeholder="Count"
                                min="0"
                                value={req.count}
                                onChange={(e) => handleReqChange(idx, 'count', e.target.value)}
                            />
                        </div>
                    ))}
                </div>

                <div className="rules-section">
                    <h4>Proctoring Rules</h4>
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={testData.rules.fullScreenEnforcement}
                            onChange={(e) => setTestData({
                                ...testData,
                                rules: { ...testData.rules, fullScreenEnforcement: e.target.checked }
                            })}
                        />
                        Enforce Full Screen
                    </label>
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={testData.rules.tabSwitchDetection}
                            onChange={(e) => setTestData({
                                ...testData,
                                rules: { ...testData.rules, tabSwitchDetection: e.target.checked }
                            })}
                        />
                        Detect Tab Switching
                    </label>
                </div>

                <div className="invite-section">
                    <h4>Invite Candidates</h4>
                    <p className="helper-text">Search for users to invite them to this assessment.</p>
                    <div className="search-container">
                        <input
                            type="text"
                            value={userSearch}
                            onChange={(e) => handleUserSearch(e.target.value)}
                            placeholder="Search by name or email..."
                        />
                        {searchResults.length > 0 && (
                            <div className="search-dropdown">
                                {searchResults.map(user => (
                                    <div key={user._id} className="search-item" onClick={() => toggleUserInvite(user)}>
                                        <span>{user.firstName} {user.lastName}</span>
                                        <span className="user-email">{user.email}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="invited-list">
                        {testData.invitedUsers.map(user => (
                            <div key={user._id} className="invited-chip">
                                {user.firstName}
                                <button type="button" onClick={() => toggleUserInvite(user)}>&times;</button>
                            </div>
                        ))}
                    </div>
                </div>

                <button type="submit" className="btn-primary btn-full">
                    Generate Test
                </button>
            </form>

            <style jsx>{`
                .test-builder {
                    background: var(--bg-surface);
                    border: 1px solid var(--border-primary);
                    border-radius: var(--radius-lg);
                    padding: 2rem;
                    max-width: 600px;
                }
                .req-row {
                    display: grid;
                    grid-template-columns: 2fr 1.5fr 1fr;
                    gap: 1rem;
                    align-items: center;
                    margin-bottom: 1rem;
                }
                .category-label {
                    font-size: 0.9rem;
                    font-weight: 600;
                }
                .builder-form { display: flex; flex-direction: column; gap: 1.5rem; }
                .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
                .checkbox-label { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; cursor: pointer; }
                input, select, textarea { 
                    padding: 0.8rem; 
                    background: var(--bg-secondary); 
                    border: 1px solid var(--border-primary);
                    border-radius: var(--radius-md);
                    color: var(--text-primary);
                }
                .invite-section { margin-top: 1rem; }
                .search-container { position: relative; }
                .search-dropdown {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    background: #1a1a20;
                    border: 1px solid var(--border-primary);
                    border-radius: var(--radius-md);
                    z-index: 100;
                    max-height: 200px;
                    overflow-y: auto;
                }
                .search-item {
                    padding: 0.8rem;
                    cursor: pointer;
                    display: flex;
                    flex-direction: column;
                }
                .search-item:hover { background: rgba(255, 255, 255, 0.05); }
                .user-email { font-size: 0.75rem; color: #888; }
                .invited-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                    margin-top: 1rem;
                }
                .invited-chip {
                    background: rgba(0, 255, 163, 0.1);
                    color: var(--primary-mint);
                    padding: 0.3rem 0.8rem;
                    border-radius: 50px;
                    font-size: 0.85rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .invited-chip button {
                    background: none;
                    border: none;
                    color: var(--primary-mint);
                    cursor: pointer;
                    font-size: 1.2rem;
                }
                .rules-section {
                    background: rgba(255, 255, 255, 0.02);
                    padding: 1rem;
                    border-radius: var(--radius-md);
                    border: 1px solid var(--border-primary);
                }
                .rules-section h4 { margin-bottom: 1rem; }
            `}</style>
        </div>
    );
};

export default TestBuilder;
