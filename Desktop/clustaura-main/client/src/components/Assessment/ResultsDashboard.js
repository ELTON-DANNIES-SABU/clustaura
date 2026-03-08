import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ResultsDashboard = () => {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchResults();
    }, []);

    const fetchResults = async () => {
        try {
            const userStr = localStorage.getItem('user');
            const userData = JSON.parse(userStr);
            const config = { headers: { Authorization: `Bearer ${userData.token}` } };
            const { data } = await axios.get('/api/assessment/my-results', config);
            setResults(data.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching results:', error);
            setLoading(false);
        }
    };

    if (loading) return <div>Loading results...</div>;

    return (
        <div className="results-dashboard">
            <h2>Your Performance</h2>
            <div className="results-list">
                {results.length > 0 ? (
                    results.map(result => (
                        <div key={result._id} className="result-card">
                            <div className="result-header">
                                <h3>{result.testId?.title}</h3>
                                <span className={`status badge ${result.status.toLowerCase()}`}>{result.status}</span>
                            </div>
                            <div className="result-stats">
                                <div className="stat">
                                    <span className="label">Score</span>
                                    <span className="value">{result.totalScore} / {result.testId?.totalMarks}</span>
                                </div>
                                <div className="stat">
                                    <span className="label">Violations</span>
                                    <span className="value">{result.violations.length}</span>
                                </div>
                            </div>
                            <button className="btn-secondary">View Detailed Feedback</button>
                        </div>
                    ))
                ) : (
                    <p className="empty-state">No results found yet. Take your first test!</p>
                )}
            </div>

            <style jsx>{`
                .results-dashboard {
                    padding: 1rem;
                }
                .results-list {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
                    gap: 1.5rem;
                    margin-top: 1.5rem;
                }
                .result-card {
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-primary);
                    border-radius: var(--radius-lg);
                    padding: 1.5rem;
                }
                .result-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }
                .result-stats {
                    display: flex;
                    gap: 2rem;
                    margin-bottom: 1.5rem;
                }
                .stat {
                    display: flex;
                    flex-direction: column;
                }
                .stat .label {
                    font-size: 0.8rem;
                    color: var(--text-tertiary);
                    text-transform: uppercase;
                }
                .stat .value {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: var(--primary-mint);
                }
                .status.badge {
                    font-size: 0.75rem;
                    padding: 0.2rem 0.6rem;
                }
            `}</style>
        </div>
    );
};

export default ResultsDashboard;
