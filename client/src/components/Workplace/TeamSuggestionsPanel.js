import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { Users, UserPlus, CheckCircle, ExternalLink, Loader2, ShieldAlert, Zap, X, Rocket } from 'lucide-react';
import { useToast } from '../Community/shared/Toast';
import './TeamSuggestionsPanel.css';

const TeamSuggestionsPanel = ({ projectId }) => {
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [inviting, setInviting] = useState({});
    const [imageError, setImageError] = useState({});
    const [error, setError] = useState(null);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [inviteDescription, setInviteDescription] = useState('');
    const [inviteWorkDetails, setInviteWorkDetails] = useState('');
    const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const toast = useToast();

    useEffect(() => {
        fetchSuggestions();
    }, [projectId]);

    const fetchSuggestions = async () => {
        try {
            setLoading(true);
            setError(null);
            const userStr = localStorage.getItem('user');
            if (!userStr) return;
            const { token } = JSON.parse(userStr);
            const { data } = await axios.get(`/api/agents/suggest-team/${projectId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuggestions(data);
        } catch (err) {
            console.error('Error fetching suggestions:', err);
            setError(err.response?.data?.message || 'Failed to calculate team suggestions. Ensure you have generated an SDLC plan first.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddMember = async (userId, tech) => {
        const candidate = findCandidate(userId);
        if (!candidate) {
            console.error('Candidate not found for ID:', userId);
            return;
        }

        setSelectedCandidate({ ...candidate, technology: tech });
        setShowInviteModal(true);
        setShowSuccessModal(false);
        
        // Auto-generate on open
        generateCandidateInvite(userId, tech);
    };

    const findCandidate = (userId) => {
        if (!userId) return null;
        const searchId = userId.toString();
        for (const stack of suggestions) {
            const found = stack.suggestedUsers.find(u => u.user && u.user._id && u.user._id.toString() === searchId);
            if (found) return found.user;
        }
        return null;
    };

    const generateCandidateInvite = async (userId, role) => {
        setIsGeneratingInvite(true);
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) return;
            const { token } = JSON.parse(userStr);
            const res = await axios.post(`/api/workplace/projects/${projectId}/generate-invite-details`,
                { role, userId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setInviteDescription(res.data.description);
            setInviteWorkDetails(res.data.workDetails);
        } catch (error) {
            console.error('Error generating invite details:', error);
            toast.error('Failed to generate AI description');
        } finally {
            setIsGeneratingInvite(false);
        }
    };

    const confirmSendInvitation = async () => {
        if (!selectedCandidate) {
            console.error('[DEBUG] No candidate selected');
            return;
        }
        const userId = selectedCandidate._id;
        
        setInviting(prev => ({ ...prev, [userId]: true }));
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) {
                console.error('[DEBUG] No user found in localStorage');
                return;
            }
            const { token } = JSON.parse(userStr);
            if (!token) {
                console.error('[DEBUG] No token found in user object');
                return;
            }

            // Ensure content is string (handles cases where AI returns arrays)
            const finalDescription = Array.isArray(inviteDescription) ? inviteDescription.join('\n') : inviteDescription;
            const finalWorkDetails = Array.isArray(inviteWorkDetails) ? inviteWorkDetails.join('\n') : inviteWorkDetails;
            
            await axios.post(`/api/workplace/projects/${projectId}/members`, {
                userId,
                role: selectedCandidate.technology || 'Member',
                description: finalDescription,
                workDetails: finalWorkDetails
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            toast.success('Invitation sent successfully!');
            setShowInviteModal(false);
            setShowSuccessModal(true);
        } catch (error) {
            console.error('Error sending invitation:', error);
            toast.error(error.response?.data?.message || 'Failed to send invitation.');
        } finally {
            setInviting(prev => ({ ...prev, [userId]: false }));
        }
    };

    if (loading) return <div className="loading-state"><Loader2 className="spin" /> Calculating best matches...</div>;

    if (error) {
        return (
            <div className="team-suggestions-panel">
                <div className="error-state">
                    <ShieldAlert size={48} color="var(--error)" />
                    <h3>Workforce Allocation Engine</h3>
                    <p>{error}</p>
                    <button className="retry-btn" onClick={fetchSuggestions}>Retry Check</button>
                </div>
            </div>
        );
    }

    if (suggestions.length === 0) {
        return (
            <div className="team-suggestions-panel">
                <div className="empty-state">
                    <Users size={48} color="rgba(255, 255, 255, 0.1)" />
                    <h3>No Suggestions Found</h3>
                    <p>We found the requirements, but no platform users currently match the required skill profile closely enough. Try adjusting your project's recommended technologies.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="team-suggestions-panel">
            <header className="panel-header">
                <h2><Users size={20} /> AI Team Orchestrator</h2>
                <p>Top-ranked candidates based on project skills, experience, and availability.</p>
            </header>

            <div className="suggestions-grid">
                {suggestions.map((stack, sIdx) => (
                    <div key={stack.technology || sIdx} className="tech-stack-group">
                        <div className="stack-header">
                            <h3>{stack.technology}</h3>
                            <span className="count-badge">{stack.requiredDevelopers} Needed</span>
                        </div>

                        <div className="candidate-list">
                            {stack.suggestedUsers.map(({ user, matchScore, ontologyScore, bioScore, postScore, availabilityScore, pendingTickets }) => (
                                <div key={user?._id} className="candidate-card">
                                    <div className="user-info">
                                        {(user?.avatar && !imageError[user?._id]) ? (
                                            <img 
                                                src={user.avatar.startsWith('http') ? user.avatar : `/${user.avatar}`} 
                                                alt={user?.firstName} 
                                                onError={() => setImageError(prev => ({...prev, [user._id]: true}))}
                                            />
                                        ) : (
                                            <div className="avatar-fallback">
                                                {user?.firstName?.charAt(0) || 'U'}{user?.lastName?.charAt(0) || ''}
                                            </div>
                                        )}
                                        <div className="user-details">
                                            <div className="name-row">
                                                <h4>{user?.firstName} {user?.lastName}</h4>
                                                {pendingTickets > 0 && (
                                                    <span className={`workload-tag ${pendingTickets > 5 ? 'high' : 'medium'}`}>
                                                        {pendingTickets} active {pendingTickets === 1 ? 'task' : 'tasks'}
                                                    </span>
                                                )}
                                                {pendingTickets === 0 && (
                                                    <span className="workload-tag low">Available</span>
                                                )}
                                            </div>
                                            <p>{user?.email}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="match-metrics-detailed">
                                        <div className="main-score">
                                            <div 
                                                className="score-ring" 
                                                style={{ background: `conic-gradient(#00FFA3 ${(matchScore * 100).toFixed(0)}%, rgba(255, 255, 255, 0.05) 0)` }}
                                            >
                                                <div className="score-inner">
                                                    <span className="score">{(matchScore * 100).toFixed(0)}%</span>
                                                    <span className="label">Match</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="score-breakdown">
                                            <div className="breakdown-item">
                                                <span className="name">Skills</span>
                                                <span className={`value ${ontologyScore > 0.7 ? 'good' : 'fair'}`}>
                                                    {ontologyScore > 0.8 ? 'Strong' : ontologyScore > 0.5 ? 'Good' : 'Moderate'}
                                                </span>
                                            </div>
                                            <div className="breakdown-item">
                                                <span className="name">Bio/Posts</span>
                                                <span className={`value ${bioScore > 0.5 ? 'good' : 'fair'}`}>
                                                    {bioScore > 0.7 ? 'Expert' : bioScore > 0.4 ? 'Proven' : 'Foundations'}
                                                </span>
                                            </div>
                                            <div className="breakdown-item">
                                                <span className="name">Availability</span>
                                                <span className={`value ${availabilityScore > 0.7 ? 'good' : 'fair'}`}>
                                                    {availabilityScore > 0.8 ? 'Free' : availabilityScore > 0.4 ? 'Busy' : 'Overloaded'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="actions">
                                        <button 
                                            className="add-btn" 
                                            disabled={!user?._id || inviting[user._id]}
                                            onClick={() => user?._id && handleAddMember(user._id, stack.technology)}
                                        >
                                            {(user?._id && inviting[user._id]) ? <Loader2 className="spin" size={16} /> : <UserPlus size={16} />}
                                            {(user?._id && inviting[user._id]) ? 'Sending...' : 'Send Invitation'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {showInviteModal && selectedCandidate && createPortal(
                <div className="invite-modal-overlay">
                    <div className="invite-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Review AI Invitation</h3>
                            <button className="close-btn" onClick={() => setShowInviteModal(false)}><X size={20}/></button>
                        </div>
                        
                        <div className="candidate-summary">
                            <div className="mini-avatar">
                                {selectedCandidate.firstName?.charAt(0)}{selectedCandidate.lastName?.charAt(0)}
                            </div>
                            <div className="mini-details">
                                <strong>{selectedCandidate.firstName} {selectedCandidate.lastName}</strong>
                                <span>Role: {selectedCandidate.technology}</span>
                            </div>
                        </div>

                        <div className="invite-fields">
                            <div className="field-group">
                                <label>Why join our project?</label>
                                <textarea 
                                    value={inviteDescription} 
                                    onChange={(e) => setInviteDescription(e.target.value)}
                                    placeholder="Generating description..."
                                    disabled={isGeneratingInvite}
                                />
                            </div>
                            <div className="field-group">
                                <label>Specific Work & Milestones</label>
                                <textarea 
                                    value={inviteWorkDetails} 
                                    onChange={(e) => setInviteWorkDetails(e.target.value)}
                                    placeholder="Generating work details..."
                                    disabled={isGeneratingInvite}
                                />
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button 
                                className="regenerate-btn" 
                                onClick={() => generateCandidateInvite(selectedCandidate._id, selectedCandidate.technology)}
                                disabled={isGeneratingInvite}
                            >
                                <Zap size={14} className={isGeneratingInvite ? 'spin' : ''} /> 
                                {isGeneratingInvite ? 'Processing...' : 'Regenerate AI'}
                            </button>
                            <div className="primary-actions">
                                <button className="cancel-btn" onClick={() => setShowInviteModal(false)}>Cancel</button>
                                <button 
                                    className="send-btn" 
                                    onClick={confirmSendInvitation}
                                    disabled={isGeneratingInvite || inviting[selectedCandidate._id]}
                                >
                                    {inviting[selectedCandidate._id] ? <Loader2 size={14} className="spin" /> : <UserPlus size={14} />}
                                    Send Final Invitation
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {showSuccessModal && selectedCandidate && createPortal(
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="modal-content success-modal" style={{ textAlign: 'center', padding: '40px 24px', width: '450px', position: 'relative' }}>
                        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(0, 255, 163, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <CheckCircle size={48} color="#00FFA3" />
                            </div>
                        </div>
                        <h2 style={{ fontSize: '1.8rem', marginBottom: '12px', color: '#fff', fontWeight: 'bold' }}>Invitation Sent!</h2>
                        <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '32px', fontSize: '1rem', lineHeight: '1.5' }}>
                            The professional brief has been successfully delivered to <strong>{selectedCandidate.firstName} {selectedCandidate.lastName}</strong>.
                        </p>
                        <button 
                            className="create-btn ai-sparkle" 
                            style={{ width: '100%', padding: '14px', borderRadius: '8px', fontSize: '1rem', background: '#00FFA3', color: '#000', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            onClick={() => setShowSuccessModal(false)}
                        >
                            <Rocket size={18} /> Continue Matching
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default TeamSuggestionsPanel;
