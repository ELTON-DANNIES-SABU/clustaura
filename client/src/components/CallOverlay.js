import React, { useEffect, useRef, useState } from 'react';
import useCommunicationStore from '../store/communicationStore';
import {
    Mic, MicOff, Video as VideoIcon, VideoOff, Phone,
    MonitorUp, Users, MessageSquare, Shield, Info, MoreVertical,
    Check, X, ScreenShare, Layout
} from 'lucide-react';
import Peer from 'peerjs';
import MeetingPreview from './MeetingPreview';

const CallOverlay = () => {
    const { callState, endCallGlobal, socket, teams, directMessages, enterCall } = useCommunicationStore();
    const [myPeerId, setMyPeerId] = useState('');
    const [roomParticipants, setRoomParticipants] = useState([]); // { socketId, userId }
    const [peers, setPeers] = useState([]); // Array of { peerId, stream, call }
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [callDuration, setCallDuration] = useState(0);
    const [isStreamReady, setIsStreamReady] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);

    const myVideoRef = useRef(null);
    const peerInstance = useRef(null);
    const peersRef = useRef([]); // synced with peers state for cleanup
    const localStreamRef = useRef(null);

    // Helper to get user details
    const getUserDetails = (userId) => {
        if (!userId) return { name: 'Unknown User', avatar: '?' };

        const targetId = userId.toString();

        // Check current User
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const me = JSON.parse(userStr);
            const myId = (me._id || me.id || '').toString();
            if (myId === targetId) return { name: `${me.firstName} (You)`, avatar: me.firstName?.[0] };
        }

        // Check Team Members
        if (teams) {
            for (const team of teams) {
                const member = team.members.find(m => (m._id || m.id || '').toString() === targetId);
                if (member) return { name: `${member.firstName} ${member.lastName}`, avatar: member.firstName?.[0] };
            }
        }

        // Check Friends/DMs
        if (directMessages) {
            const friend = directMessages.find(f => (f._id || f.id || '').toString() === targetId);
            if (friend) return { name: friend.name || `${friend.firstName} ${friend.lastName}`, avatar: (friend.name?.[0] || friend.firstName?.[0]) };
        }

        return { name: 'Expert Solver', avatar: 'E' };
    };

    // Initialize Call
    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (!userStr) return;
        const user = JSON.parse(userStr);

        const peer = new Peer(user._id, {
            path: '/peerjs',
            host: '/',
            port: window.location.port || 3000
        });
        peerInstance.current = peer;

        peer.on('open', (id) => {
            console.log('My Peer ID:', id);
            setMyPeerId(id);
        });

        // Handle incoming calls (Mesh)
        peer.on('call', (call) => {
            console.log("Receiving call from", call.peer);
            call.answer(localStreamRef.current);
            call.on('stream', (remoteStream) => {
                addPeer(call.peer, remoteStream, call);
            });
        });

        // Get Local Stream
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((stream) => {
                localStreamRef.current = stream;
                if (myVideoRef.current) myVideoRef.current.srcObject = stream;
                setIsStreamReady(true);
            })
            .catch(err => console.error("Error accessing media:", err));

        // Socket Signal Listeners
        if (socket) {
            socket.on('all_users_in_call', (usersInRoom) => {
                console.log("All users in call:", usersInRoom);
                // UsersInRoom is now [{ socketId, userId }]
                setRoomParticipants(usersInRoom);

                usersInRoom.forEach(user => {
                    // Only call if we have a stream
                    if (localStreamRef.current) {
                        // We use user.socketId for signaling if needed, but peer call uses userId (peerId)
                        // Assuming peerId = userId
                        connectToNewUser(user.userId, localStreamRef.current, peer);
                    }
                });
            });

            socket.on('call_user_joined', ({ callerId, userId }) => {
                console.log("User joined:", userId);
                setRoomParticipants(prev => {
                    if (prev.find(p => p.userId === userId)) return prev;
                    return [...prev, { socketId: callerId, userId }];
                });
            });

            socket.on('user_left_call', (id) => {
                console.log("User/Socket left:", id);
                removePeer(id);
                setRoomParticipants(prev => prev.filter(p => p.userId !== id && p.socketId !== id));
            });
        }

        // Timer
        const timer = setInterval(() => setCallDuration(p => p + 1), 1000);

        return () => {
            clearInterval(timer);
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
            }
            if (peerInstance.current) peerInstance.current.destroy();
            socket?.off('all_users_in_call');
            socket?.off('call_user_joined');
            socket?.off('user_left_call');
        };
    }, []);

    // Join Room Effect
    useEffect(() => {
        if (myPeerId && isStreamReady && socket && callState.roomId) {
            console.log("Joining call room:", callState.roomId);
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                socket.emit('join_call_room', { roomId: callState.roomId, userId: user._id });
            }
        }
    }, [myPeerId, isStreamReady, socket, callState.roomId]);

    const connectToNewUser = (userId, stream, peer) => {
        const call = peer.call(userId, stream);
        if (call) {
            call.on('stream', (remoteStream) => {
                addPeer(userId, remoteStream, call);
            });
            call.on('close', () => {
                removePeer(userId);
            });
            call.on('error', (e) => console.error("Call error", e));
        }
    };

    const addPeer = (peerId, stream, callObj) => {
        setPeers(prev => {
            if (prev.find(p => p.peerId === peerId)) return prev;
            const newPeers = [...prev, { peerId, stream, call: callObj }];
            peersRef.current = newPeers;
            return newPeers;
        });
    };

    const removePeer = (peerId) => {
        setPeers(prev => {
            const newPeers = prev.filter(p => p.peerId !== peerId);
            peersRef.current = newPeers;
            return newPeers;
        });
    };

    const toggleMute = () => {
        if (localStreamRef.current) {
            const track = localStreamRef.current.getAudioTracks()[0];
            if (track) {
                track.enabled = !track.enabled;
                setIsMuted(!track.enabled);
            }
        }
    };

    const toggleVideo = () => {
        if (localStreamRef.current) {
            const track = localStreamRef.current.getVideoTracks()[0];
            if (track) {
                track.enabled = !track.enabled;
                setIsVideoOn(track.enabled);
            }
        }
    };

    const handleScreenShare = async () => {
        if (isScreenSharing) {
            stopScreenShare();
        } else {
            try {
                const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                const videoTrack = stream.getVideoTracks()[0];

                if (localStreamRef.current && peerInstance.current) {
                    Object.values(peerInstance.current.connections).forEach(conns => {
                        conns.forEach(conn => {
                            if (conn.peerConnection) {
                                const sender = conn.peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
                                if (sender) sender.replaceTrack(videoTrack);
                            }
                        });
                    });

                    if (myVideoRef.current) myVideoRef.current.srcObject = stream;

                    videoTrack.onended = () => stopScreenShare();
                    setIsScreenSharing(true);
                }
            } catch (error) {
                console.error("Error starting screen share:", error);
            }
        }
    };

    const stopScreenShare = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            const videoTrack = stream.getVideoTracks()[0];

            if (peerInstance.current) {
                Object.values(peerInstance.current.connections).forEach(conns => {
                    conns.forEach(conn => {
                        if (conn.peerConnection) {
                            const sender = conn.peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
                            if (sender) sender.replaceTrack(videoTrack);
                        }
                    });
                });
            }

            if (myVideoRef.current) myVideoRef.current.srcObject = stream;
            localStreamRef.current = stream;
            setIsScreenSharing(false);

        } catch (error) {
            console.error("Error stopping screen share:", error);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    // Unified Participant List
    // Merge known room participants with active peer connections
    const allParticipants = [
        { isLocal: true, id: myPeerId, stream: localStreamRef.current, status: 'connected' },
        ...roomParticipants
            .filter(rp => rp.userId !== myPeerId)
            .map(rp => {
                const peer = peers.find(p => p.peerId === rp.userId);
                return {
                    isLocal: false,
                    id: rp.userId,
                    stream: peer?.stream,
                    status: peer ? 'connected' : 'connecting'
                };
            })
    ];

    // Safety: Add any peers not in roomParticipants (to avoid missing someone who joined but didn't trigger presence)
    peers.forEach(peer => {
        if (!allParticipants.find(p => p.id === peer.peerId)) {
            allParticipants.push({ isLocal: false, id: peer.peerId, stream: peer.stream, status: 'connected' });
        }
    });

    // --- RENDER LOGIC ---

    // 1. Preview State
    if (callState.callStatus === 'preview') {
        const userDetails = getUserDetails(myPeerId);
        return (
            <MeetingPreview
                callType={callState.callType}
                userDetails={userDetails}
                onJoin={({ isMuted: muted, isVideoOff: videoOff }) => {
                    setIsMuted(muted);
                    setIsVideoOn(!videoOff);
                    enterCall();
                }}
            />
        );
    }

    // 2. Main Call State
    return (
        <div style={{
            position: 'fixed', inset: 0, background: '#202124', zIndex: 10000,
            display: 'flex', flexDirection: 'column', color: 'white',
            fontFamily: 'Inter, system-ui, sans-serif'
        }}>

            {/* Main View Area */}
            <div style={{
                flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                padding: '16px', gap: '16px', overflow: 'auto', alignContent: 'center',
                justifyItems: 'center'
            }}>
                {allParticipants.map((participant, index) => {
                    const userDetails = getUserDetails(participant.id);
                    const hasVideo = participant.isLocal ? isVideoOn : (participant.stream && participant.stream.getVideoTracks().length > 0 && participant.stream.getVideoTracks()[0].enabled);

                    return (
                        <div key={participant.id || index} style={{
                            position: 'relative', background: '#3c4043', borderRadius: '12px', overflow: 'hidden',
                            width: '100%', maxWidth: '640px', aspectRatio: '16/9',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            {hasVideo ? (
                                <ParticipantVideo stream={participant.stream} isLocal={participant.isLocal} />
                            ) : (
                                <div style={{
                                    width: '100%', height: '100%', background: '#3c4043',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    padding: '20px', textAlign: 'center'
                                }}>
                                    <div style={{
                                        width: '100px', height: '100px', borderRadius: '50%', background: '#1F2937',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '40px', fontWeight: 'bold', color: '#00FF9C', marginBottom: '16px',
                                        border: '2px solid rgba(255,255,255,0.1)'
                                    }}>
                                        {userDetails.avatar}
                                    </div>
                                    <div style={{ color: 'white', fontWeight: '500', fontSize: '18px' }}>
                                        {userDetails.name}
                                    </div>
                                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#9ca3af' }}>
                                        {participant.status === 'connecting' ? 'Joining...' : ''}
                                    </div>
                                </div>
                            )}

                            {/* Bottom Label Overlay */}
                            <div style={{
                                position: 'absolute', bottom: '16px', left: '16px',
                                background: 'rgba(32, 33, 36, 0.6)', padding: '4px 12px',
                                borderRadius: '4px', fontSize: '13px', fontWeight: '500',
                                display: 'flex', alignItems: 'center', gap: '8px'
                            }}>
                                {userDetails.name} {participant.isLocal && '(You)'}
                                {!hasVideo && <VideoOff size={14} color="#ea4335" />}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Bottom Control Bar - Google Meet Style */}
            <div style={{
                height: '80px', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', padding: '0 24px',
                background: '#202124', borderTop: '1px solid rgba(255,255,255,0.1)'
            }}>
                {/* Left: Meeting Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '300px' }}>
                    <div style={{ fontSize: '16px', fontWeight: '500' }}>
                        {formatTime(callDuration)} | ClustAura Meeting
                    </div>
                </div>

                {/* Center: Controls */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button
                        onClick={toggleMute}
                        style={{
                            width: '44px', height: '44px', borderRadius: '50%', border: 'none',
                            cursor: 'pointer', background: isMuted ? '#ea4335' : '#3c4043',
                            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                        {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>
                    <button
                        onClick={toggleVideo}
                        style={{
                            width: '44px', height: '44px', borderRadius: '50%', border: 'none',
                            cursor: 'pointer', background: !isVideoOn ? '#ea4335' : '#3c4043',
                            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                        {isVideoOn ? <VideoIcon size={20} /> : <VideoOff size={20} />}
                    </button>
                    <button
                        onClick={handleScreenShare}
                        style={{
                            width: '44px', height: '44px', borderRadius: '50%', border: 'none',
                            cursor: 'pointer', background: isScreenSharing ? '#8ab4f8' : '#3c4043',
                            color: isScreenSharing ? '#202124' : 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                        <ScreenShare size={20} />
                    </button>
                    <button style={{
                        width: '44px', height: '44px', borderRadius: '50%', border: 'none',
                        cursor: 'pointer', background: '#3c4043', color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <MoreVertical size={20} />
                    </button>
                    <button
                        onClick={endCallGlobal}
                        style={{
                            padding: '0 24px', height: '44px', borderRadius: '22px', border: 'none',
                            cursor: 'pointer', background: '#ea4335', color: 'white',
                            display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600'
                        }}>
                        <Phone size={20} style={{ transform: 'rotate(135deg)' }} /> Leave
                    </button>
                </div>

                {/* Right: Meeting Tools */}
                <div style={{ display: 'flex', gap: '8px', width: '300px', justifyContent: 'flex-end' }}>
                    <button style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '8px' }}><Info size={22} /></button>
                    <button style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '8px' }}><Users size={22} /></button>
                    <button style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '8px' }}><MessageSquare size={22} /></button>
                    <button style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '8px' }}><Layout size={22} /></button>
                </div>
            </div>
        </div>
    );
};

// Helper component to handle stream binding
const ParticipantVideo = ({ stream, isLocal }) => {
    const videoRef = useRef(null);
    useEffect(() => {
        if (videoRef.current && stream) videoRef.current.srcObject = stream;
    }, [stream]);
    return <video ref={videoRef} autoPlay muted={isLocal} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
};

export default CallOverlay;
