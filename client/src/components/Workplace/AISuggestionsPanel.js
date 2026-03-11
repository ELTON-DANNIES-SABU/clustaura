import React from 'react';
import { Sparkles, AlertTriangle, Zap, UserPlus, Lightbulb, TrendingUp } from 'lucide-react';

const AISuggestionsPanel = ({ analysis }) => {
    if (!analysis) return (
        <div className="ai-suggestions-panel">
            <div className="panel-header">
                <h3><Sparkles size={18} color="#00FF9C" /> Autonomous Insights</h3>
                <span className="auto-badge">Monitoring</span>
            </div>
            <div className="no-suggestions">
                <Zap size={24} opacity={0.3} />
                <p>Establishing neural link... Analyzing development patterns.</p>
            </div>
        </div>
    );

    const { missingSkills, recommendations, overloadedMembers } = analysis;

    return (
        <div className="ai-suggestions-panel">
            <div className="panel-header">
                <h3><Sparkles size={18} color="#00FF9C" /> Autonomous Insights</h3>
                <span className="auto-badge">Active</span>
            </div>

            <div className="suggestions-list">
                {missingSkills.length > 0 && (
                    <div className="suggestion-item alert">
                        <div className="suggestion-icon"><AlertTriangle size={16} /></div>
                        <div className="suggestion-content">
                            <h4>Skill Gap Detected</h4>
                            <p>Missing expertise in: <strong>{missingSkills.join(', ')}</strong>. Consider autonomous hiring agents.</p>
                        </div>
                    </div>
                )}

                {overloadedMembers.length > 0 && (
                    <div className="suggestion-item warning">
                        <div className="suggestion-icon"><Zap size={16} /></div>
                        <div className="suggestion-content">
                            <h4>Capacity Bottleneck</h4>
                            <p>{overloadedMembers.length} team members are over capacity. AI suggests sprint re-balancing.</p>
                        </div>
                    </div>
                )}

                {recommendations.map((rec, idx) => (
                    <div key={idx} className="suggestion-item info">
                        <div className="suggestion-icon"><Lightbulb size={16} /></div>
                        <div className="suggestion-content">
                            <p>{rec}</p>
                        </div>
                    </div>
                ))}

                {missingSkills.length === 0 && overloadedMembers.length === 0 && recommendations.length === 0 && (
                    <div className="no-suggestions">
                        <Sparkles size={24} color="#00FF9C" opacity={0.5} />
                        <p>SDLC optimized. AI Agents are currently overseeing development velocity.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AISuggestionsPanel;
