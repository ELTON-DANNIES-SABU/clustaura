import React, { useState } from 'react';
import axios from 'axios';
import { Sparkles, Send, Loader2 } from 'lucide-react';

const ProjectImprovisationInput = ({ projectId, onPlanImprovised }) => {
    const [query, setQuery] = useState('');
    const [isImprovising, setIsImprovising] = useState(false);

    const handleImprovise = async () => {
        if (!query.trim()) return;

        setIsImprovising(true);
        try {
            const userStr = localStorage.getItem('user');
            const { token } = JSON.parse(userStr);
            const { data } = await axios.post('/api/agents/improvise-project', {
                projectId,
                improvisationQuery: query
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setQuery('');
            onPlanImprovised(data);
        } catch (error) {
            console.error('Improvisation Error:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
            alert(`AI failed to improvise plan: ${errorMsg}`);
        } finally {
            setIsImprovising(false);
        }
    };

    return (
        <div className="project-init-panel improvisation-panel" style={{ marginTop: '20px', borderTop: '1px solid rgba(0, 255, 156, 0.1)', paddingTop: '20px' }}>
            <div className="panel-header">
                <h2><Sparkles size={20} color="#00FF9C" /> Improvise & Expand</h2>
                <p>Add new features or refine your existing project plan.</p>
            </div>

            <div className="input-group">
                <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g., Add a payment gateway module with Stripe integration and user subscription management..."
                    rows="3"
                    disabled={isImprovising}
                    style={{ background: 'rgba(0,0,0,0.2)', borderColor: 'rgba(0, 255, 156, 0.2)' }}
                />
            </div>

            <button
                className={`generate-btn ${isImprovising ? 'loading' : ''}`}
                onClick={handleImprovise}
                disabled={isImprovising || !query.trim()}
                style={{ background: 'linear-gradient(135deg, #00FF9C 0%, #00d1ff 100%)', color: '#000' }}
            >
                {isImprovising ? (
                    <><Loader2 className="spin" size={20} /> Re-Architecting Plan...</>
                ) : (
                    <><Sparkles size={20} /> Improvise Plan</>
                )}
            </button>
        </div>
    );
};

export default ProjectImprovisationInput;
