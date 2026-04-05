import React from 'react';
import { Users2, ShieldAlert } from 'lucide-react';

const TeamRequirementPanel = ({ requirements }) => {
    if (!requirements || requirements.length === 0) {
        return (
            <div className="team-requirement-panel">
                <div className="panel-header">
                    <h3><Users2 size={20} /> Team Capacity Requirements</h3>
                    <p>Estimates based on module complexity and ticket volume</p>
                </div>
                <div className="empty-requirement-state">
                    <ShieldAlert size={48} color="rgba(255, 255, 255, 0.1)" />
                    <h3>No Requirements Defined</h3>
                    <p>We haven't generated workforce estimates for this project yet. This happens automatically when you create or refine an AI SDLC Plan.</p>
                </div>
                <style jsx>{`
                    .empty-requirement-state {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        gap: 16px;
                        padding: 60px 20px;
                        text-align: center;
                        background: rgba(255, 255, 255, 0.02);
                        border-radius: 12px;
                        border: 1px dashed rgba(255, 255, 255, 0.1);
                        margin-top: 16px;
                    }
                    .empty-requirement-state h3 {
                        margin: 0;
                        color: rgba(255, 255, 255, 0.8);
                    }
                    .empty-requirement-state p {
                        margin: 0;
                        color: rgba(255, 255, 255, 0.4);
                        max-width: 400px;
                        font-size: 0.9rem;
                        line-height: 1.5;
                    }
                `}</style>
            </div>
        );
    }

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
