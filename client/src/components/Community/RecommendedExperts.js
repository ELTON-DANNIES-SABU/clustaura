import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './RecommendedExperts.css';

const RecommendedExperts = ({ challengeId, onInvite, onMessage, projects = [], selectedProjectId, onProjectChange }) => {
    const [experts, setExperts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                const userStr = localStorage.getItem('user');
                if (!userStr) {
                    console.log('[RecommendedExperts] No user in localStorage');
                    return;
                }
                const { token } = JSON.parse(userStr);
                const config = { headers: { Authorization: `Bearer ${token}` } };

                console.log('[RecommendedExperts] Fetching recommendations for challenge:', challengeId);
                const { data } = await axios.get(`/api/challenges/${challengeId}/recommendations`, config);
                console.log('[RecommendedExperts] Received experts:', data);
                setExperts(data);
                setLoading(false);
            } catch (error) {
                console.error('[RecommendedExperts] Error fetching recommendations:', error);
                console.error('[RecommendedExperts] Error response:', error.response?.data);
                setLoading(false);
            }
        };

        if (challengeId) {
            fetchRecommendations();
        }
    }, [challengeId]);

    if (loading) {
        return <div className="experts-loader">Finding experts...</div>;
    }

    if (experts.length === 0) {
        console.log('[RecommendedExperts] No experts found, hiding panel');
        return null; // Don't show if no experts found
    }

    return (
        <div className="recommended-experts-container">
            <div className="experts-header">
                <h3 className="experts-title">AI Suggested Experts</h3>
                {projects.length > 0 && (
                    <div className="project-select-wrapper">
                        <label htmlFor="project-invite-select">Invite to Project:</label>
                        <select
                            id="project-invite-select"
                            className="project-invite-dropdown"
                            value={selectedProjectId}
                            onChange={(e) => onProjectChange(e.target.value)}
                        >
                            {projects.map(p => (
                                <option key={p._id} value={p._id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
            <div className="experts-list">
                {experts.map((expert) => (
                    <div key={expert.user_id} className="expert-card">
                        <div className="expert-avatar">{expert.initials}</div>
                        <div className="expert-info">
                            <h4 className="expert-name">{expert.userName}</h4>
                            <div className="expert-score">
                                <span className="score-badge">{expert.match_score}% Match</span>
                            </div>
                            <p className="expert-explanation">{expert.explanation}</p>
                            <div className="expert-skills">
                                {expert.key_skills.map(skill => (
                                    <span key={skill} className="mini-skill-tag">{skill}</span>
                                ))}
                            </div>
                        </div>
                        <div className="expert-actions">
                            <button
                                className="message-expert-btn"
                                onClick={() => onMessage(expert.user_id)}
                                style={{
                                    background: 'rgba(13, 239, 239, 0.1)',
                                    color: 'var(--neon-green)',
                                    border: '1px solid var(--neon-green)',
                                    padding: '8px',
                                    borderRadius: '6px',
                                    fontSize: '0.85rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    flex: 1
                                }}
                            >
                                Message
                            </button>
                            <button
                                className="invite-expert-btn"
                                onClick={() => onInvite(expert.user_id, selectedProjectId)}
                                disabled={!selectedProjectId}
                                style={{ flex: 2 }}
                            >
                                Invite to Team
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecommendedExperts;
