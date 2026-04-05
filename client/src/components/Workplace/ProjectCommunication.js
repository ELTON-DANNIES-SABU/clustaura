import React, { useState, useEffect, useRef } from 'react';
import {
    Hash, MessageSquare, Send, Plus, Search, MoreVertical, Smile, Paperclip,
    Zap, Bell, LogOut, ChevronDown, AtSign, Clock,
    Check, CheckCheck, Mic, MicOff, VideoOff, Camera, X,
    Loader2, Shield, MonitorUp, Hand, MoreHorizontal, UserPlus,
    Calendar, Edit3, Trash2, Phone, Video, Users
} from 'lucide-react';
import useCommunicationStore from '../../store/communicationStore';
import axios from 'axios';
import '../Communication.css';

const ProjectCommunication = ({ projectId }) => {
    const {
        teams, channels, messages,
        activeId, activeType, isLoading,
        setActive, sendMessage, initSocket, socket, fetchMessages, addReaction, deleteMessage, editMessage, startCallGlobal, joinCall
    } = useCommunicationStore();

    const [projectTeam, setProjectTeam] = useState(null);
    const [projectChannels, setProjectChannels] = useState([]);
    const [localLoading, setLocalLoading] = useState(true);
    const [messageInput, setMessageInput] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [showMembersSidebar, setShowMembersSidebar] = useState(false);
    const [memberSearchQuery, setMemberSearchQuery] = useState('');

    const chatEndRef = useRef(null);

    useEffect(() => {
        let socketRef = null;
        let channelsRef = [];

        const handleReconnect = () => {
            if (socketRef && channelsRef.length > 0) {
                channelsRef.forEach(ch => socketRef.emit('join_channel', ch._id));
            }
        };

        const fetchTeamData = async () => {
            setLocalLoading(true);
            try {
                const userStr = localStorage.getItem('user');
                if (!userStr) return;
                const { token } = JSON.parse(userStr);
                const config = { headers: { Authorization: `Bearer ${token}` } };

                // Get or create project team
                const { data } = await axios.get(`/api/comm/teams/project/${projectId}`, config);
                setProjectTeam(data.team);
                setProjectChannels(data.channels);
                channelsRef = data.channels;

                // Initialize socket if not already
                let currentSocket = socket;
                if (!currentSocket) {
                    initSocket();
                    currentSocket = useCommunicationStore.getState().socket;
                }
                socketRef = currentSocket;

                // Join rooms for project channels
                if (currentSocket) {
                    channelsRef.forEach(ch => currentSocket.emit('join_channel', ch._id));
                    
                    // Essential for live communication: Re-join immediately upon silent reconnects
                    currentSocket.on('connect', handleReconnect);
                }

                // Set active channel to first one (general)
                if (data.channels.length > 0) {
                    setActive(data.channels[0]._id, 'channel');
                }
            } catch (error) {
                console.error('Error fetching project team:', error);
            } finally {
                setLocalLoading(false);
            }
        };

        fetchTeamData();

        return () => {
            if (socketRef) {
                socketRef.off('connect', handleReconnect);
            }
        };
    }, [projectId]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, activeId]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!messageInput.trim()) return;
        sendMessage(messageInput);
        setMessageInput('');
    };

    const handleEditSave = (e) => {
        e.preventDefault();
        if (editContent.trim()) {
            editMessage(editingId, editContent);
            setEditingId(null);
            setEditContent('');
        }
    };

    if (localLoading || isLoading) {
        return (
            <div className="comm-layout" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '600px' }}>
                <Loader2 className="animate-spin text-[var(--accent-primary)]" size={48} />
            </div>
        );
    }

    if (!projectTeam) {
        return (
            <div className="comm-layout" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '600px' }}>
                <MessageSquare size={48} color="var(--text-secondary)" />
                <h3 style={{ marginTop: '16px' }}>Communication NOT initialized</h3>
                <p>Failed to load project communication group.</p>
            </div>
        );
    }

    const currentMessages = messages[activeId] || [];
    const activeChat = projectChannels.find(c => c._id === activeId);
    
    const currentUserForDM = JSON.parse(localStorage.getItem('user') || '{}');
    const currentUserIdForDM = currentUserForDM?._id || currentUserForDM?.id;
    const activeMember = projectTeam?.members?.find(m => m._id === activeId);

    const otherMembers = projectTeam?.members?.filter(m => m._id !== currentUserIdForDM) || [];
    const filteredMembers = memberSearchQuery.trim() 
        ? otherMembers.filter(m => (m.firstName + ' ' + m.lastName).toLowerCase().includes(memberSearchQuery.toLowerCase()))
        : otherMembers;

    return (
        <div className="comm-layout" style={{ height: 'calc(100vh - 200px)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
            {/* Sidebar Channels Only */}
            <div className="comm-side-nav" style={{ width: '260px', borderRight: '1px solid var(--comm-border)', display: 'flex', flexDirection: 'column' }}>
                <div className="comm-sidebar-brand" style={{ padding: '24px 20px', borderBottom: '1px solid var(--comm-border)' }}>
                    <div className="brand-p-name" style={{ fontSize: '14px', fontWeight: '800', color: 'var(--comm-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--comm-neon-green)', boxShadow: 'var(--comm-neon-glow)' }} />
                        {projectTeam.name}
                    </div>
                </div>
                
                <div style={{ padding: '16px 20px 0' }}>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <Search size={14} style={{ position: 'absolute', left: '10px', color: 'var(--comm-text-secondary)' }} />
                        <input 
                            type="text" 
                            placeholder="Search members..." 
                            value={memberSearchQuery}
                            onChange={(e) => setMemberSearchQuery(e.target.value)}
                            style={{ 
                                width: '100%', 
                                background: 'rgba(255, 255, 255, 0.05)', 
                                border: '1px solid var(--comm-border)', 
                                borderRadius: '6px', 
                                padding: '6px 10px 6px 30px', 
                                color: 'var(--comm-text-primary)',
                                fontSize: '12px',
                                outline: 'none'
                            }} 
                        />
                    </div>
                </div>

                <div className="comm-nav-header" style={{ padding: '16px 20px 8px', borderBottom: 'none' }}>
                    <h2 className="comm-nav-title" style={{ fontSize: '11px', color: 'var(--comm-text-secondary)', textTransform: 'uppercase', letterSpacing: '1.2px', fontWeight: '700' }}>Channels</h2>
                </div>
                <div className="comm-nav-scroll custom-scrollbar">
                    {projectChannels.map(channel => (
                        <div key={channel._id} className={`comm-side-item ${activeId === channel._id ? 'active' : ''}`} onClick={() => setActive(channel._id, 'channel')} style={{ padding: '10px 14px', margin: '2px 12px' }}>
                            <div className="comm-item-left"><Hash size={16} /><span style={{ fontSize: '14px', fontWeight: activeId === channel._id ? '600' : '400' }}>{channel.name}</span></div>
                        </div>
                    ))}
                    
                    <div style={{ padding: '16px 12px 8px' }}>
                        <h2 className="comm-nav-title" style={{ fontSize: '11px', color: 'var(--comm-text-secondary)', textTransform: 'uppercase', letterSpacing: '1.2px', fontWeight: '700', marginBottom: '8px', paddingLeft: '8px' }}>Direct Messages</h2>
                        {filteredMembers.map(member => (
                            <div key={member._id} className={`comm-side-item ${activeId === member._id ? 'active' : ''}`} onClick={() => setActive(member._id, 'dm')} style={{ padding: '8px 14px', margin: '2px 0', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div className="comm-avatar" style={{ width: '24px', height: '24px', fontSize: '10px' }}>{member.firstName?.[0]}</div>
                                <span style={{ fontSize: '13px', color: activeId === member._id ? 'var(--comm-neon-green)' : 'var(--comm-text-secondary)', fontWeight: activeId === member._id ? '600' : '400' }}>{member.firstName} {member.lastName}</span>
                            </div>
                        ))}
                    </div>
                </div>
                {/* Simplified Presence */}
                <div className="comm-user-presence" style={{ padding: '16px 20px', background: 'var(--comm-bg-pure)' }}>
                    <div className="comm-avatar" style={{ width: '36px', height: '36px' }}>
                        {localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).firstName[0] : 'U'}
                        <div className="comm-status-dot" style={{ background: 'var(--comm-neon-green)' }}></div>
                    </div>
                    <div className="comm-user-info">
                        <div className="comm-username" style={{ fontSize: '13px', color: 'var(--comm-text-primary)' }}>{localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).firstName : 'User'}</div>
                        <div className="comm-user-status-text">Online</div>
                    </div>
                </div>
            </div>

            {/* Main Area */}
            <div className="comm-main-area">
                <div className="comm-chat-header">
                    <div className="comm-header-left">
                        <div className="comm-icon-box" style={{ width: 40, height: 40, borderRadius: '12px', background: 'var(--comm-dark-gray)', border: '1px solid var(--comm-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px' }}>
                            {activeType === 'channel' ? <Hash className="text-[var(--comm-text-secondary)]" size={20} /> : <AtSign className="text-[var(--comm-neon-green)]" size={20} />}
                        </div>
                        <div>
                            <div className="comm-header-title" style={{ fontSize: '16px', fontWeight: '700', color: 'var(--comm-text-primary)' }}>
                                {activeType === 'channel' ? activeChat?.name : `${activeMember?.firstName || ''} ${activeMember?.lastName || ''}`}
                            </div>
                            <div className="comm-header-subtitle" style={{ fontSize: '12px', color: 'var(--comm-text-secondary)', marginTop: '2px' }}>
                                {activeType === 'channel' ? `Project Workspace • ${projectTeam.name}` : 'Direct Message'}
                            </div>
                        </div>
                    </div>
                    <div className="comm-header-actions">
                         <div className="comm-action-tool" onClick={() => startCallGlobal(activeId, 'audio')} title="Start Audio Call">
                            <Phone size={18} />
                        </div>
                        <div className="comm-action-tool" onClick={() => startCallGlobal(activeId, 'video')} title="Start Video Call">
                            <Video size={18} />
                        </div>
                         <div className={`comm-action-tool ${showMembersSidebar ? 'active-tool' : ''}`} onClick={() => setShowMembersSidebar(!showMembersSidebar)}>
                            <Users size={18} />
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                        <div className="comm-messages-container custom-scrollbar">
                            {currentMessages.length === 0 ? (
                                <div className="premium-empty-state">
                                    <div className="empty-state-icon" style={{ background: 'var(--comm-dark-gray)', border: '1px solid var(--comm-border)', color: 'var(--comm-neon-green)', boxShadow: 'var(--comm-neon-glow)' }}>
                                        <MessageSquare size={40} />
                                    </div>
                                    <h3 className="empty-state-title" style={{ fontSize: '24px', marginBottom: '12px' }}>
                                        {activeType === 'channel' ? `Welcome to #${activeChat?.name}` : `This is the beginning of your direct message history with ${activeMember?.firstName}`}
                                    </h3>
                                    <p className="empty-state-text" style={{ fontSize: '15px', color: 'var(--comm-text-secondary)', maxWidth: '400px', lineHeight: '1.6' }}>
                                        {activeType === 'channel' ? `This is the start of the ${projectTeam.name} conversation. Say hello to your team!` : `Say hi to ${activeMember?.firstName}!`}
                                    </p>
                                </div>
                            ) : (
                                currentMessages.map((msg) => {
                                    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                                    const currentUserId = currentUser?._id || currentUser?.id;
                                    
                                    const senderObj = msg.sender || {};
                                    const senderId = senderObj._id || senderObj.id || senderObj;
                                    
                                    const isMe = currentUserId && senderId && String(senderId) === String(currentUserId);
                                    const isEditing = editingId === msg._id;

                                    return (
                                        <div key={msg._id || msg.id} className={`comm-message-row ${isMe ? 'msg-me' : ''}`}>
                                            <div className="comm-msg-avatar">{senderObj.firstName?.[0] || 'U'}</div>
                                            <div className="comm-msg-body">
                                                <div className="comm-msg-header">
                                                    <span className="comm-msg-sender">{senderObj.firstName || 'User'}</span>
                                                    <span className="comm-msg-time">
                                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    {isMe && !isEditing && (
                                                        <div className="comm-msg-actions">
                                                            <button onClick={() => { setEditingId(msg._id); setEditContent(msg.content); }}><AtSign size={12} /></button>
                                                            <button onClick={() => deleteMessage(msg._id)}><X size={12} /></button>
                                                        </div>
                                                    )}
                                                </div>
                                                {isEditing ? (
                                                    <form onSubmit={handleEditSave} className="comm-edit-form">
                                                        <input type="text" value={editContent} onChange={(e) => setEditContent(e.target.value)} className="comm-edit-input" autoFocus />
                                                        <div className="comm-edit-btns">
                                                            <button type="submit" style={{ color: '#00FF9C' }}><Check size={14} /></button>
                                                            <button type="button" onClick={() => setEditingId(null)} style={{ color: '#FF4B4B' }}><X size={14} /></button>
                                                        </div>
                                                    </form>
                                                ) : msg.type === 'call' ? (
                                                    <div style={{ 
                                                        background: 'rgba(0, 255, 156, 0.05)', 
                                                        border: '1px solid var(--comm-border)', 
                                                        borderRadius: '12px', 
                                                        padding: '16px', 
                                                        marginTop: '8px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        maxWidth: '400px',
                                                        boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <div style={{ 
                                                                width: '40px', height: '40px', borderRadius: '50%', 
                                                                background: 'var(--comm-dark-gray)', display: 'flex', 
                                                                alignItems: 'center', justifyContent: 'center',
                                                                color: 'var(--comm-neon-green)'
                                                            }}>
                                                                {msg.metadata?.callType === 'video' ? <Video size={20} /> : <Phone size={20} />}
                                                            </div>
                                                            <div>
                                                                <div style={{ fontWeight: '600', fontSize: '14px' }}>
                                                                    {msg.metadata?.callType === 'video' ? 'Video Meeting' : 'Audio Call'}
                                                                </div>
                                                                <div style={{ fontSize: '12px', color: 'var(--comm-text-secondary)' }}>
                                                                    Started by {senderObj.firstName}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button 
                                                            onClick={() => joinCall(msg.metadata?.roomId || activeId, msg.metadata?.callType || 'video')}
                                                            style={{ 
                                                                background: 'var(--comm-neon-green)', 
                                                                color: 'black', 
                                                                border: 'none', 
                                                                padding: '6px 20px', 
                                                                borderRadius: '20px', 
                                                                fontWeight: 'bold', 
                                                                cursor: 'pointer',
                                                                fontSize: '13px'
                                                            }}
                                                        >
                                                            Join
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="comm-msg-content">{msg.content}</div>
                                                )}
                                                {msg.reactions?.length > 0 && (
                                                    <div className="comm-msg-reactions">
                                                        {Array.from(new Set(msg.reactions.map(r => r.emoji))).map(emoji => (
                                                            <div key={emoji} className="comm-reaction-tag">
                                                                {emoji} <span>{msg.reactions.filter(r => r.emoji === emoji).length}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        <div className="comm-input-area" style={{ padding: '0 24px 24px', backgroundColor: 'transparent' }}>
                            <div className="comm-input-wrapper" style={{ background: 'var(--comm-dark-gray)', border: '1px solid var(--comm-border)', borderRadius: '24px', padding: '4px 8px', display: 'flex', alignItems: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
                                <form onSubmit={handleSendMessage} className="comm-input-main" style={{ width: '100%', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <input type="text" className="comm-text-input" placeholder={activeType === 'channel' ? `Message #${activeChat?.name || 'channel'}...` : `Message @${activeMember?.firstName || 'user'}...`} value={messageInput} onChange={(e) => setMessageInput(e.target.value)} style={{ fontSize: '15px' }} />
                                    <button type="submit" className="comm-send-btn" disabled={!messageInput.trim()} style={{ background: messageInput.trim() ? 'var(--comm-neon-green)' : 'var(--comm-charcoal)', color: messageInput.trim() ? '#000' : 'var(--comm-text-secondary)', borderRadius: '16px' }}>
                                        <Send size={18} />
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>

                    {showMembersSidebar && (
                        <div className="comm-members-sidebar" style={{ width: '200px', borderLeft: '1px solid var(--border-color)', background: 'var(--bg-surface)' }}>
                            <div style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', fontWeight: 'bold', fontSize: '14px' }}>Members</div>
                            <div className="custom-scrollbar" style={{ overflowY: 'auto', height: '100%' }}>
                                {projectTeam.members?.map(member => (
                                    <div key={member._id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px' }}>
                                        <div className="comm-avatar" style={{ width: '24px', height: '24px', fontSize: '10px' }}>{member.firstName?.[0]}</div>
                                        <div style={{ fontSize: '12px' }}>{member.firstName} {member.lastName}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectCommunication;
