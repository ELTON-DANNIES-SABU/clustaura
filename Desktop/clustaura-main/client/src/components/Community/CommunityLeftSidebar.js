import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Code, PenTool, Database, Cpu, Zap, Server, X,
    Users, Sparkles, Hash, HelpCircle,
    ChevronRight, Search
} from 'lucide-react';
import useCommunityStore from '../../store/communityStore';
import api from '../../services/api';

const CommunityLeftSidebar = ({ onClose, user, community }) => {
    const navigate = useNavigate();

    // Get members from the active community prop
    const members = community?.members || [];

    return (
        <div className="community-sidebar-left">
            {onClose && (
                <button className="sidebar-close-btn" onClick={onClose}>
                    <X size={20} />
                </button>
            )}

            <div className="section-header" style={{ marginBottom: '16px', marginTop: '10px' }}>
                <div className="header-title">
                    <Users className="title-icon" style={{ color: '#339933' }} />
                    <h3 style={{ fontSize: '15px', fontWeight: 700 }}>
                        {community ? `${community.name} Members` : 'Community Members'}
                    </h3>
                </div>
            </div>

            <div className="members-scroll-area" style={{ flex: 1, overflowY: 'auto' }}>
                {members.length > 0 ? (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {members.map((member, idx) => {
                            const fullName = member.firstName ? `${member.firstName} ${member.lastName}` : 'Community Member';
                            const initials = member.firstName ? (member.firstName[0] + member.lastName[0]) : 'M';

                            return (
                                <li key={member._id || idx} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '10px 12px',
                                    borderRadius: '10px',
                                    transition: 'all 0.2s ease',
                                    background: 'rgba(255,255,255,0.02)',
                                    cursor: 'default'
                                }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(51,153,51,0.05)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                                >
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #339933 0%, #40c0ff 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        color: 'white',
                                        boxShadow: '0 2px 8px rgba(51,153,51,0.2)'
                                    }}>
                                        {initials}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{fullName}</span>
                                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Member</span>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic' }}>
                        {community ? 'No members found in this community' : 'Select a community to view members'}
                    </div>
                )}
            </div>

            <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: 'auto' }}>
                <div style={{
                    background: 'rgba(51,153,51,0.1)',
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1px solid rgba(51,153,51,0.2)'
                }}>
                    <p style={{ fontSize: '11px', color: '#a0a0a0', margin: 0, textAlign: 'center' }}>
                        Connect with professionals in <strong>{community?.name || 'Clustaura'}</strong>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default React.memo(CommunityLeftSidebar);