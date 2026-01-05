import React, { useState, useEffect, useRef } from 'react';
import {
    Users, Hash, MessageSquare, Video, Phone, Settings,
    Send, Plus, Search, MoreVertical, Smile, Paperclip,
    Zap, Bell, LogOut, ChevronDown, AtSign, Clock,
    Check, CheckCheck, Mic, MicOff, VideoOff, Camera, X,
    Loader2, Shield, MonitorUp, Hand, MoreHorizontal, UserPlus
} from 'lucide-react';
import useCommunicationStore from '../store/communicationStore';
import { useNavigate } from 'react-router-dom';
import Peer from 'peerjs';
import './Communication.css';

const Communication = () => {
    const navigate = useNavigate();
    const {
        teams, channels, directMessages, messages,
        activeId, activeType, currentUserStatus, isLoading,
        setActive, setStatus, sendMessage, init, createTeam, createChannel, addMemberToTeam
    } = useCommunicationStore();

    const [messageInput, setMessageInput] = useState('');
    const [inCall, setInCall] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [activeUtility, setActiveUtility] = useState(null); // 'people', 'chat', 'reactions', 'more', or null

    // Call State
    const [myPeerId, setMyPeerId] = useState('');
    const [callStatus, setCallStatus] = useState('idle'); // idle, calling, incoming, connected
    const [incomingCall, setIncomingCall] = useState(null);
    const [callDuration, setCallDuration] = useState(0);

    // Call Chat & Metadata State
    const [callMessages, setCallMessages] = useState([]);
    const [callMessageInput, setCallMessageInput] = useState('');
    const [remoteIsSharing, setRemoteIsSharing] = useState(false);
    const [remoteVideoEnabled, setRemoteVideoEnabled] = useState(true);
    const [remoteParticipant, setRemoteParticipant] = useState(null);

    // Refs
    const myVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerInstance = useRef(null);
    const currentCall = useRef(null);
    const localStreamRef = useRef(null);
    const timerRef = useRef(null);
    const chatEndRef = useRef(null);
    const callChatEndRef = useRef(null);

    // Data Connection Ref (for ephemeral chat/signaling)
    const dataConnRef = useRef(null);

    // Creation States
    const [showTeamModal, setShowTeamModal] = useState(false);
    const [showChannelModal, setShowChannelModal] = useState(false);
    const [showMemberModal, setShowMemberModal] = useState(false);
    const [newTeamName, setNewTeamName] = useState('');
    const [newChannelName, setNewChannelName] = useState('');
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [selectedTeamId, setSelectedTeamId] = useState('');
    const [showMembersSidebar, setShowMembersSidebar] = useState(false);

    useEffect(() => {
        init();

        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            const peer = new Peer(user._id);

            peer.on('open', (id) => {
                console.log('My Peer ID is: ' + id);
                setMyPeerId(id);
            });

            peer.on('call', (call) => {
                console.log('Incoming call from:', call.peer);
                setIncomingCall(call);
                setCallStatus('incoming');
            });

            // Listen for incoming data connections (for chat/signaling)
            peer.on('connection', (conn) => {
                console.log('Incoming data connection from:', conn.peer);
                setupDataConnection(conn);
            });

            peerInstance.current = peer;
        }

        return () => {
            if (peerInstance.current) {
                peerInstance.current.destroy();
            }
        };
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, activeId]);

    useEffect(() => {
        if (activeUtility === 'chat') {
            callChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [callMessages, activeUtility]);

    useEffect(() => {
        if (callStatus === 'connected') {
            timerRef.current = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        } else {
            clearInterval(timerRef.current);
            setCallDuration(0);
        }
        return () => clearInterval(timerRef.current);
    }, [callStatus]);

    const activeChat = activeType === 'channel'
        ? channels.find(c => c._id === activeId)
        : directMessages.find(d => d.id === activeId);

    const currentMessages = messages[activeId] || [];

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!messageInput.trim()) return;
        sendMessage(messageInput);
        setMessageInput('');
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

    // --- Ephemeral Call Chat Logic ---

    const setupDataConnection = (conn) => {
        dataConnRef.current = conn;

        conn.on('open', () => {
            console.log('Data connection open');
        });

        conn.on('data', (data) => {
            console.log('Received data:', data);
            if (data.type === 'chat') {
                setCallMessages(prev => [...prev, data.payload]);
            } else if (data.type === 'screen-share-status') {
                setRemoteIsSharing(data.isSharing);
            } else if (data.type === 'video-status') {
                setRemoteVideoEnabled(data.enabled);
            }
        });

        conn.on('close', () => {
            console.log('Data connection closed');
            dataConnRef.current = null;
        });
    };

    const sendCallMessage = (e) => {
        e.preventDefault();
        if (!callMessageInput.trim()) return;

        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : { firstName: 'Me' };

        const msgPayload = {
            id: Date.now(),
            senderName: user.firstName,
            content: callMessageInput,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isMe: true
        };

        // Add to local UI immediately
        setCallMessages(prev => [...prev, msgPayload]);

        // Send to peer
        if (dataConnRef.current && dataConnRef.current.open) {
            dataConnRef.current.send({
                type: 'chat',
                payload: { ...msgPayload, isMe: false }
            });
        }

        setCallMessageInput('');
    };

    // --- Media Call Logic ---

    const startCall = (video = true) => {
        if (activeType !== 'dm' || !activeId) {
            alert('Calling is only available in Direct Messages for now.');
            return;
        }

        setCallStatus('calling');
        setInCall(true);
        setCallMessages([]); // Reset chat for new session
        setRemoteVideoEnabled(true);

        const participant = activeType === 'dm'
            ? directMessages.find(d => d.id === activeId)
            : channels.find(c => c._id === activeId);
        setRemoteParticipant(participant);

        // Always request video to establish a video sender (negotiation).
        // If user wants audio-only, we will disable the video track immediately.
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((stream) => {
                const videoTrack = stream.getVideoTracks()[0];
                if (videoTrack && !video) {
                    videoTrack.enabled = false; // Mute video initially for 'Audio Call'
                    setIsVideoOn(false);
                } else {
                    setIsVideoOn(true);
                }

                localStreamRef.current = stream;
                if (myVideoRef.current) myVideoRef.current.srcObject = stream;

                const call = peerInstance.current.call(activeId, stream);
                currentCall.current = call;

                call.on('stream', (remoteStream) => {
                    setCallStatus('connected');
                    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
                });

                call.on('close', () => endCall());
                call.on('error', (err) => { console.error(err); endCall(); });

                // Establish Data Connection
                const conn = peerInstance.current.connect(activeId);
                setupDataConnection(conn);
            })
            .catch((err) => {
                console.error('Failed to get local stream', err);

                // Fallback: Try Audio Only if Video fails (e.g. no camera)
                if (err.name === 'NotFoundError' || err.name === 'NotAllowedError') {
                    navigator.mediaDevices.getUserMedia({ video: false, audio: true })
                        .then((audioStream) => {
                            localStreamRef.current = audioStream;
                            const call = peerInstance.current.call(activeId, audioStream);
                            currentCall.current = call;
                            call.on('stream', remoteStream => {
                                setCallStatus('connected');
                                if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
                            });
                            // Establish Data Connection
                            const conn = peerInstance.current.connect(activeId);
                            setupDataConnection(conn);
                        })
                        .catch(e => {
                            console.error("Audio fallback failed", e);
                            setCallStatus('idle');
                            setInCall(false);
                            alert("Could not access microphone.");
                        });
                } else {
                    setCallStatus('idle');
                    setInCall(false);
                    alert('Could not access camera/microphone.');
                }
            });
    };

    const answerCall = () => {
        if (!incomingCall) return;

        setCallStatus('connected');
        setInCall(true);
        setIsVideoOn(true);
        setCallMessages([]); // Reset chat
        setRemoteVideoEnabled(true);

        const participant = directMessages.find(d => d.id === incomingCall.peer);
        setRemoteParticipant(participant || { name: 'Remote User', id: incomingCall.peer });

        // Always answer with video capability if possible
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((stream) => {
                localStreamRef.current = stream;
                if (myVideoRef.current) myVideoRef.current.srcObject = stream;

                incomingCall.answer(stream);
                currentCall.current = incomingCall;

                // Also connect back for data channel if initiator didn't (Mesh pattern usually requires check, but PeerJS handle existing)
                // Actually, the initiator connects. We just wait for 'connection' event on our peer instance (handled in useEffect).

                incomingCall.on('stream', (remoteStream) => {
                    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
                });

                incomingCall.on('close', () => endCall());
                setIncomingCall(null);
            })
            .catch((err) => {
                console.error('Failed to answer with video, trying audio only', err);
                // Fallback for answer
                navigator.mediaDevices.getUserMedia({ video: false, audio: true })
                    .then((audioStream) => {
                        localStreamRef.current = audioStream;
                        incomingCall.answer(audioStream);
                        currentCall.current = incomingCall;
                        incomingCall.on('stream', (remoteStream) => {
                            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
                        });
                        incomingCall.on('close', () => endCall());
                        setIncomingCall(null);
                    })
                    .catch(e => {
                        console.error('Failed to answer', e);
                        endCall();
                    });
            });
    };

    const endCall = () => {
        if (currentCall.current) currentCall.current.close();
        if (dataConnRef.current) dataConnRef.current.close();
        if (localStreamRef.current) localStreamRef.current.getTracks().forEach(track => track.stop());

        setInCall(false);
        setCallStatus('idle');
        setIncomingCall(null);
        currentCall.current = null;
        dataConnRef.current = null;
        setIsScreenSharing(false);
        setRemoteIsSharing(false);
        setRemoteVideoEnabled(true);
        setRemoteParticipant(null);
        setActiveUtility(null);
        setCallMessages([]);
    };

    const toggleMute = () => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    };

    const toggleVideo = () => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                if (!isScreenSharing) {
                    videoTrack.enabled = !videoTrack.enabled;
                    setIsVideoOn(videoTrack.enabled);

                    // Signal remote peer
                    if (dataConnRef.current && dataConnRef.current.open) {
                        dataConnRef.current.send({ type: 'video-status', enabled: videoTrack.enabled });
                    }
                } else {
                    stopScreenShare();
                }
            }
        }
    };

    // TODO:
    // - [x] Implement Channel Members Sidebar (instead of popup)
    // - [/] Refine Video Call UI Alignment
    //     - [x] Make remote video full-stage
    //     - [ ] Fix video "zoom" (switch to contain)
    //     - [ ] Add persistent name label on remote feed
    //     - [ ] Fix avatar/label centering in fallback mode
    // - [ ] Activate Call Bar Icons (Screen Share, etc.) <!-- Note: Partially done, screen share works -->
    const handleScreenShare = () => {
        if (isScreenSharing) {
            stopScreenShare();
            return;
        }

        navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
            .then((screenStream) => {
                const screenTrack = screenStream.getVideoTracks()[0];

                if (currentCall.current && currentCall.current.peerConnection) {
                    const sender = currentCall.current.peerConnection.getSenders().find(s => s.track.kind === 'video');
                    if (sender) sender.replaceTrack(screenTrack);
                }

                if (myVideoRef.current) myVideoRef.current.srcObject = screenStream;

                // Signal remote peer
                if (dataConnRef.current && dataConnRef.current.open) {
                    dataConnRef.current.send({ type: 'screen-share-status', isSharing: true });
                }

                screenTrack.onended = () => stopScreenShare();

                setIsScreenSharing(true);
                setIsVideoOn(true);
            })
            .catch((err) => console.error("Failed to share screen:", err));
    };

    const stopScreenShare = () => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((cameraStream) => {
                const cameraTrack = cameraStream.getVideoTracks()[0];

                if (currentCall.current && currentCall.current.peerConnection) {
                    const sender = currentCall.current.peerConnection.getSenders().find(s => s.track.kind === 'video');
                    if (sender) sender.replaceTrack(cameraTrack);
                }

                if (myVideoRef.current) myVideoRef.current.srcObject = cameraStream;
                localStreamRef.current = cameraStream;

                // Signal remote peer
                if (dataConnRef.current && dataConnRef.current.open) {
                    dataConnRef.current.send({ type: 'screen-share-status', isSharing: false });
                }

                setIsScreenSharing(false);
                setIsVideoOn(true);
            })
            .catch(err => console.error("Failed to revert to camera:", err));
    };

    const toggleUtility = (utility) => {
        setActiveUtility(activeUtility === utility ? null : utility);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'online': return '#00FF9C';
            case 'away': return '#FFD700';
            case 'busy': return '#FF4B4B';
            default: return '#9CA3AF';
        }
    };

    if (isLoading) return <div className="comm-layout" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 className="animate-spin text-[#00FF9C]" size={48} /></div>;

    return (
        <div className="comm-layout">
            {/* Left Icon Bar */}
            <div className="comm-left-bar">
                <div className="comm-logo-box" onClick={() => navigate('/dashboard')}><Zap size={24} color="black" /></div>
                <div className="comm-icon-group">
                    <div className="comm-icon-btn active"><Bell size={24} /></div>
                    <div className="comm-icon-btn"><MessageSquare size={24} /></div>
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
                    <button className="comm-add-btn" onClick={() => setShowTeamModal(true)}><Plus size={20} title="Add Team" /></button>
                </div>
                <div className="comm-nav-scroll custom-scrollbar">
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
                            </div>
                        ))}
                    </div>
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
                {!activeId ? (
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
                                <div className="comm-action-tool" onClick={() => startCall(false)}><Phone size={20} /></div>
                                <div className="comm-action-tool" onClick={() => startCall(true)}><Video size={20} /></div>
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
                                    {currentMessages.map((msg) => (
                                        <div key={msg._id || msg.id} className="comm-message-row">
                                            <div className="comm-msg-avatar">{msg.sender?.firstName?.[0]}</div>
                                            <div className="comm-msg-body">
                                                <div className="comm-msg-header">
                                                    <span className="comm-msg-sender">{msg.sender?.firstName}</span>
                                                    <span className="comm-msg-time">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                <div className="comm-msg-content">{msg.content}</div>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={chatEndRef} />
                                </div>
                                {/* Input */}
                                <div className="comm-input-area">
                                    <div className="comm-input-wrapper">
                                        <form onSubmit={handleSendMessage} className="comm-input-main">
                                            <input type="text" className="comm-text-input" placeholder="Type a message..." value={messageInput} onChange={(e) => setMessageInput(e.target.value)} />
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

                {/* --- Call Overlay (Fixed Full Screen) --- */}
                {inCall && (
                    <div style={{ position: 'fixed', inset: 0, background: '#000000', zIndex: 2000, display: 'flex', flexDirection: 'column' }}>
                        {/* Top Bar */}
                        <div style={{ height: '60px', background: '#1F1F1F', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: '1px solid #333' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Shield size={20} color="#CBD5E1" />
                                <span style={{ color: '#E2E8F0', fontFamily: 'monospace', fontSize: '14px' }}>{formatTime(callDuration)}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ background: '#2B2B2B', borderRadius: '8px', padding: '4px', display: 'flex' }}>
                                    <button className={`comm-call-btn ${activeUtility === 'people' ? 'active' : ''}`} onClick={() => toggleUtility('people')} title="People"><Users size={18} /></button>
                                    <button className={`comm-call-btn ${activeUtility === 'chat' ? 'active' : ''}`} onClick={() => toggleUtility('chat')} title="Chat"><MessageSquare size={18} /></button>
                                    <button className={`comm-call-btn ${activeUtility === 'reactions' ? 'active' : ''}`} onClick={() => toggleUtility('reactions')} title="Reactions"><Smile size={18} /></button>
                                </div>
                                <div style={{ width: '1px', height: '24px', background: '#3F3F46', margin: '0 8px' }}></div>
                                <div style={{ background: '#2B2B2B', borderRadius: '8px', padding: '4px', display: 'flex' }}>
                                    <button className={`comm-call-btn ${!isVideoOn && !isScreenSharing ? 'active' : ''}`} onClick={toggleVideo}>{isVideoOn || isScreenSharing ? <Video size={18} /> : <VideoOff size={18} />}</button>
                                    <button className={`comm-call-btn ${isMuted ? 'active' : ''}`} onClick={toggleMute}>{isMuted ? <MicOff size={18} /> : <Mic size={18} />}</button>
                                    <button className={`comm-call-btn ${isScreenSharing ? 'active' : ''}`} onClick={handleScreenShare}><MonitorUp size={18} /></button>
                                </div>
                                <button onClick={endCall} style={{ background: '#DC2626', color: 'white', padding: '8px 16px', borderRadius: '8px', marginLeft: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}><Phone size={16} style={{ transform: 'rotate(135deg)' }} /> Leave</button>
                            </div>
                        </div>

                        {/* Stage + Panel */}
                        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                            {/* Stage */}
                            <div style={{ flex: 1, position: 'relative', background: '#000', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {/* Remote Content (Video or Fallback) */}
                                <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {/* Remote Video */}
                                    <video
                                        ref={remoteVideoRef}
                                        autoPlay
                                        playsInline
                                        style={{
                                            width: (remoteIsSharing) ? '95%' : '100%',
                                            height: (remoteIsSharing) ? '95%' : '100%',
                                            objectFit: 'contain',
                                            display: callStatus === 'connected' ? 'block' : 'none',
                                            transition: 'all 0.5s ease-in-out'
                                        }}
                                    />

                                    {/* Persistent Remote Name Label */}
                                    {callStatus === 'connected' && (
                                        <div style={{
                                            position: 'absolute',
                                            bottom: '24px',
                                            left: '24px',
                                            padding: '6px 12px',
                                            background: 'rgba(0,0,0,0.6)',
                                            backdropFilter: 'blur(8px)',
                                            borderRadius: '6px',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            color: '#FFFFFF',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            zIndex: 5,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00FF9C' }}></div>
                                            {remoteParticipant?.name || 'Remote User'}
                                        </div>
                                    )}

                                    {/* Fallback View (Avatar if camera is off) */}
                                    {callStatus === 'connected' && !remoteIsSharing && !remoteVideoEnabled && (
                                        <div style={{
                                            position: 'absolute',
                                            inset: 0,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: 'radial-gradient(circle, #1F2937 0%, #0B0F14 100%)',
                                            zIndex: 1
                                        }}>
                                            {/* Concentric Avatar + Pulse Group */}
                                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px' }}>
                                                {/* Pulsing Outer Ring */}
                                                <div style={{
                                                    position: 'absolute',
                                                    width: '240px',
                                                    height: '240px',
                                                    border: '2px solid #00FF9C',
                                                    borderRadius: '50%',
                                                    opacity: 0.25,
                                                    animation: 'comm-pulse 3s infinite'
                                                }}></div>

                                                {/* Main Avatar Circle */}
                                                <div style={{
                                                    width: '180px',
                                                    height: '180px',
                                                    borderRadius: '50%',
                                                    background: '#374151',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '84px',
                                                    color: '#FFFFFF',
                                                    fontWeight: '800',
                                                    border: '4px solid #4B5563',
                                                    boxShadow: '0 0 60px rgba(0,0,0,0.7)',
                                                    zIndex: 2,
                                                    position: 'relative'
                                                }}>
                                                    {remoteParticipant?.name?.[0] || 'R'}
                                                </div>
                                            </div>

                                            {/* Participant Name */}
                                            <div style={{
                                                color: '#FFFFFF',
                                                fontSize: '28px',
                                                fontWeight: '700',
                                                letterSpacing: '0.02em',
                                                textShadow: '0 4px 12px rgba(0,0,0,0.8)'
                                            }}>
                                                {remoteParticipant?.name || 'Remote User'}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Self-View PiP */}
                                <div style={{
                                    position: 'absolute',
                                    bottom: '24px',
                                    right: activeUtility ? '24px' : '24px', // Adjust if needed
                                    width: '240px',
                                    height: '135px',
                                    background: '#1F1F1F',
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                    border: '2px solid #333',
                                    boxShadow: '0 12px 24px rgba(0,0,0,0.8)',
                                    zIndex: 10
                                }}>
                                    <video ref={myVideoRef} autoPlay muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '10px',
                                        left: '10px',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        background: 'rgba(0,0,0,0.6)',
                                        fontSize: '11px',
                                        color: 'white',
                                        fontWeight: 'bold'
                                    }}>
                                        You
                                    </div>
                                </div>
                            </div>

                            {/* Side Panel */}
                            {activeUtility && (
                                <div style={{ width: '320px', background: '#1F1F1F', borderLeft: '1px solid #333', display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', borderBottom: '1px solid #333' }}>
                                        <h3 style={{ color: 'white', fontWeight: 'bold', fontSize: '16px' }}>{activeUtility === 'people' ? 'People' : activeUtility === 'chat' ? 'Meeting Chat' : 'Details'}</h3>
                                        <button onClick={() => setActiveUtility(null)} style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}><X size={20} /></button>
                                    </div>

                                    {activeUtility === 'people' && (
                                        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '12px' }}>Y</div>
                                                <div><div style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>You</div><div style={{ color: '#9CA3AF', fontSize: '12px' }}>Organizer</div></div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#1E293B', border: '1px solid #00FF9C', color: '#00FF9C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px' }}>{remoteParticipant?.name?.[0] || 'R'}</div>
                                                <div><div style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>{remoteParticipant?.name || 'Remote User'}</div><div style={{ color: '#9CA3AF', fontSize: '12px' }}>Participant</div></div>
                                            </div>
                                        </div>
                                    )}

                                    {activeUtility === 'chat' && (
                                        <>
                                            <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                {callMessages.length === 0 ? <div style={{ textAlign: 'center', color: '#6B7280', fontSize: '12px', marginTop: '16px' }}>No messages yet. Messages here are ephemeral.</div> :
                                                    callMessages.map(msg => (
                                                        <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: msg.isMe ? 'flex-end' : 'flex-start' }}>
                                                            <div style={{ fontSize: '10px', color: '#9CA3AF' }}>{msg.senderName} • {msg.time}</div>
                                                            <div style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '13px', maxWidth: '90%', background: msg.isMe ? '#333' : '#005f3a', color: 'white' }}>
                                                                {msg.content}
                                                            </div>
                                                        </div>
                                                    ))}
                                                <div ref={callChatEndRef} />
                                            </div>
                                            <div style={{ padding: '16px', borderTop: '1px solid #333' }}>
                                                <form onSubmit={sendCallMessage} style={{ display: 'flex', gap: '8px' }}>
                                                    <input type="text" placeholder="Type..." value={callMessageInput} onChange={e => setCallMessageInput(e.target.value)} style={{ flex: 1, background: '#111', border: '1px solid #333', borderRadius: '4px', padding: '8px', color: 'white', fontSize: '13px', outline: 'none' }} />
                                                    <button type="submit" disabled={!callMessageInput.trim()} style={{ background: 'transparent', border: 'none', color: '#00FF9C', cursor: 'pointer' }}><Send size={16} /></button>
                                                </form>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* --- Incoming Modal (Fixed Full Screen) --- */}
                {callStatus === 'incoming' && incomingCall && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                        <div style={{ background: '#1F1F1F', border: '1px solid #333', padding: '32px', borderRadius: '12px', width: '100%', maxWidth: '384px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                            <div style={{ width: '96px', height: '96px', margin: '0 auto 24px auto', borderRadius: '50%', background: '#333', border: '4px solid rgba(0, 255, 156, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                <Users size={40} />
                            </div>
                            <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>Incoming Call</h3>
                            <p style={{ color: '#9CA3AF', marginBottom: '32px' }}>Peer: {incomingCall.peer}</p>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '24px' }}>
                                <button onClick={endCall} style={{ background: '#EF4444', padding: '16px', borderRadius: '50%', color: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}><Phone size={24} style={{ transform: 'rotate(135deg)' }} /></button>
                                <button onClick={answerCall} style={{ background: '#00FF9C', padding: '16px', borderRadius: '50%', color: 'black', border: 'none', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}><Phone size={24} /></button>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- Utility Modals (Fixed Full Screen) --- */}
                {showTeamModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                        <div style={{ background: '#111827', border: '1px solid rgba(0, 255, 156, 0.2)', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '448px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}><h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#00FF9C' }}>New Team</h3><X size={24} color="white" style={{ cursor: 'pointer' }} onClick={() => setShowTeamModal(false)} /></div>
                            <form onSubmit={handleCreateTeam}>
                                <input style={{ width: '100%', background: '#0B0F14', border: '1px solid #1F2937', borderRadius: '8px', padding: '12px', color: 'white', marginBottom: '16px', outline: 'none' }} placeholder="Team Name" value={newTeamName} onChange={e => setNewTeamName(e.target.value)} />
                                <button style={{ width: '100%', background: '#00FF9C', color: 'black', fontWeight: 'bold', padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>Create</button>
                            </form>
                        </div>
                    </div>
                )}
                {showChannelModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                        <div style={{ background: '#111827', border: '1px solid rgba(0, 255, 156, 0.2)', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '448px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}><h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#00FF9C' }}>New Channel</h3><X size={24} color="white" style={{ cursor: 'pointer' }} onClick={() => setShowChannelModal(false)} /></div>
                            <form onSubmit={handleCreateChannel}>
                                <select style={{ width: '100%', background: '#0B0F14', border: '1px solid #1F2937', borderRadius: '8px', padding: '12px', color: 'white', marginBottom: '16px', outline: 'none' }} value={selectedTeamId} onChange={e => setSelectedTeamId(e.target.value)}>
                                    <option value="">Select Team</option>
                                    {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                                </select>
                                <input style={{ width: '100%', background: '#0B0F14', border: '1px solid #1F2937', borderRadius: '8px', padding: '12px', color: 'white', marginBottom: '24px', outline: 'none' }} placeholder="Channel Name" value={newChannelName} onChange={e => setNewChannelName(e.target.value)} />
                                <button style={{ width: '100%', background: '#00FF9C', color: 'black', fontWeight: 'bold', padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>Create</button>
                            </form>
                        </div>
                    </div>
                )}
                {showMemberModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                        <div style={{ background: '#111827', border: '1px solid rgba(0, 255, 156, 0.2)', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '448px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}><h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#00FF9C' }}>Add Member</h3><X size={24} color="white" style={{ cursor: 'pointer' }} onClick={() => setShowMemberModal(false)} /></div>
                            <form onSubmit={handleAddMember}>
                                <div style={{ marginBottom: '16px', color: '#9CA3AF', fontSize: '14px' }}>Add a user to the team by their email address.</div>
                                <input style={{ width: '100%', background: '#0B0F14', border: '1px solid #1F2937', borderRadius: '8px', padding: '12px', color: 'white', marginBottom: '24px', outline: 'none' }} placeholder="User Email" value={newMemberEmail} onChange={e => setNewMemberEmail(e.target.value)} type="email" />
                                <button style={{ width: '100%', background: '#00FF9C', color: 'black', fontWeight: 'bold', padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>Add Member</button>
                            </form>
                        </div>
                    </div>
                )}


            </div>
        </div>
    );
};

export default Communication;
