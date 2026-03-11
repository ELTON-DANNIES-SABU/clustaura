import React, { useState } from 'react';
import axios from 'axios';
import { FileText, Send, Loader2 } from 'lucide-react';

const ProjectInitializationInput = ({ projectId, projectName, onPlanGenerated }) => {
    const [description, setDescription] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async () => {
        if (!description.trim()) return;

        setIsGenerating(true);
        try {
            const userStr = localStorage.getItem('user');
            const { token } = JSON.parse(userStr);
            const { data } = await axios.post('/api/agents/analyze-project', {
                title: projectName,
                description,
                projectId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            onPlanGenerated(data);
        } catch (error) {
            console.error('Generation Error:', error);
            alert('AI failed to generate plan. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="project-init-panel">
            <div className="panel-header">
                <h2><FileText size={20} /> Project Requirements</h2>
                <p>Describe your project vision and let Gemini Architect build the SDLC structure.</p>
            </div>

            <div className="input-group">
                <label>Vision Statement</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g., Build a real-time chat application with authentication, group messaging, and file sharing..."
                    rows="6"
                    disabled={isGenerating}
                />
            </div>

            <button
                className={`generate-btn ${isGenerating ? 'loading' : ''}`}
                onClick={handleGenerate}
                disabled={isGenerating || !description.trim()}
            >
                {isGenerating ? (
                    <><Loader2 className="spin" size={20} /> Architecting Development Plan...</>
                ) : (
                    <><Send size={20} /> Generate SDLC Structure</>
                )}
            </button>
        </div>
    );
};

export default ProjectInitializationInput;
