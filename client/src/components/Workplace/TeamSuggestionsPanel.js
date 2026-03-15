import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, UserPlus, CheckCircle, ExternalLink, Loader2 } from 'lucide-react';
import { useToast } from '../Community/shared/Toast';
const TeamSuggestionsPanel = ({ projectId }) => {
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [inviting, setInviting] = useState({});
    const toast = useToast();

    useEffect(() => {
        fetchSuggestions();
    }, [projectId]);

    const fetchSuggestions = async () => {
        try {
            const userStr = localStorage.getItem('user');
            const { token } = JSON.parse(userStr);
            const { data } = await axios.get(`/api/agents/suggest-team/${projectId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuggestions(data);
        } catch (error) {
            console.error('Error fetching suggestions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddMember = async (userId, tech) => {
        setInviting(prev => ({ ...prev, [userId]: true }));
        try {
            const userStr = localStorage.getItem('user');
            const { token } = JSON.parse(userStr);
            
            // Using existing endpoint if available, adjusting payload per requirements
            await axios.post(`/api/workplace/projects/${projectId}/members`, {
                userId,
                role: `${tech} Developer`
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // Refresh to show updated membership if needed or just show success
            toast.success('Invitation sent successfully!');
        } catch (error) {
            console.error('Error sending invitation:', error);
            toast.error('Failed to send invitation.');
        } finally {
            setInviting(prev => ({ ...prev, [userId]: false }));
        }
    };

    if (loading) return <div className="loading-state"><Loader2 className="spin" /> Calculating best matches...</div>;

    return (
        <div className="team-suggestions-panel">
            <header className="panel-header">
                <h2><Users size={20} /> AI Team Orchestrator</h2>
                <p>Top-ranked candidates based on project skills, experience, and availability.</p>
            </header>

            <div className="suggestions-grid">
                {suggestions.map((stack) => (
                    <div key={stack._id} className="tech-stack-group">
                        <div className="stack-header">
                            <h3>{stack.technology}</h3>
                            <span className="count-badge">{stack.requiredDevelopers} Needed</span>
                        </div>

                        <div className="candidate-list">
                            {stack.suggestedUsers.map(({ user, matchScore }) => (
                                <div key={user._id} className="candidate-card">
                                    <div className="user-info">
                                        <img src={user.avatar || 'https://via.placeholder.com/40'} alt={user.firstName} />
                                        <div className="user-details">
                                            <h4>{user.firstName} {user.lastName}</h4>
                                            <p>{user.email}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="match-metrics">
                                        <div className="score-ring">
                                            <span className="score">{(matchScore * 100).toFixed(0)}%</span>
                                            <span className="label">Match</span>
                                        </div>
                                    </div>

                                    <div className="actions">
                                        <button 
                                            className="add-btn" 
                                            disabled={inviting[user._id]}
                                            onClick={() => handleAddMember(user._id, stack.technology)}
                                        >
                                            {inviting[user._id] ? <Loader2 className="spin" size={16} /> : <UserPlus size={16} />}
                                            {inviting[user._id] ? 'Sending...' : 'Send Invitation'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TeamSuggestionsPanel;
