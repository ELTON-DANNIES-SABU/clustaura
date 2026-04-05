import React from 'react';
import { Users, Star, Activity } from 'lucide-react';
import axios from 'axios';
import './TeamSkillPanel.css';

const TeamSkillPanel = ({ members, analysis, isOwner, projectId, onMemberUpdate, onKickMember }) => {
    const handleGithubSync = async (userId) => {
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) return;
            const { token } = JSON.parse(userStr);
            const { data } = await axios.post(`/api/workplace/projects/${projectId}/members/${userId}/github-invite`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert(data.message || 'GitHub invitation sent successfully!');
        } catch (error) {
            console.error('Error syncing GitHub:', error);
            alert(error.response?.data?.message || 'Error sending GitHub invitation. Make sure they have a GitHub username in their ClustAura profile.');
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) return;
            const { token } = JSON.parse(userStr);

            const { data } = await axios.put(`/api/workplace/projects/${projectId}/members/${userId}/role`, 
                { role: newRole },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (onMemberUpdate) onMemberUpdate(data);
        } catch (error) {
            console.error('Error updating member role:', error);
            alert(error.response?.data?.message || 'Failed to update role');
        }
    };

    return (
        <div className="team-skill-panel">
            <h3><Users size={20} /> Team Skill Matrix</h3>
            <div className="member-skill-list">
                {members.map((memberObj, idx) => {
                    const member = memberObj.user;
                    const role = memberObj.role;

                    return (
                        <div key={member?._id || idx} className="member-skill-card">
                            <div className="member-info">
                                <div className="avatar-small">
                                    {member?.avatar ? (
                                        <img src={member.avatar} alt={`${member.firstName || ''} ${member.lastName || ''}`} />
                                    ) : (
                                        <div className="avatar-placeholder">
                                            {(member?.firstName?.[0] || '') + (member?.lastName?.[0] || '') || role?.[0]}
                                        </div>
                                    )}
                                </div>
                                <div className="member-details">
                                    <div className="name-row">
                                        <h4 className="member-name">
                                            {member?.firstName ? `${member.firstName} ${member.lastName || ''}` : (role || 'Member')}
                                        </h4>
                                        {role && (
                                            <span className={`role-badge ${role.split(' ')[0].toLowerCase()}`}>
                                                {role.includes('(') ? role.split('(')[0].trim() : role}
                                            </span>
                                        )}
                                    </div>
                                    <p className="member-email">{member?.email || 'System Account'}</p>
                                    {role && role.includes('(') && (
                                        <div className="member-specialization">
                                            {role.match(/\((.*?)\)/)?.[1] || role}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="skill-progress-section">
                                <div className="workload-bar">
                                    <div className="label">Workload</div>
                                    <div className="bar-container">
                                        <div
                                            className="bar-fill"
                                            style={{
                                                width: `${(analysis?.overloadedMembers?.find(m => m.userId === member?._id)?.workload || 3) * 10}%`,
                                                backgroundColor: (analysis?.overloadedMembers?.find(m => m.userId === member?._id)) ? '#ff4757' : '#00A3FF'
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="member-actions">
                                {isOwner && role !== 'Project Owner' && (
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button 
                                            className="role-toggle-btn"
                                            onClick={() => handleRoleChange(member?._id, role === 'Project Lead' ? 'Member' : 'Project Lead')}
                                        >
                                            {role === 'Project Lead' ? 'Demote to Member' : 'Promote to Project Lead'}
                                        </button>
                                        <button 
                                            className="role-toggle-btn"
                                            style={{ backgroundColor: 'transparent', color: '#00FFA3', border: '1px solid #00FFA3', padding: '0 8px' }}
                                            onClick={() => handleGithubSync(member?._id)}
                                            title="Resend GitHub Invitation"
                                        >
                                            Sync GitHub
                                        </button>
                                        <button 
                                            className="role-toggle-btn kick-btn"
                                            style={{ backgroundColor: 'transparent', color: '#ff4757', border: '1px solid #ff4757' }}
                                            onClick={() => { if (onKickMember) onKickMember(member?._id); }}
                                        >
                                            Kick
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TeamSkillPanel;
