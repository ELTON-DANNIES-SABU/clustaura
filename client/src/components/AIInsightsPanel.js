import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './AIInsightsPanel.css';

const AIInsightsPanel = ({ sprintId }) => {
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchInsights = async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`/ai/sprint/${sprintId}/insights`);
            setInsights(data);
            setLoading(false);
        } catch (err) {
            setError(err.message || 'Failed to load insights');
            setLoading(false);
        }
    };

    useEffect(() => {
        if (sprintId) {
            fetchInsights();
        }
    }, [sprintId]);

    if (!sprintId) return null;
    if (loading) return <div className="ai-panel loading">Analyzing Board State...</div>;
    if (error) return <div className="ai-panel error">Analysis Failed: {error}</div>;
    if (!insights) return null;

    const { health, bottlenecks, userLoad, suggestions, narrative } = insights;

    return (
        <div className="ai-insights-panel">
            <div className="ai-header">
                <h3>🧠 Sprint Intelligence</h3>
                <span className={`risk-badge ${health.riskLevel.toLowerCase()}`}>
                    {health.riskLevel} Risk ({health.probability}% Success Change)
                </span>
            </div>

            <div className="ai-narrative">
                <p>{narrative}</p>
            </div>

            <div className="ai-section">
                <h4>Capacity & Workload</h4>
                <div className="workload-bars">
                    {Object.values(userLoad).map(user => (
                        <div key={user.name} className="workload-item">
                            <div className="workload-info">
                                <span>{user.name}</span>
                                <span>{user.utilization}%</span>
                            </div>
                            <div className="progress-bar-bg">
                                <div
                                    className={`progress-fill ${user.utilization > 120 ? 'overload' : user.utilization < 70 ? 'underload' : 'optimal'}`}
                                    style={{ width: `${Math.min(user.utilization, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {bottlenecks.length > 0 && (
                <div className="ai-section">
                    <h4>Stage Bottlenecks</h4>
                    <ul>
                        {bottlenecks.map((b, idx) => (
                            <li key={idx}>⚠️ <strong>{b.stage}</strong>: {b.percentage}% of tasks</li>
                        ))}
                    </ul>
                </div>
            )}

            {suggestions.length > 0 && (
                <div className="ai-section">
                    <h4>Optimization Suggestions</h4>
                    <ul className="suggestions-list">
                        {suggestions.map((s, idx) => (
                            <li key={idx} className="suggestion-item">
                                <div className="suggestion-text">
                                    <span className="icon">💡</span>
                                    {s.type === 'MOVE_WORK' ? (
                                        <span>Move <strong>{s.points} pts</strong> from {s.fromUser} to {s.toUser}</span>
                                    ) : s.reason}
                                </div>
                                <button className="apply-btn-sm" onClick={() => alert('Auto-apply not implemented yet')}>Apply</button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <button className="refresh-insights-btn" onClick={fetchInsights}>
                🔄 Refresh Analysis
            </button>
        </div>
    );
};

export default AIInsightsPanel;
