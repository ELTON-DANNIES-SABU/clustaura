import React from 'react';
import '../styles.css';

const Sidebar = ({ activeLayout, onLayoutChange }) => {
    return (
        <aside className="sidebar">
            <div className="sidebar-content">
                <div className="sidebar-section">
                    <h3 className="sidebar-heading">Navigation</h3>
                    <button
                        className={`sidebar-btn ${activeLayout === 'posts' ? 'active' : ''}`}
                        onClick={() => onLayoutChange('posts')}
                    >
                        <span className="sidebar-icon">👥</span>
                        <span className="sidebar-text">Posts</span>
                    </button>
                    <button
                        className={`sidebar-btn ${activeLayout === 'challenges' ? 'active' : ''}`}
                        onClick={() => onLayoutChange('challenges')}
                    >
                        <span className="sidebar-icon">💡</span>
                        <span className="sidebar-text">Community Challenge</span>
                    </button>

                    <button
                        className={`sidebar-btn ${activeLayout === 'communication' ? 'active' : ''}`}
                        onClick={() => onLayoutChange('communication')}
                    >
                        <span className="sidebar-icon">💬</span>
                        <span className="sidebar-text">Clustaura Communication</span>
                    </button>

                    <button
                        className={`sidebar-btn ${activeLayout === 'workplace' ? 'active' : ''}`}
                        onClick={() => onLayoutChange('workplace')}
                    >
                        <span className="sidebar-icon">🏢</span>
                        <span className="sidebar-text">Clustaura Workplace</span>
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
