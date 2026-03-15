import React from 'react';
import { Users2, ShieldAlert } from 'lucide-react';

const TeamRequirementPanel = ({ requirements }) => {
    return (
        <div className="team-requirement-panel">
            <div className="panel-header">
                <h3><Users2 size={20} /> Team Capacity Requirements</h3>
                <p>Estimates based on module complexity and ticket volume</p>
            </div>

            <div className="requirements-grid">
                {requirements.map((req, idx) => (
                    <div key={idx} className="requirement-card">
                        <div className="req-tech">{req.technology}</div>
                        <div className="req-stats">
                            <div className="stat">
                                <span className="label">Required</span>
                                <span className="value">{req.requiredDevelopers}</span>
                            </div>
                            <div className="stat">
                                <span className="label">Current</span>
                                <span className="value">{req.currentDevelopers}</span>
                            </div>
                            <div className={`stat gap ${req.gap > 0 ? 'alert' : ''}`}>
                                <span className="label">Gap</span>
                                <span className="value">{req.gap}</span>
                            </div>
                        </div>
                        {req.gap > 0 && (
                            <div className="gap-warning">
                                <ShieldAlert size={14} />
                                <span>Action Required: Hire {req.gap} {req.technology} Devs</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TeamRequirementPanel;
