import React, { useEffect, useRef, useState, useCallback } from 'react';
import useCommunicationStore from '../store/communicationStore';
import {
    Mic, MicOff, Video as VideoIcon, VideoOff, Phone,
    MonitorUp, Users, MessageSquare, Shield, Info, MoreVertical,
    Check, X, ScreenShare, Layout, Monitor, Smartphone
} from 'lucide-react';
import MeetingPreview from './MeetingPreview';

// Sub-component to handle audio stream playback independently
const ParticipantAudio = ({ stream }) => {
    const audioRef = useRef(null);

    useEffect(() => {
        if (audioRef.current && stream) {
            console.log("[Audio] Attaching stream to persistent audio element");
            audioRef.current.srcObject = stream;
            // Explicitly call play() as autoPlay can sometimes be finicky with hidden elements
            audioRef.current.play().catch(e => console.warn("[Audio] Playback failed/prevented:", e));
        }
    }, [stream]);

    return <audio ref={audioRef} autoPlay playsInline style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }} />;
};

// Sub-component to handle video track attachment
const ParticipantVideo = ({ stream, isLocal }) => {
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={true} // Video element always muted as we handle audio separately for remotes
            style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: isLocal ? 'scaleX(-1)' : 'none'
            }}
        />
    );
};

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};

const CallOverlay = () => {
    const {
        callState, setCallState, endCallGlobal, socket, teams, directMessages,
        enterCall, activeCallParticipants, updateMediaState
    } = useCommunicationStore();

    // Auth helpers
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const myId = user ? (user._id || user.id) : null;

    const [remoteStreams, setRemoteStreams] = useState({}); // { socketId: stream }
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [callDuration, setCallDuration] = useState(0);
    const [isStreamReady, setIsStreamReady] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);

    const myVideoRef = useRef(null);
    const localStreamRef = useRef(null);
    const pcsRef = useRef({}); // { socketId: RTCPeerConnection }

    // Updated grid layout for centered row behavior
    const getGridStyles = (count) => {
        return {
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '80px',
            padding: '40px',
            alignContent: 'center',
            minHeight: 'calc(100vh - 96px)'
        };
    };

    // Helper to get user details
    const getUserDetails = (userId) => {
        if (!userId) return { name: 'Identifying...', avatar: '?' };
        const targetId = userId.toString();

        if (myId && String(myId) === targetId) {
            return {
                name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'You',
                avatar: user?.firstName?.[0] || 'U'
            };
        }

        const authoritativeParticipants = activeCallParticipants[callState.roomId] || [];
        const participant = authoritativeParticipants.find(p => String(p.userId) === targetId);
        if (participant) {
            return {
                name: participant.name,
                avatar: participant.avatar || participant.name?.[0] || 'U'
            };
        }

        return { name: 'User', avatar: 'U' };
    };

    const createPeerConnection = useCallback((remoteSocketId, remoteUser) => {
        // If we already have a pc for this socket, close it first to be safe
        if (pcsRef.current[remoteSocketId]) {
            console.log(`[WebRTC] Closing existing PC for ${remoteSocketId} before creating new one`);
            pcsRef.current[remoteSocketId].close();
            delete pcsRef.current[remoteSocketId];
            setRemoteStreams(prev => {
                const next = { ...prev };
                delete next[remoteSocketId];
                return next;
            });
        }

        console.log(`[WebRTC] Creating PC for ${remoteSocketId} (${remoteUser.name})`);
        const pc = new RTCPeerConnection(ICE_SERVERS);

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('call:ice-candidate', {
                    to: remoteSocketId,
                    candidate: event.candidate,
                    from: { socketId: socket.id, userId: myId, name: `${user.firstName} ${user.lastName}` }
                });
            }
        };

        pc.ontrack = (event) => {
            console.log(`[WebRTC] Received ${event.track.kind} track from ${remoteSocketId}`);
            setRemoteStreams(prev => {
                const existingStream = prev[remoteSocketId];
                if (existingStream) {
                    // Add track to existing stream if not already there
                    if (!existingStream.getTracks().find(t => t.id === event.track.id)) {
                        existingStream.addTrack(event.track);
                    }
                    return { ...prev, [remoteSocketId]: new MediaStream(existingStream.getTracks()) };
                }
                const newStream = event.streams[0] || new MediaStream([event.track]);
                return { ...prev, [remoteSocketId]: new MediaStream(newStream.getTracks()) };
            });
        };

        pc.onconnectionstatechange = () => {
            console.log(`[WebRTC] PC State with ${remoteSocketId}: ${pc.connectionState}`);
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
                setRemoteStreams(prev => {
                    const next = { ...prev };
                    delete next[remoteSocketId];
                    return next;
                });
                delete pcsRef.current[remoteSocketId];
            }
        };

        // Add local tracks
        if (localStreamRef.current) {
            const tracks = localStreamRef.current.getTracks();
            console.log(`[WebRTC] Adding ${tracks.length} local tracks to PC for ${remoteSocketId}`);
            tracks.forEach(track => {
                console.log(`[WebRTC] Adding ${track.kind} track: ${track.label}`);
                pc.addTrack(track, localStreamRef.current);
            });
        }

        pcsRef.current[remoteSocketId] = pc;
        return pc;
    }, [socket, myId, user]);

    // Initialize Local Media
    useEffect(() => {
        const getMedia = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                localStreamRef.current = stream;
                if (myVideoRef.current) myVideoRef.current.srcObject = stream;
                setIsStreamReady(true);
            } catch (err) {
                console.warn("[Media] Camera failed, trying audio only:", err);
                try {
                    const audioStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
                    localStreamRef.current = audioStream;
                    setIsVideoOn(false);
                    setIsStreamReady(true);
                } catch (audioErr) {
                    console.error("[Media] All media access failed:", audioErr);
                    setIsVideoOn(false);
                    setIsStreamReady(true);
                }
            }
        };
        getMedia();

        return () => {
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
            }
            Object.values(pcsRef.current).forEach(pc => pc.close());
        };
    }, []);

    // Signaling Handlers
    useEffect(() => {
        if (!socket || !isStreamReady || callState.callStatus !== 'connected') return;

        const handleParticipants = async (participants) => {
            console.log("[Signaling] Received participant list:", participants);
            for (const p of participants) {
                if (p.socketId !== socket.id) {
                    const pc = createPeerConnection(p.socketId, p);
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    socket.emit('call:offer', {
                        to: p.socketId,
                        offer: offer,
                        from: { socketId: socket.id, userId: myId, name: `${user.firstName} ${user.lastName}` }
                    });
                }
            }
        };

        const handleOffer = async ({ offer, from }) => {
            console.log(`[Signaling] Offer received from ${from.socketId}`);
            const pc = createPeerConnection(from.socketId, from);
            if (pc.signalingState !== "stable") {
                console.warn("[Signaling] PC not stable for offer, resetting");
                // Optional: handle rollback if needed
            }
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('call:answer', {
                to: from.socketId,
                answer: answer,
                from: { socketId: socket.id, userId: myId, name: `${user.firstName} ${user.lastName}` }
            });
        };

        const handleAnswer = async ({ answer, from }) => {
            console.log(`[Signaling] Answer received from ${from.socketId}`);
            const pc = pcsRef.current[from.socketId];
            if (pc && pc.signalingState === 'have-local-offer') {
                await pc.setRemoteDescription(new RTCSessionDescription(answer));
            } else {
                console.warn(`[Signaling] Received answer in state ${pc?.signalingState}, ignoring`);
            }
        };

        const handleIceCandidate = async ({ candidate, from }) => {
            const pc = pcsRef.current[from.socketId];
            if (pc && pc.remoteDescription) {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }
        };

        const handleUserLeft = ({ socketId, userId }) => {
            console.log(`[Signaling] User left: ${socketId} (User: ${userId})`);
            if (pcsRef.current[socketId]) {
                pcsRef.current[socketId].close();
                delete pcsRef.current[socketId];
                setRemoteStreams(prev => {
                    const next = { ...prev };
                    delete next[socketId];
                    return next;
                });
            }
        };

        socket.on('call:participants', handleParticipants);
        socket.on('call:offer', handleOffer);
        socket.on('call:answer', handleAnswer);
        socket.on('call:ice-candidate', handleIceCandidate);
        socket.on('call:user-left', handleUserLeft);

        return () => {
            console.log("[Signaling] Removing component-level listeners");
            socket.off('call:participants', handleParticipants);
            socket.off('call:offer', handleOffer);
            socket.off('call:answer', handleAnswer);
            socket.off('call:ice-candidate', handleIceCandidate);
            socket.off('call:user-left', handleUserLeft);
        };
    }, [socket, isStreamReady, callState.callStatus, createPeerConnection, myId, user]);

    // Timer
    useEffect(() => {
        const timer = setInterval(() => setCallDuration(p => p + 1), 1000);
        return () => clearInterval(timer);
    }, []);

    const toggleMute = () => {
        if (localStreamRef.current) {
            const track = localStreamRef.current.getAudioTracks()[0];
            if (track) {
                track.enabled = !track.enabled;
                const newMuted = !track.enabled;
                setIsMuted(newMuted);
                socket.emit('call:media-toggle', { roomId: callState.roomId, userId: myId, mediaType: 'mic', enabled: !newMuted });
            }
        }
    };

    const toggleVideo = () => {
        if (localStreamRef.current) {
            const track = localStreamRef.current.getVideoTracks()[0];
            if (track) {
                track.enabled = !track.enabled;
                const newVideoOn = track.enabled;
                setIsVideoOn(newVideoOn);
                socket.emit('call:media-toggle', { roomId: callState.roomId, userId: myId, mediaType: 'video', enabled: newVideoOn });
            }
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    const allParticipantsInRoom = activeCallParticipants[callState.roomId] || [];

    // --- RENDER LOGIC ---

    if (callState.callStatus === 'incoming') {
        const details = getUserDetails(callState.initiatorId);
        return (
            <div style={{
                position: 'fixed', inset: 0, zIndex: 10001,
                background: 'linear-gradient(135deg, #1a1c1e 0%, #0f1011 100%)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontFamily: 'Inter, system-ui, sans-serif'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '120px', height: '120px', borderRadius: '50%',
                        background: '#2d2e30', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '48px', margin: '0 auto 24px', fontWeight: 'bold'
                    }}>
                        {details.avatar}
                    </div>
                    <h1>{details.name}</h1>
                    <p style={{ color: '#9ca3af', marginBottom: '40px' }}>Incoming {callState.callType === 'video' ? 'Video' : 'Audio'} Call...</p>
                    <div style={{ display: 'flex', gap: '32px' }}>
                        <button onClick={endCallGlobal} style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#ea4335', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Phone size={32} style={{ transform: 'rotate(135deg)' }} />
                        </button>
                        <button onClick={enterCall} style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#00FF9C', color: '#000', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <VideoIcon size={32} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (callState.callStatus === 'preview') {
        const userDetails = getUserDetails(myId);
        return (
            <MeetingPreview
                callType={callState.callType}
                userDetails={userDetails}
                stream={localStreamRef.current}
                onJoin={({ isMuted: muted, isVideoOff: videoOff }) => {
                    setIsMuted(muted);
                    setIsVideoOn(!videoOff);
                    // Ensure tracks match initial state
                    if (localStreamRef.current) {
                        localStreamRef.current.getAudioTracks().forEach(t => t.enabled = !muted);
                        localStreamRef.current.getVideoTracks().forEach(t => t.enabled = !videoOff);
                    }
                    enterCall();
                }}
            />
        );
    }

    return (
        <div style={{
            position: 'fixed', inset: 0, background: '#000000', zIndex: 10000,
            display: 'flex', flexDirection: 'column', color: 'white',
            fontFamily: 'Inter, system-ui, sans-serif'
        }}>
            <div style={{
                flex: 1,
                ...getGridStyles(allParticipantsInRoom.length),
                overflow: 'auto'
            }}>
                {allParticipantsInRoom.map((p) => {
                    const isLocal = String(p.userId) === String(myId);
                    const stream = isLocal ? localStreamRef.current : remoteStreams[p.socketId];

                    // Unified naming from signaling state
                    const name = p.name || 'User';
                    const avatar = p.avatar || name[0] || 'U';

                    // Media State calculation 
                    const videoEnabled = isLocal ? isVideoOn : (p.mediaState?.video !== false);
                    const micEnabled = isLocal ? !isMuted : (p.mediaState?.mic !== false);

                    return (
                        <div key={p.socketId || p.userId} style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px'
                        }}>
                            {/* Persistent Audio for remotes */}
                            {!isLocal && stream && <ParticipantAudio stream={stream} />}

                            <div style={{
                                width: '180px', height: '180px', borderRadius: '50%', overflow: 'hidden',
                                background: '#1a1d21', position: 'relative',
                                border: '1px solid rgba(255,255,255,0.05)',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                            }}>
                                {stream && videoEnabled ? (
                                    <ParticipantVideo stream={stream} isLocal={isLocal} />
                                ) : (
                                    <div style={{
                                        fontSize: '72px', height: '100%', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center',
                                        fontWeight: '500', color: '#ffffff',
                                        background: 'linear-gradient(135deg, #2d2e30 0%, #1a1d21 100%)'
                                    }}>
                                        {avatar}
                                    </div>
                                )}
                            </div>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                fontSize: '16px', fontWeight: '500', color: '#f1f3f4'
                            }}>
                                {!micEnabled && <MicOff size={16} color="#ea4335" />}
                                <span>{name} {isLocal && '(You)'}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div style={{
                height: '96px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 40px', background: 'rgba(23, 23, 23, 0.95)',
                backdropFilter: 'blur(10px)', borderTop: '1px solid rgba(255,255,255,0.05)'
            }}>
                <div style={{ width: '300px', fontSize: '14px', color: '#9ca3af', fontWeight: '600' }}>
                    {formatTime(callDuration)} | <span style={{ color: '#00FF9C' }}>CLUSTAURA HD</span>
                </div>

                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <button
                        onClick={toggleMute}
                        style={{
                            width: '52px', height: '52px', borderRadius: '50%',
                            background: isMuted ? '#ea4335' : 'rgba(255,255,255,0.1)',
                            border: 'none', color: 'white', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s'
                        }}
                    >
                        {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
                    </button>
                    <button
                        onClick={toggleVideo}
                        style={{
                            width: '52px', height: '52px', borderRadius: '50%',
                            background: !isVideoOn ? '#ea4335' : 'rgba(255,255,255,0.1)',
                            border: 'none', color: 'white', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s'
                        }}
                    >
                        {isVideoOn ? <VideoIcon size={22} /> : <VideoOff size={22} />}
                    </button>
                    <button
                        onClick={endCallGlobal}
                        style={{
                            width: '64px', height: '52px', borderRadius: '26px',
                            background: '#ea4335', border: 'none', color: 'white',
                            cursor: 'pointer', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', transition: 'all 0.2s'
                        }}
                    >
                        <Phone size={24} style={{ transform: 'rotate(135deg)' }} />
                    </button>
                </div>

                <div style={{ width: '300px' }}></div>
            </div>
        </div>
    );
};

export default CallOverlay;
