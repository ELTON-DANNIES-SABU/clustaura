import React from 'react';
import { Layers, ChevronRight, CheckCircle } from 'lucide-react';

const ModuleView = ({ modules, tickets, technologies }) => {
    return (
        <div className="module-view-panel">
            <div className="tech-stack-section">
                <h3>Recommended Tech Stack</h3>
                <div className="tech-chips">
                    {technologies.map((tech, i) => (
                        <span key={i} className="tech-chip">{tech}</span>
                    ))}
                </div>
            </div>

            <div className="modules-list">
                <h3><Layers size={20} /> Project Modules</h3>
                {modules.map((module, i) => (
                    <div key={i} className="module-card">
                        <div className="module-header">
                            <h4>{module.moduleName}</h4>
                            <span className="ticket-count">
                                {tickets.filter(t => t.moduleName === module.moduleName).length} Tickets
                            </span>
                        </div>
                        <p>{module.description}</p>

                        <div className="module-tickets">
                            {tickets
                                .filter(t => t.moduleName === module.moduleName)
                                .map((ticket, j) => (
                                    <div key={j} className="ticket-item">
                                        <div className="ticket-main">
                                            <span className="ticket-title">{ticket.title}</span>
                                            <div className="ticket-tags">
                                                <span className={`priority-tag ${ticket.priority}`}>{ticket.priority}</span>
                                                <span className="effort-tag">{ticket.effort} SP</span>
                                            </div>
                                        </div>
                                        <div className="ticket-skills">
                                            {ticket.skillsRequired.map((skill, k) => (
                                                <span key={k} className="skill-tag">{skill}</span>
                                            ))}
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

export default ModuleView;
