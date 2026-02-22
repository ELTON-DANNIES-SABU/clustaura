import React, { useState, useEffect, useRef } from 'react';
import {
    Users, Hash, MessageSquare, Video, Phone, Settings,
    Send, Plus, Search, MoreVertical, Smile, Paperclip,
    Zap, Bell, LogOut, ChevronDown, AtSign, Clock,
    Check, CheckCheck, Mic, MicOff, VideoOff, Camera, X,
    Loader2, Shield, MonitorUp, Hand, MoreHorizontal, UserPlus,
    Calendar, Edit3, Trash2
} from 'lucide-react';
import useCommunicationStore from '../store/communicationStore';
import { useNavigate } from 'react-router-dom';
import MeetingScheduler from './MeetingScheduler';
import './Communication.css';

const Communication = () => {
    const navigate = useNavigate();
    const {
        teams, channels, directMessages, messages,
        activeId, activeType, currentUserStatus, isLoading,
        setActive, setStatus, sendMessage, init, createTeam, createChannel, addMemberToTeam,
        startCallGlobal, joinCall, callState, typingUsers, sendTyping, activeCallParticipants,
        editMessage, deleteMessage, addReaction, meetings
    } = useCommunicationStore();

    const [messageInput, setMessageInput] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [showTeamModal, setShowTeamModal] = useState(false);
    const [showChannelModal, setShowChannelModal] = useState(false);
    const [showMemberModal, setShowMemberModal] = useState(false);
    const [newTeamName, setNewTeamName] = useState('');
    const [newChannelName, setNewChannelName] = useState('');
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [selectedTeamId, setSelectedTeamId] = useState('');
    const [showMembersSidebar, setShowMembersSidebar] = useState(false);
    const [view, setView] = useState('chat'); // 'chat' or 'meetings'
    const [showMeetingScheduler, setShowMeetingScheduler] = useState(false);

    const chatEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    useEffect(() => {
        init();
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, activeId]);

    const activeChat = activeType === 'channel'
        ? channels.find(c => c._id === activeId)
        : directMessages.find(d => d.id === activeId);

    const currentMessages = messages[activeId] || [];

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!messageInput.trim()) return;
        sendMessage(messageInput);
        setMessageInput('');
        sendTyping(false);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };

    const handleInputChange = (e) => {
        setMessageInput(e.target.value);

        if (activeId) {
            sendTyping(true);

            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

            typingTimeoutRef.current = setTimeout(() => {
                sendTyping(false);
            }, 2000);
        }
    };

    const handleCreateTeam = async (e) => {
        e.preventDefault();
        if (newTeamName.trim()) {
            await createTeam(newTeamName, 'New cyber team');
            setNewTeamName('');
            setShowTeamModal(false);
        }
    };

    const handleCreateChannel = async (e) => {
        e.preventDefault();
        if (newChannelName.trim() && selectedTeamId) {
            await createChannel(selectedTeamId, newChannelName, 'Team discussions');
            setNewChannelName('');
            setShowChannelModal(false);
        }
    };

    const handleAddMember = async (e) => {
        e.preventDefault();
        if (newMemberEmail.trim() && selectedTeamId) {
            await addMemberToTeam(selectedTeamId, newMemberEmail);
            setNewMemberEmail('');
            setShowMemberModal(false);
        }
    };

    const startCall = (video = true) => {
        if (!activeId) return;
        if (callState.inCall) {
            alert("You are already in a call!");
            return;
        }
        startCallGlobal(activeId, video ? 'video' : 'audio');
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'online': return '#00FF9C';
            case 'away': return '#FFD700';
            case 'busy': return '#FF4B4B';
            case 'in-call': return '#A78BFA';
            default: return '#9CA3AF';
        }
    };

    const handleEditSave = (e) => {
        e.preventDefault();
        if (editContent.trim()) {
            editMessage(editingId, editContent);
            setEditingId(null);
            setEditContent('');
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditContent('');
    };

    const emojiList = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

    if (isLoading) return <div className="comm-layout" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 className="animate-spin text-[#00FF9C]" size={48} /></div>;

    return (
        <div className="comm-layout">
            {/* Left Icon Bar */}
            <div className="comm-left-bar">
                <div className="comm-logo-box" onClick={() => navigate('/dashboard')}><Zap size={24} color="black" /></div>
                <div className="comm-icon-group">
                    <div className="comm-icon-btn active"><Bell size={24} /></div>
                    <div className={`comm-icon-btn ${view === 'chat' ? 'active' : ''}`} onClick={() => setView('chat')}><MessageSquare size={24} /></div>
                    <div className={`comm-icon-btn ${view === 'meetings' ? 'active' : ''}`} onClick={() => setView('meetings')}><Calendar size={24} /></div>
                    <div className="comm-icon-btn"><Users size={24} /></div>
                    <div className="comm-icon-btn"><Clock size={24} /></div>
                    <div className="comm-icon-btn"><Settings size={24} /></div>
                </div>
                <div className="comm-icon-logout" onClick={() => navigate('/login')}><LogOut size={24} /></div>
            </div>

            {/* Side Navigation */}
            <div className="comm-side-nav">
                <div className="comm-nav-header">
                    <h2 className="comm-nav-title">ClustAura</h2>
                    {view === 'meetings' ? (
                        <button className="comm-add-btn" onClick={() => setShowMeetingScheduler(true)}><Plus size={20} title="Schedule Meeting" /></button>
                    ) : (
                        <button className="comm-add-btn" onClick={() => setShowTeamModal(true)}><Plus size={20} title="Add Team" /></button>
                    )}
                </div>
                <div className="comm-nav-scroll custom-scrollbar">
                    {view === 'meetings' ? (
                        <div>
                            <div className="comm-section-label">Your Meetings</div>
                            <div className="comm-side-item active" onClick={() => { setView('meetings'); setActive(null, 'meetings_all'); }}>
                                <div className="comm-item-left"><Calendar size={18} /><span>Upcoming</span></div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Teams */}
                            <div className="comm-team-block">
                                <div className="comm-section-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    Your Teams
                                    <Plus size={14} style={{ cursor: 'pointer' }} onClick={() => setShowTeamModal(true)} title="Create New Team" />
                                </div>
                                {teams.map(team => (
                                    <div key={team._id}>
                                        <div style={{ padding: '8px 12px', fontSize: '13px', fontWeight: 'bold', color: '#FFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            {team.name}
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <UserPlus size={12} style={{ cursor: 'pointer', opacity: 0.7 }} onClick={(e) => { e.stopPropagation(); setSelectedTeamId(team._id); setShowMemberModal(true); }} title="Add Member" />
                                                <Plus size={12} style={{ cursor: 'pointer', opacity: 0.7 }} onClick={(e) => { e.stopPropagation(); setSelectedTeamId(team._id); setShowChannelModal(true); }} title="Add Channel" />
                                            </div>
                                        </div>
                                        {channels.filter(c => c.teamId === team._id).map(channel => (
                                            <div key={channel._id} className={`comm-side-item ${activeId === channel._id ? 'active' : ''}`} onClick={() => setActive(channel._id, 'channel')}>
                                                <div className="comm-item-left"><Hash size={18} /><span style={{ fontSize: '14px' }}>{channel.name}</span></div>
                                                {channel.unread > 0 && <div style={{ background: '#FF4B4B', color: 'white', borderRadius: '10px', padding: '2px 6px', fontSize: '10px', fontWeight: 'bold' }}>{channel.unread}</div>}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                            {/* DMs */}
                            <div>
                                <div className="comm-section-label">Direct Messages</div>
                                {directMessages.map(dm => (
                                    <div key={dm.id} className={`comm-side-item ${activeId === dm.id ? 'active' : ''}`} onClick={() => setActive(dm.id, 'dm')}>
                                        <div className="comm-item-left">
                                            <div className="comm-avatar">
                                                {dm.name.split(' ').map(n => n[0]).join('')}
                                                <div className="comm-status-dot" style={{ backgroundColor: getStatusColor(dm.status) }} />
                                            </div>
                                            <span style={{ fontSize: '14px' }}>{dm.name}</span>
                                        </div>
                                        {dm.unread > 0 && <div style={{ background: '#FF4B4B', color: 'white', borderRadius: '10px', padding: '2px 6px', fontSize: '10px', fontWeight: 'bold' }}>{dm.unread}</div>}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
                {/* Presence */}
                <div className="comm-user-presence">
                    <div className="comm-avatar" style={{ width: '40px', height: '40px' }}>
                        {localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).firstName[0] : 'U'}
                        <div className="comm-status-dot" style={{ backgroundColor: getStatusColor(currentUserStatus), width: '12px', height: '12px' }} />
                    </div>
                    <div className="comm-user-info">
                        <div className="comm-username">{localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).firstName : 'User'}</div>
                        <div className="comm-user-status-text"><span className="capitalize">{currentUserStatus}</span><ChevronDown size={12} /></div>
                    </div>
                </div>
            </div>

            {/* Main Area */}
            <div className="comm-main-area">
                {view === 'meetings' ? (
                    <div style={{ flex: 1, padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h2 style={{ fontSize: '28px', fontWeight: 'bold' }}>Meetings</h2>
                                <p style={{ color: '#9CA3AF' }}>Schedule and manage your sessions</p>
                            </div>
                            <button
                                onClick={() => setShowMeetingScheduler(true)}
                                style={{
                                    padding: '12px 24px', background: '#00FF9C', color: 'black',
                                    border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '8px'
                                }}
                            >
                                <Plus size={20} /> New Meeting
                            </button>
                        </div>

                        <div style={{ display: 'grid', gap: '16px' }}>
                            {meetings.length === 0 ? (
                                <div style={{ padding: '60px', textAlign: 'center', background: '#111827', borderRadius: '12px', border: '1px dashed #1F2937' }}>
                                    <div style={{ marginBottom: '16px', color: '#374151' }}><Calendar size={48} /></div>
                                    <h3 style={{ color: '#E5E7EB' }}>No meetings scheduled</h3>
                                    <p style={{ color: '#6B7280' }}>Host your first meeting by clicking the button above.</p>
                                </div>
                            ) : (
                                meetings.map(meeting => (
                                    <div key={meeting._id} style={{
                                        background: '#111827', border: '1px solid #1F2937', borderRadius: '12px',
                                        padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                    }}>
                                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                            <div style={{ padding: '12px', background: '#1F2937', borderRadius: '12px', textAlign: 'center', minWidth: '60px' }}>
                                                <div style={{ fontSize: '10px', color: '#00FF9C', fontWeight: 'bold' }}>{new Date(meeting.scheduledAt).toLocaleString('en-US', { month: 'short' }).toUpperCase()}</div>
                                                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{new Date(meeting.scheduledAt).getDate()}</div>
                                            </div>
                                            <div>
                                                <h4 style={{ margin: 0, fontSize: '18px' }}>{meeting.title}</h4>
                                                <div style={{ display: 'flex', gap: '16px', marginTop: '4px', fontSize: '12px', color: '#9CA3AF' }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> {new Date(meeting.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({meeting.duration} mins)</span>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={14} /> {meeting.participants?.length || 0} participants</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <button
                                                onClick={() => joinCall(meeting.meetingLink, 'video', false)}
                                                style={{
                                                    padding: '10px 20px', background: '#00FF9C', color: 'black',
                                                    border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer'
                                                }}
                                            >
                                                Join
                                            </button>
                                            <button style={{ padding: '10px', background: '#1F2937', border: 'none', borderRadius: '6px', color: '#9CA3AF', cursor: 'pointer' }}><MoreHorizontal size={20} /></button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ) : !activeId ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                        <div className="comm-logo-box" style={{ width: '80px', height: '80px', borderRadius: '24px' }}><Zap size={40} color="black" /></div>
                        <h3 className="comm-nav-title" style={{ fontSize: '24px' }}>Welcome to ClustAura</h3>
                        <p style={{ color: '#6B7280', fontSize: '14px' }}>Select a conversation to start.</p>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="comm-chat-header">
                            <div className="comm-header-left">
                                {activeType === 'channel' ? <Hash className="text-[#00FF9C]" size={24} /> : <div className="comm-avatar" style={{ width: '32px', height: '32px' }}>{activeChat?.name?.[0]}</div>}
                                <div>
                                    <div className="comm-header-title">{activeChat?.name}</div>
                                    <div className="comm-header-subtitle">{activeType === 'channel' ? 'Channel' : activeChat?.status}</div>
                                </div>
                            </div>
                            <div className="comm-header-actions">
                                <div className="comm-action-tool" onClick={() => startCallGlobal(activeId, 'audio')}><Phone size={20} /></div>
                                <div className="comm-action-tool" onClick={() => startCallGlobal(activeId, 'video')}><Video size={20} /></div>
                                <div className="comm-v-divider"></div>
                                <div className={`comm-action-tool ${showMembersSidebar ? 'active-tool' : ''}`} onClick={() => setShowMembersSidebar(!showMembersSidebar)} title="View Members" style={{ color: showMembersSidebar ? '#00FF9C' : 'inherit' }}><Users size={20} /></div>
                            </div>
                        </div>

                        {/* Main Content Flex Area */}
                        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
                            {/* Chat Column */}
                            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                                {/* Messages */}
                                <div className="comm-messages-container custom-scrollbar" style={{ flex: 1 }}>
                                    {currentMessages.map((msg) => {
                                        if (msg.type === 'call') {
                                            return (
                                                <div key={msg._id || msg.id} className="comm-call-log">
                                                    <div className="comm-call-log-icon">
                                                        {msg.callType === 'video' ? <Video size={16} /> : <Phone size={16} />}
                                                    </div>
                                                    <div className="comm-call-log-info">
                                                        <div className="comm-call-title">{msg.content}</div>
                                                        <div className="comm-call-time">{new Date(msg.timestamp || msg.createdAt).toLocaleTimeString()}</div>
                                                    </div>
                                                    {msg.status === 'active' && (
                                                        <button className="comm-call-join-btn" onClick={() => joinCall(msg.roomId || activeId, msg.callType || 'video', true)}>
                                                            Join
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        }

                                        const isMe = msg.sender?._id === (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user'))._id : null);
                                        const isEditing = editingId === msg._id;

                                        return (
                                            <div key={msg._id || msg.id} className={`comm-message-row ${isMe ? 'msg-me' : ''}`}>
                                                <div className="comm-msg-avatar">{msg.sender?.firstName?.[0]}</div>
                                                <div className="comm-msg-body">
                                                    <div className="comm-msg-header">
                                                        <span className="comm-msg-sender">{msg.sender?.firstName}</span>
                                                        <span className="comm-msg-time">
                                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            {msg.isEdited && <span style={{ marginLeft: '4px', opacity: 0.5, fontSize: '10px' }}>(edited)</span>}
                                                        </span>

                                                        {/* Actions */}
                                                        <div className="comm-msg-actions">
                                                            <div className="msg-action-btn-group">
                                                                {emojiList.map(emoji => (
                                                                    <span key={emoji} className="emoji-action" onClick={() => addReaction(msg._id, emoji)}>{emoji}</span>
                                                                ))}
                                                            </div>
                                                            {isMe && (
                                                                <div className="msg-more-actions">
                                                                    <button onClick={() => { setEditingId(msg._id); setEditContent(msg.content); }}><AtSign size={14} title="Edit" /></button>
                                                                    <button onClick={() => deleteMessage(msg._id)}><X size={14} title="Delete" /></button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {isEditing ? (
                                                        <form onSubmit={handleEditSave} className="comm-edit-form">
                                                            <input
                                                                type="text"
                                                                value={editContent}
                                                                onChange={(e) => setEditContent(e.target.value)}
                                                                className="comm-edit-input"
                                                                autoFocus
                                                            />
                                                            <div className="comm-edit-btns">
                                                                <button type="submit" style={{ color: '#00FF9C' }}><Check size={14} /></button>
                                                                <button type="button" onClick={handleCancelEdit} style={{ color: '#FF4B4B' }}><X size={14} /></button>
                                                            </div>
                                                        </form>
                                                    ) : (
                                                        <div className="comm-msg-content">{msg.content}</div>
                                                    )}

                                                    {/* Reactions Display */}
                                                    {msg.reactions?.length > 0 && (
                                                        <div className="comm-msg-reactions">
                                                            {Array.from(new Set(msg.reactions.map(r => r.emoji))).map(emoji => (
                                                                <div key={emoji} className="comm-reaction-tag" onClick={() => addReaction(msg._id, emoji)}>
                                                                    {emoji} <span>{msg.reactions.filter(r => r.emoji === emoji).length}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={chatEndRef} />
                                    {/* Typing Indicator */}
                                    {typingUsers[activeId] && typingUsers[activeId].length > 0 && (
                                        <div style={{ padding: '8px 16px', color: '#9CA3AF', fontSize: '12px', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div className="typing-dots">
                                                <span>.</span><span>.</span><span>.</span>
                                            </div>
                                            {typingUsers[activeId].map(u => u.firstName).join(', ')} is typing...
                                        </div>
                                    )}
                                </div>
                                {/* Input */}
                                <div className="comm-input-area">
                                    <div className="comm-input-wrapper">
                                        <form onSubmit={handleSendMessage} className="comm-input-main">
                                            <input type="text" className="comm-text-input" placeholder="Type a message..." value={messageInput} onChange={handleInputChange} />
                                            <button type="submit" className="comm-send-btn"><Send size={18} /></button>
                                        </form>
                                    </div>
                                </div>
                            </div>

                            {/* Members Sidebar */}
                            {showMembersSidebar && (
                                <div className="comm-members-sidebar" style={{ width: '260px', background: '#111827', borderLeft: '1px solid #1F2937', display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ padding: '16px', borderBottom: '1px solid #1F2937', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#E2E8F0', margin: 0 }}>Members</h3>
                                        <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{activeType === 'channel' ? teams.find(t => t._id === activeChat?.teamId)?.members?.length || 0 : 2}</div>
                                    </div>
                                    <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                                        {activeType === 'channel' ? (
                                            teams.find(t => t._id === activeChat?.teamId)?.members?.map(member => (
                                                <div key={member._id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderRadius: '6px', cursor: 'default', transition: 'background 0.2s' }} className="member-item hover:bg-[#1F2937]">
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#374151', color: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' }}>
                                                        {member.firstName?.[0]}
                                                    </div>
                                                    <div style={{ overflow: 'hidden' }}>
                                                        <div style={{ color: '#E2E8F0', fontWeight: '500', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.firstName} {member.lastName}</div>
                                                        <div style={{ color: '#9CA3AF', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.email}</div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div style={{ padding: '16px', textAlign: 'center', color: '#6B7280', fontSize: '14px' }}>
                                                Direct Message
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Team Modal Reuse (Simplified) */}
                {showTeamModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5000 }}>
                        <div style={{ background: '#1F2937', padding: '24px', borderRadius: '12px', width: '400px' }}>
                            <h3 style={{ color: 'white', marginBottom: '16px' }}>Create New Team</h3>
                            <form onSubmit={handleCreateTeam}>
                                <input type="text" value={newTeamName} onChange={e => setNewTeamName(e.target.value)} placeholder="Team Name" style={{ width: '100%', padding: '10px', marginBottom: '16px', background: '#374151', border: 'none', color: 'white', borderRadius: '8px' }} autoFocus />
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                    <button type="button" onClick={() => setShowTeamModal(false)} style={{ padding: '8px 16px', background: 'transparent', color: '#9CA3AF', border: 'none', cursor: 'pointer' }}>Cancel</button>
                                    <button type="submit" style={{ padding: '8px 16px', background: '#00FF9C', color: 'black', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Create</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {showChannelModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5000 }}>
                        <div style={{ background: '#1F2937', padding: '24px', borderRadius: '12px', width: '400px' }}>
                            <h3 style={{ color: 'white', marginBottom: '16px' }}>Create New Channel</h3>
                            <form onSubmit={handleCreateChannel}>
                                <input type="text" value={newChannelName} onChange={e => setNewChannelName(e.target.value)} placeholder="Channel Name" style={{ width: '100%', padding: '10px', marginBottom: '16px', background: '#374151', border: 'none', color: 'white', borderRadius: '8px' }} autoFocus />
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                    <button type="button" onClick={() => setShowChannelModal(false)} style={{ padding: '8px 16px', background: 'transparent', color: '#9CA3AF', border: 'none', cursor: 'pointer' }}>Cancel</button>
                                    <button type="submit" style={{ padding: '8px 16px', background: '#00FF9C', color: 'black', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Create</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {showMemberModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5000 }}>
                        <div style={{ background: '#1F2937', padding: '24px', borderRadius: '12px', width: '400px' }}>
                            <h3 style={{ color: 'white', marginBottom: '16px' }}>Add Member to Team</h3>
                            <form onSubmit={handleAddMember}>
                                <input type="email" value={newMemberEmail} onChange={e => setNewMemberEmail(e.target.value)} placeholder="User Email" style={{ width: '100%', padding: '10px', marginBottom: '16px', background: '#374151', border: 'none', color: 'white', borderRadius: '8px' }} autoFocus />
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                    <button type="button" onClick={() => setShowMemberModal(false)} style={{ padding: '8px 16px', background: 'transparent', color: '#9CA3AF', border: 'none', cursor: 'pointer' }}>Cancel</button>
                                    <button type="submit" style={{ padding: '8px 16px', background: '#00FF9C', color: 'black', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Add</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {showMeetingScheduler && <MeetingScheduler onClose={() => setShowMeetingScheduler(false)} />}
            </div>
        </div>
    );
};

export default Communication;
