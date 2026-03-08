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
            audioRef.current.play().catch(e => console.warn("[Audio] Playback failed/prevented:", e));
        }
    }, [stream]);

    return <audio ref={audioRef} autoPlay playsInline style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }} />;
};

// Sub-component to handle video track attachment
const ParticipantVideo = ({ stream, isLocal, isScreen }) => {
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            console.log(`[Video] Attaching stream (isScreen: ${isScreen}, id: ${stream.id})`);
            const video = videoRef.current;
            video.srcObject = stream;
            video.play().catch(e => {
                console.warn("[Video] Playback failed/prevented:", e);
            });
        }
    }, [stream, isScreen]);

    return (
        <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isLocal} // Only mute local video to prevent echo
            style={{
                width: '100%',
                height: '100%',
                objectFit: isScreen ? 'contain' : 'cover',
                transform: (isLocal && !isScreen) ? 'scaleX(-1)' : 'none'
            }}
        />
    );
};

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        // Free TURN server for cross-device / NAT traversal
        {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        },
        {
            urls: 'turn:openrelay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        },
        {
            urls: 'turn:openrelay.metered.ca:443?transport=tcp',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        }
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
    const [connectionsEstablished, setConnectionsEstablished] = useState({});

    const myVideoRef = useRef(null);
    const localStreamRef = useRef(null);
    const screenStreamRef = useRef(null);
    const pcsRef = useRef({}); // { socketId: RTCPeerConnection }
    const makingOffer = useRef({}); // Track ongoing offers to prevent glare

    // Get grid styles
    const getGridStyles = (count) => {
        let columns = '1fr';
        if (count === 2) columns = 'repeat(2, 1fr)';
        else if (count >= 3 && count <= 4) columns = 'repeat(2, 1fr)';
        else if (count >= 5) columns = 'repeat(auto-fit, minmax(350px, 1fr))';

        return {
            display: 'grid',
            gridTemplateColumns: columns,
            gridAutoRows: 'min-content',
            gap: '12px',
            padding: '12px',
            width: '100%',
            height: '100%',
            maxWidth: '1400px',
            margin: '0 auto',
            alignContent: 'center',
            justifyContent: 'center',
            overflowY: 'auto'
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

    // Create RTCPeerConnection
    const createPeerConnection = useCallback((remoteSocketId, remoteUser) => {
        if (!remoteSocketId || !localStreamRef.current) return null;

        // Close existing connection if any
        if (pcsRef.current[remoteSocketId]) {
            try {
                pcsRef.current[remoteSocketId].close();
            } catch (e) {
                console.warn("Error closing existing PC:", e);
            }
        }

        console.log(`[WebRTC] Creating PC for ${remoteSocketId} (${remoteUser?.name || 'Unknown'})`);

        const pc = new RTCPeerConnection(ICE_SERVERS);

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate && socket) {
                console.log(`[WebRTC] Sending ICE candidate to ${remoteSocketId}`);
                socket.emit('call:ice-candidate', {
                    to: remoteSocketId,
                    candidate: event.candidate,
                    from: {
                        socketId: socket.id,
                        userId: myId,
                        name: user ? `${user.firstName} ${user.lastName}` : 'Unknown'
                    }
                });
            }
        };

        // Handle negotiation needed
        pc.onnegotiationneeded = async () => {
            try {
                if (makingOffer.current[remoteSocketId]) {
                    console.log(`[WebRTC] Already making offer to ${remoteSocketId}, skipping`);
                    return;
                }

                makingOffer.current[remoteSocketId] = true;
                console.log(`[WebRTC] Negotiation needed for ${remoteSocketId}, creating offer`);

                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);

                socket.emit('call:offer', {
                    to: remoteSocketId,
                    offer: pc.localDescription,
                    from: {
                        socketId: socket.id,
                        userId: myId,
                        name: user ? `${user.firstName} ${user.lastName}` : 'Unknown'
                    }
                });
            } catch (err) {
                console.error(`[WebRTC] Negotiation error with ${remoteSocketId}:`, err);
            } finally {
                makingOffer.current[remoteSocketId] = false;
            }
        };

        // Handle incoming tracks
        pc.ontrack = (event) => {
            console.log(`[WebRTC] Received ${event.track.kind} track from ${remoteSocketId}`);

            setRemoteStreams(prev => {
                const existingStream = prev[remoteSocketId];
                if (existingStream) {
                    // Update existing stream
                    if (event.track.kind === 'video') {
                        const videoTrack = existingStream.getVideoTracks()[0];
                        if (videoTrack) existingStream.removeTrack(videoTrack);
                        existingStream.addTrack(event.track);
                    } else if (event.track.kind === 'audio') {
                        const audioTrack = existingStream.getAudioTracks()[0];
                        if (audioTrack) existingStream.removeTrack(audioTrack);
                        existingStream.addTrack(event.track);
                    }
                    return { ...prev, [remoteSocketId]: existingStream };
                } else {
                    // Create new stream
                    const stream = new MediaStream();
                    stream.addTrack(event.track);
                    return { ...prev, [remoteSocketId]: stream };
                }
            });

            setConnectionsEstablished(prev => ({ ...prev, [remoteSocketId]: true }));
        };

        // Handle connection state changes
        pc.onconnectionstatechange = () => {
            console.log(`[WebRTC] PC State with ${remoteSocketId}: ${pc.connectionState}`);

            if (pc.connectionState === 'connected') {
                console.log(`[WebRTC] Successfully connected to ${remoteSocketId}`);
                setConnectionsEstablished(prev => ({ ...prev, [remoteSocketId]: true }));
            }

            if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
                console.log(`[WebRTC] Connection ${pc.connectionState} with ${remoteSocketId}`);

                setRemoteStreams(prev => {
                    const next = { ...prev };
                    delete next[remoteSocketId];
                    return next;
                });

                setConnectionsEstablished(prev => {
                    const next = { ...prev };
                    delete next[remoteSocketId];
                    return next;
                });

                delete pcsRef.current[remoteSocketId];
                delete makingOffer.current[remoteSocketId];
            }
        };

        // Add local tracks
        const activeStream = isScreenSharing ? screenStreamRef.current : localStreamRef.current;
        if (activeStream) {
            console.log(`[WebRTC] Adding local tracks to PC for ${remoteSocketId}`);
            activeStream.getTracks().forEach(track => {
                pc.addTrack(track, activeStream);
                console.log(`[WebRTC] Added ${track.kind} track`);
            });
        }

        pcsRef.current[remoteSocketId] = pc;
        return pc;
    }, [socket, myId, user, isScreenSharing, localStreamRef.current]);

    // Initialize Local Media
    useEffect(() => {
        const getMedia = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });
                localStreamRef.current = stream;

                // Set initial mute states
                stream.getAudioTracks().forEach(track => track.enabled = !isMuted);
                stream.getVideoTracks().forEach(track => track.enabled = isVideoOn);

                if (myVideoRef.current) {
                    myVideoRef.current.srcObject = stream;
                }

                setIsStreamReady(true);
                console.log("[Media] Local stream ready");
            } catch (err) {
                console.warn("[Media] Camera failed, trying audio only:", err);
                try {
                    const audioStream = await navigator.mediaDevices.getUserMedia({
                        video: false,
                        audio: true
                    });
                    localStreamRef.current = audioStream;
                    setIsVideoOn(false);
                    setIsStreamReady(true);
                    console.log("[Media] Audio-only stream ready");
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
            Object.values(pcsRef.current).forEach(pc => {
                try {
                    pc.close();
                } catch (e) {
                    console.warn("Error closing PC:", e);
                }
            });
        };
    }, []);

    // Initialize connections when participants change
    useEffect(() => {
        if (!socket || !callState.roomId || callState.callStatus !== 'connected' || !isStreamReady) return;

        const participants = activeCallParticipants[callState.roomId] || [];
        console.log("[Participants] Current participants:", participants);

        // Create connections for all other participants
        participants.forEach(p => {
            if (p.socketId !== socket.id && !pcsRef.current[p.socketId]) {
                console.log(`[Init] Creating connection for participant: ${p.name} (${p.socketId})`);
                createPeerConnection(p.socketId, p);
            }
        });

        // Clean up connections for participants that left
        const currentSocketIds = participants.map(p => p.socketId);
        Object.keys(pcsRef.current).forEach(socketId => {
            if (socketId !== socket.id && !currentSocketIds.includes(socketId)) {
                console.log(`[Cleanup] Closing connection for ${socketId}`);
                try {
                    pcsRef.current[socketId].close();
                } catch (e) {
                    console.warn("Error closing PC:", e);
                }
                delete pcsRef.current[socketId];
                setRemoteStreams(prev => {
                    const next = { ...prev };
                    delete next[socketId];
                    return next;
                });
            }
        });
    }, [activeCallParticipants, callState.roomId, callState.callStatus, isStreamReady, createPeerConnection, socket]);

    // Signaling Handlers
    useEffect(() => {
        if (!socket || !callState.roomId || callState.callStatus !== 'connected') return;

        const handleOffer = async ({ offer, from }) => {
            console.log(`[Signaling] Offer received from ${from.socketId}`);

            let pc = pcsRef.current[from.socketId];

            // Create PC if it doesn't exist
            if (!pc) {
                console.log(`[Signaling] Creating new PC for offer from ${from.socketId}`);
                pc = createPeerConnection(from.socketId, from);
                if (!pc) return;
            }

            try {
                // Check if we need to handle glare
                const isPolite = socket.id > from.socketId;
                const offerCollision = pc.signalingState !== "stable";

                if (!isPolite && offerCollision) {
                    console.log(`[Signaling] Ignoring offer from ${from.socketId} (impolite glare)`);
                    return;
                }

                await pc.setRemoteDescription(new RTCSessionDescription(offer));
                console.log(`[Signaling] Set remote description for ${from.socketId}`);

                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                socket.emit('call:answer', {
                    to: from.socketId,
                    answer: pc.localDescription,
                    from: {
                        socketId: socket.id,
                        userId: myId,
                        name: user ? `${user.firstName} ${user.lastName}` : 'Unknown'
                    }
                });
                console.log(`[Signaling] Sent answer to ${from.socketId}`);
            } catch (err) {
                console.error(`[Signaling] Error handling offer from ${from.socketId}:`, err);
            }
        };

        const handleAnswer = async ({ answer, from }) => {
            console.log(`[Signaling] Answer received from ${from.socketId}`);
            const pc = pcsRef.current[from.socketId];

            if (pc && pc.signalingState !== 'closed') {
                try {
                    if (pc.signalingState === 'have-local-offer') {
                        await pc.setRemoteDescription(new RTCSessionDescription(answer));
                        console.log(`[Signaling] Set remote answer from ${from.socketId}`);
                    } else {
                        console.log(`[Signaling] Ignoring answer, current state: ${pc.signalingState}`);
                    }
                } catch (err) {
                    console.error(`[Signaling] Error setting remote answer from ${from.socketId}:`, err);
                }
            } else {
                console.log(`[Signaling] No PC found for ${from.socketId}`);
            }
        };

        const handleIceCandidate = async ({ candidate, from }) => {
            const pc = pcsRef.current[from.socketId];
            if (pc && pc.remoteDescription && pc.signalingState !== 'closed') {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                    console.log(`[Signaling] Added ICE candidate from ${from.socketId}`);
                } catch (err) {
                    console.error(`[Signaling] Error adding ICE candidate from ${from.socketId}:`, err);
                }
            }
        };

        const handleUserLeft = ({ socketId, userId }) => {
            console.log(`[Signaling] User left: ${socketId}`);
            if (pcsRef.current[socketId]) {
                try {
                    pcsRef.current[socketId].close();
                } catch (e) {
                    console.warn("Error closing PC:", e);
                }
                delete pcsRef.current[socketId];
                delete makingOffer.current[socketId];

                setRemoteStreams(prev => {
                    const next = { ...prev };
                    delete next[socketId];
                    return next;
                });
            }
        };

        socket.on('call:offer', handleOffer);
        socket.on('call:answer', handleAnswer);
        socket.on('call:ice-candidate', handleIceCandidate);
        socket.on('call:user-left', handleUserLeft);

        return () => {
            socket.off('call:offer', handleOffer);
            socket.off('call:answer', handleAnswer);
            socket.off('call:ice-candidate', handleIceCandidate);
            socket.off('call:user-left', handleUserLeft);
        };
    }, [socket, callState.roomId, callState.callStatus, createPeerConnection, myId, user]);

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

                // Update all peer connections
                Object.values(pcsRef.current).forEach(pc => {
                    const sender = pc.getSenders().find(s => s.track?.kind === 'audio');
                    if (sender && sender.track) {
                        sender.track.enabled = !newMuted;
                    }
                });

                socket.emit('call:media-toggle', {
                    roomId: callState.roomId,
                    userId: myId,
                    mediaType: 'mic',
                    enabled: !newMuted
                });
            }
        }
    };

    const toggleVideo = async () => {
        if (!localStreamRef.current) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                localStreamRef.current = stream;
                if (myVideoRef.current) myVideoRef.current.srcObject = stream;
            } catch (err) {
                console.error("[Media] Could not get camera:", err);
                return;
            }
        }

        let track = localStreamRef.current.getVideoTracks()[0];

        // If no video track but stream exists, add one
        if (!track && !isVideoOn) {
            try {
                const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
                const newTrack = tempStream.getVideoTracks()[0];
                localStreamRef.current.addTrack(newTrack);
                track = newTrack;
            } catch (err) {
                console.error("[Media] Could not add video track:", err);
                return;
            }
        }

        if (track) {
            track.enabled = !track.enabled;
            const newVideoOn = track.enabled;
            setIsVideoOn(newVideoOn);

            // Update all peer connections
            Object.values(pcsRef.current).forEach(async (pc) => {
                const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                if (sender) {
                    await sender.replaceTrack(track);
                } else if (newVideoOn) {
                    pc.addTrack(track, localStreamRef.current);

                    // Trigger renegotiation
                    try {
                        const offer = await pc.createOffer();
                        await pc.setLocalDescription(offer);
                        const remoteSocketId = Object.keys(pcsRef.current).find(key => pcsRef.current[key] === pc);
                        if (remoteSocketId) {
                            socket.emit('call:offer', {
                                to: remoteSocketId,
                                offer: pc.localDescription,
                                from: {
                                    socketId: socket.id,
                                    userId: myId,
                                    name: user ? `${user.firstName} ${user.lastName}` : 'Unknown'
                                }
                            });
                        }
                    } catch (e) {
                        console.warn("[WebRTC] Re-negotiation failed for video toggle:", e);
                    }
                }
            });

            socket.emit('call:media-toggle', {
                roomId: callState.roomId,
                userId: myId,
                mediaType: 'video',
                enabled: newVideoOn
            });
        }
    };

    const toggleScreenShare = async () => {
        if (!isScreenSharing) {
            try {
                console.log("[ScreenShare] Starting screen share...");
                const screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: { cursor: "always" },
                    audio: false
                });

                screenStreamRef.current = screenStream;
                const screenTrack = screenStream.getVideoTracks()[0];

                // Update all peer connections
                for (const [remoteSocketId, pc] of Object.entries(pcsRef.current)) {
                    const sender = pc.getSenders().find(s => s.track?.kind === 'video');

                    if (sender) {
                        console.log(`[ScreenShare] Replacing video track for ${remoteSocketId}`);
                        await sender.replaceTrack(screenTrack);
                    } else {
                        console.log(`[ScreenShare] Adding video track for ${remoteSocketId}`);
                        pc.addTrack(screenTrack, screenStream);

                        // Trigger renegotiation
                        const offer = await pc.createOffer();
                        await pc.setLocalDescription(offer);
                        socket.emit('call:offer', {
                            to: remoteSocketId,
                            offer: pc.localDescription,
                            from: {
                                socketId: socket.id,
                                userId: myId,
                                name: user ? `${user.firstName} ${user.lastName}` : 'Unknown'
                            }
                        });
                    }
                }

                // Update local preview
                if (myVideoRef.current) {
                    myVideoRef.current.srcObject = screenStream;
                }

                setIsScreenSharing(true);

                socket.emit('call:media-toggle', {
                    roomId: callState.roomId,
                    userId: myId,
                    mediaType: 'screen',
                    enabled: true
                });

                // Handle stop sharing from browser bar
                screenTrack.onended = () => {
                    stopScreenShare();
                };

            } catch (err) {
                console.error("[ScreenShare] Error starting screen share:", err);
            }
        } else {
            stopScreenShare();
        }
    };

    const stopScreenShare = async () => {
        console.log("[ScreenShare] Stopping screen share...");

        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(track => track.stop());
            screenStreamRef.current = null;
        }

        // Restore camera track
        const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
        if (cameraTrack) {
            for (const [remoteSocketId, pc] of Object.entries(pcsRef.current)) {
                const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                if (sender) {
                    await sender.replaceTrack(cameraTrack);

                    // Trigger renegotiation
                    try {
                        const offer = await pc.createOffer();
                        await pc.setLocalDescription(offer);
                        socket.emit('call:offer', {
                            to: remoteSocketId,
                            offer: pc.localDescription,
                            from: {
                                socketId: socket.id,
                                userId: myId,
                                name: user ? `${user.firstName} ${user.lastName}` : 'Unknown'
                            }
                        });
                    } catch (e) {
                        console.warn("[WebRTC] Renegotiation failed on stop sharing:", e);
                    }
                }
            }

            // Restore local preview
            if (myVideoRef.current) {
                myVideoRef.current.srcObject = localStreamRef.current;
            }
        }

        setIsScreenSharing(false);

        socket.emit('call:media-toggle', {
            roomId: callState.roomId,
            userId: myId,
            mediaType: 'screen',
            enabled: false
        });
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    const allParticipantsInRoom = activeCallParticipants[callState.roomId] || [];

    // --- RENDER LOGIC ---

    const presenter = allParticipantsInRoom.find(p => {
        const isMe = String(p.userId) === String(myId);
        return isMe ? isScreenSharing : p.mediaState?.screen === true;
    });

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
            {/* Main Area: Grid or Presentation */}
            <div style={{
                flex: 1,
                display: 'flex',
                background: '#0a0a0a',
                overflow: 'hidden',
                position: 'relative'
            }}>
                {presenter ? (
                    // Presentation Mode
                    <div style={{ flex: 1, display: 'flex', height: '100%' }}>
                        <div style={{ flex: 1, position: 'relative', background: '#000', padding: '20px' }}>
                            <div style={{
                                width: '100%', height: '100%',
                                background: '#111', borderRadius: '12px', overflow: 'hidden',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}>
                                {(() => {
                                    const isLocal = String(presenter.userId) === String(myId);
                                    const stream = isLocal ? screenStreamRef.current : remoteStreams[presenter.socketId];

                                    if (stream) {
                                        return (
                                            <div style={{ width: '100%', height: '100%' }}>
                                                <ParticipantVideo key={stream.id} stream={stream} isLocal={isLocal} isScreen={true} />
                                            </div>
                                        );
                                    }
                                    return (
                                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                                            Loading screen share...
                                        </div>
                                    );
                                })()}
                                <div style={{
                                    position: 'absolute', bottom: '20px', left: '20px',
                                    background: 'rgba(0,0,0,0.6)', padding: '8px 16px',
                                    borderRadius: '8px', fontSize: '14px', border: '1px solid rgba(255,255,255,0.1)'
                                }}>
                                    {presenter.name} is presenting
                                </div>
                            </div>
                        </div>

                        {/* Sidebar for other participants */}
                        <div style={{
                            width: '320px', background: '#0a0a0a',
                            padding: '20px', display: 'flex', flexDirection: 'column',
                            gap: '16px', borderLeft: '1px solid rgba(255,255,255,0.05)',
                            overflowY: 'auto'
                        }}>
                            {allParticipantsInRoom.filter(p => p.userId !== presenter.userId).map((p) => {
                                const isLocal = String(p.userId) === String(myId);
                                const stream = isLocal ? localStreamRef.current : remoteStreams[p.socketId];
                                const videoEnabled = isLocal ? isVideoOn : (p.mediaState?.video !== false);
                                const name = p.name || 'User';

                                return (
                                    <div key={p.socketId || p.userId} style={{
                                        width: '100%', aspectRatio: '16/9', background: '#202124',
                                        borderRadius: '8px', overflow: 'hidden', position: 'relative',
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    }}>
                                        {!isLocal && stream && <ParticipantAudio stream={stream} />}
                                        {stream && videoEnabled ? (
                                            <ParticipantVideo key={stream.id} stream={stream} isLocal={isLocal} />
                                        ) : (
                                            <div style={{
                                                height: '100%', display: 'flex', alignItems: 'center',
                                                justifyContent: 'center', background: '#3c4043'
                                            }}>
                                                <div style={{
                                                    width: '40px', height: '40px', borderRadius: '50%',
                                                    background: '#1a73e8', display: 'flex', alignItems: 'center',
                                                    justifyContent: 'center', fontSize: '18px', color: 'white'
                                                }}>
                                                    {p.avatar || p.name?.[0] || 'U'}
                                                </div>
                                            </div>
                                        )}
                                        <div style={{
                                            position: 'absolute', bottom: '4px', left: '4px',
                                            background: 'rgba(0,0,0,0.6)', padding: '2px 8px',
                                            borderRadius: '4px', fontSize: '10px', color: 'white',
                                            backdropFilter: 'blur(4px)', zIndex: 2
                                        }}>
                                            {isLocal ? 'You' : name}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    // Default Grid Mode
                    <div style={{
                        flex: 1,
                        ...getGridStyles(allParticipantsInRoom.length),
                        overflowY: 'auto',
                        maxHeight: '100%',
                        display: 'grid',
                        gridAutoRows: 'min-content'
                    }}>
                        {allParticipantsInRoom.map((p) => {
                            const isLocal = String(p.userId) === String(myId);
                            const stream = isLocal ? localStreamRef.current : remoteStreams[p.socketId];

                            const name = p.name || 'User';
                            const avatar = p.avatar || name[0] || 'U';

                            const videoEnabled = isLocal ? isVideoOn : (p.mediaState?.video !== false);
                            const micEnabled = isLocal ? !isMuted : (p.mediaState?.mic !== false);

                            return (
                                <div key={p.socketId || p.userId} style={{
                                    width: '100%',
                                    aspectRatio: '16/9',
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                    background: '#202124',
                                    position: 'relative',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                                    transition: 'all 0.3s ease',
                                    height: 'min-content',
                                    alignSelf: 'center'
                                }}>
                                    {!isLocal && stream && <ParticipantAudio stream={stream} />}
                                    {stream && videoEnabled ? (
                                        <ParticipantVideo key={stream.id} stream={stream} isLocal={isLocal} />
                                    ) : (
                                        <div style={{
                                            height: '100%', display: 'flex', alignItems: 'center',
                                            justifyContent: 'center', background: '#3c4043'
                                        }}>
                                            <div style={{
                                                width: '120px', height: '120px', borderRadius: '50%',
                                                background: '#1a73e8', display: 'flex', alignItems: 'center',
                                                justifyContent: 'center', fontSize: '48px', color: 'white',
                                                fontWeight: '500'
                                            }}>
                                                {avatar}
                                            </div>
                                        </div>
                                    )}

                                    {/* Name & Status Overlay */}
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '12px',
                                        left: '12px',
                                        padding: '4px 12px',
                                        background: 'rgba(0,0,0,0.6)',
                                        borderRadius: '4px',
                                        color: 'white',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        zIndex: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        backdropFilter: 'blur(4px)'
                                    }}>
                                        {!micEnabled && <MicOff size={16} color="#ea4335" />}
                                        {isLocal ? `${name} (You)` : name}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Controls Bar */}
            <div style={{
                height: '96px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 40px', background: 'rgba(23, 23, 23, 0.95)',
                backdropFilter: 'blur(10px)', borderTop: '1px solid rgba(255,255,255,0.05)'
            }}>
                <div style={{ width: '300px', fontSize: '14px', color: '#9ca3af', fontWeight: '600' }}>
                    {formatTime(callDuration)} | <span style={{ color: '#00FF9C' }}>CLUSTAURA HD</span>
                    {isScreenSharing && <span style={{ marginLeft: '12px', color: '#00FF9C' }}>(PRESENTING)</span>}
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
                        onClick={toggleScreenShare}
                        style={{
                            width: '52px', height: '52px', borderRadius: '50%',
                            background: isScreenSharing ? '#00FF9C' : 'rgba(255,255,255,0.1)',
                            border: 'none', color: isScreenSharing ? '#000' : 'white', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s'
                        }}
                        title={isScreenSharing ? "Stop Sharing" : "Share Screen"}
                    >
                        {isScreenSharing ? <X size={22} /> : <MonitorUp size={22} />}
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