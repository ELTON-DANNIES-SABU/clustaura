import React from 'react';
import { Users, Star, Activity } from 'lucide-react';

const TeamSkillPanel = ({ members, analysis }) => {
    return (
        <div className="team-skill-panel">
            <h3><Users size={20} /> Team Skill Matrix</h3>
            <div className="member-skill-list">
                {members.map(member => (
                    <div key={member._id} className="member-skill-card">
                        <div className="member-info">
                            <div className="avatar-small">
                                {member.firstName?.[0]}{member.lastName?.[0]}
                            </div>
                            <div>
                                <h4>{member.firstName} {member.lastName}</h4>
                                <span className="member-role">Software Engineer</span>
                            </div>
                        </div>

                        <div className="skill-progress-section">
                            <div className="workload-bar">
                                <div className="label">Workload</div>
                                <div className="bar-container">
                                    <div
                                        className="bar-fill"
                                        style={{
                                            width: `${(analysis?.overloadedMembers?.find(m => m.userId === member._id)?.workload || 3) * 10}%`,
                                            backgroundColor: (analysis?.overloadedMembers?.find(m => m.userId === member._id)) ? '#ff4757' : '#339933'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="member-skills">
                            {/* In a real app, these would come from UserSkillProfile */}
                            {['React', 'Node.js', 'MongoDB'].map((s, i) => (
                                <span key={i} className="skill-chip">{s}</span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TeamSkillPanel;
