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
const ParticipantVideo = ({ stream, isLocal, isScreen }) => {
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            console.log(`[Video] Attaching stream (isScreen: ${isScreen}, id: ${stream.id})`);
            const video = videoRef.current;
            video.srcObject = stream;

            // Explicitly play to handle browser autoplay policies and reassignment issues
            video.play().catch(e => {
                console.warn("[Video] Playback failed/prevented:", e);
            });
        }
    }, [stream, isScreen, stream?.getVideoTracks().length]); // Added tracker for track list changes

    return (
        <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={true}
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
    const screenStreamRef = useRef(null);
    const pcsRef = useRef({}); // { socketId: RTCPeerConnection }

    // Google Meet Style Grid - Refined for stability
    const getGridStyles = (count) => {
        let columns = '1fr';
        if (count === 2) columns = 'repeat(2, 1fr)';
        else if (count >= 3 && count <= 4) columns = 'repeat(2, 1fr)';
        else if (count >= 5) columns = 'repeat(auto-fit, minmax(350px, 1fr))';

        return {
            display: 'grid',
            gridTemplateColumns: columns,
            gridAutoRows: 'min-content', // Prevent rows from stretching and overlapping
            gap: '12px',
            padding: '12px',
            width: '100%',
            height: '100%',
            maxWidth: '1400px',
            margin: '0 auto',
            alignContent: 'center', // Center rows vertically
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

    const pcStates = useRef({}); // { socketId: { makingOffer: bool, ignoreOffer: bool } }

    const createPeerConnection = useCallback((remoteSocketId, remoteUser) => {
        // Reuse existing PC if it's healthy
        const existingPc = pcsRef.current[remoteSocketId];
        if (existingPc && existingPc.signalingState !== 'closed') {
            console.log(`[WebRTC] Reusing existing PC for ${remoteSocketId}`);
            return existingPc;
        }

        console.log(`[WebRTC] Creating PC for ${remoteSocketId} (${remoteUser.name})`);
        const pc = new RTCPeerConnection(ICE_SERVERS);

        // Initialize state for Perfect Negotiation
        pcStates.current[remoteSocketId] = { makingOffer: false, ignoreOffer: false };

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('call:ice-candidate', {
                    to: remoteSocketId,
                    candidate: event.candidate,
                    from: { socketId: socket.id, userId: myId, name: `${user.firstName} ${user.lastName}` }
                });
            }
        };

        pc.onnegotiationneeded = async () => {
            try {
                pcStates.current[remoteSocketId].makingOffer = true;
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                console.log(`[Signaling] Sending offer to ${remoteSocketId}`);
                socket.emit('call:offer', {
                    to: remoteSocketId,
                    offer: pc.localDescription,
                    from: { socketId: socket.id, userId: myId, name: `${user.firstName} ${user.lastName}` }
                });
            } catch (err) {
                console.error(`[Signaling] NegotiationNeeded error with ${remoteSocketId}:`, err);
            } finally {
                pcStates.current[remoteSocketId].makingOffer = false;
            }
        };

        pc.ontrack = (event) => {
            console.log(`[WebRTC] Received ${event.track.kind} track from ${remoteSocketId}. Streams attached: ${event.streams.length}`);
            setRemoteStreams(prev => {
                const existingStream = prev[remoteSocketId];
                if (existingStream) {
                    // Update existing stream with new track
                    const stream = new MediaStream(existingStream.getTracks());
                    // Remove old tracks of same kind if exists
                    stream.getTracks().forEach(t => {
                        if (t.kind === event.track.kind) stream.removeTrack(t);
                    });
                    stream.addTrack(event.track);
                    return { ...prev, [remoteSocketId]: stream };
                } else {
                    // Start new stream with this track
                    const stream = event.streams[0] || new MediaStream([event.track]);
                    return { ...prev, [remoteSocketId]: stream };
                }
            });
        };

        pc.onconnectionstatechange = () => {
            console.log(`[WebRTC] PC State with ${remoteSocketId}: ${pc.connectionState}`);
            if (pc.connectionState === 'failed') {
                console.log(`[WebRTC] Connection failed with ${remoteSocketId}, attempting ICE restart`);
                pc.restartIce();
            }
            if (pc.connectionState === 'closed') {
                setRemoteStreams(prev => {
                    const next = { ...prev };
                    delete next[remoteSocketId];
                    return next;
                });
                delete pcsRef.current[remoteSocketId];
                delete pcStates.current[remoteSocketId];
            }
        };

        // Add local tracks - This will trigger onnegotiationneeded
        const activeStream = isScreenSharing ? screenStreamRef.current : localStreamRef.current;
        if (activeStream) {
            console.log(`[WebRTC] Initializing tracks for ${remoteSocketId}`);
            activeStream.getTracks().forEach(track => pc.addTrack(track, activeStream));
        }

        pcsRef.current[remoteSocketId] = pc;
        return pc;
    }, [socket, myId, user, isScreenSharing]);

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
    // Signaling Handlers - Resilient and Reactive
    useEffect(() => {
        if (!socket || !callState.roomId || callState.callStatus !== 'connected') return;

        const handleOffer = async ({ offer, from }) => {
            console.log(`[Signaling] Offer received from ${from.socketId}`);
            const pc = createPeerConnection(from.socketId, from);
            const state = pcStates.current[from.socketId];

            // Perfect Negotiation: Handle glare
            const isPolite = socket.id > from.socketId;
            const offerCollision = state.makingOffer || pc.signalingState !== "stable";
            state.ignoreOffer = !isPolite && offerCollision;

            if (state.ignoreOffer) {
                console.log(`[Signaling] Ignoring offer from ${from.socketId} (Impolite glare)`);
                return;
            }

            try {
                await pc.setRemoteDescription(new RTCSessionDescription(offer));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit('call:answer', {
                    to: from.socketId,
                    answer: pc.localDescription,
                    from: { socketId: socket.id, userId: myId, name: `${user.firstName} ${user.lastName}` }
                });
            } catch (err) {
                console.error(`[Signaling] Error handling offer from ${from.socketId}:`, err);
            }
        };

        const handleAnswer = async ({ answer, from }) => {
            console.log(`[Signaling] Answer received from ${from.socketId}`);
            const pc = pcsRef.current[from.socketId];
            if (pc) {
                try {
                    await pc.setRemoteDescription(new RTCSessionDescription(answer));
                } catch (err) {
                    console.error(`[Signaling] Error setting remote answer from ${from.socketId}:`, err);
                }
            }
        };

        const handleIceCandidate = async ({ candidate, from }) => {
            const pc = pcsRef.current[from.socketId];
            if (pc && pc.remoteDescription) {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }
        };

        const handleUserLeft = ({ socketId, userId }) => {
            console.log(`[Signaling] User left: ${socketId}`);
            if (pcsRef.current[socketId]) {
                pcsRef.current[socketId].close();
                delete pcsRef.current[socketId];
                delete pcStates.current[socketId];
                setRemoteStreams(prev => {
                    const next = { ...prev };
                    delete next[socketId];
                    return next;
                });
            }
        };

        // This ensures we always have PCs for everyone in the room list
        const syncParticipants = () => {
            const participants = activeCallParticipants[callState.roomId] || [];
            participants.forEach(p => {
                if (p.socketId !== socket.id && !pcsRef.current[p.socketId]) {
                    console.log(`[Signaling] New participant in list: ${p.name}, creating PC`);
                    createPeerConnection(p.socketId, p);
                }
            });
        };

        syncParticipants();

        socket.on('call:offer', handleOffer);
        socket.on('call:answer', handleAnswer);
        socket.on('call:ice-candidate', handleIceCandidate);
        socket.on('call:user-left', handleUserLeft);
        socket.on('call:participants', (list) => {
            // Legacy support if needed, though store usually handles this
            list.forEach(p => {
                if (p.socketId !== socket.id && !pcsRef.current[p.socketId]) {
                    createPeerConnection(p.socketId, p);
                }
            });
        });

        return () => {
            socket.off('call:offer', handleOffer);
            socket.off('call:answer', handleAnswer);
            socket.off('call:ice-candidate', handleIceCandidate);
            socket.off('call:user-left', handleUserLeft);
            socket.off('call:participants');
        };
    }, [socket, callState.roomId, callState.callStatus, createPeerConnection, activeCallParticipants, myId, user]);

    // Reactive Track Sync: Ensures tracks are added/replaced when stream or participants change
    useEffect(() => {
        if (!isStreamReady || !localStreamRef.current) return;

        const activeStream = isScreenSharing ? screenStreamRef.current : localStreamRef.current;
        if (!activeStream) return;

        const tracks = activeStream.getTracks();
        Object.keys(pcsRef.current).forEach(socketId => {
            const pc = pcsRef.current[socketId];
            if (pc.signalingState === 'closed') return;

            const senders = pc.getSenders();
            tracks.forEach(track => {
                const existingSender = senders.find(s => s.track?.kind === track.kind);
                if (!existingSender) {
                    console.log(`[ReactiveSync] Adding missing ${track.kind} track for ${socketId}`);
                    pc.addTrack(track, activeStream);
                } else if (existingSender.track?.id !== track.id) {
                    console.log(`[ReactiveSync] Replacing ${track.kind} track for ${socketId}`);
                    existingSender.replaceTrack(track);
                }
                // If it's the same track, we just ensure it's enabled (handled by toggle logic, but safe here)
            });
        });
    }, [isStreamReady, isScreenSharing, activeCallParticipants, callState.roomId]);

    // Timer
    useEffect(() => {
        const timer = setInterval(() => setCallDuration(p => p + 1), 1000);
        return () => clearInterval(timer);
    }, []);

    // Log participant state for debugging sync issues
    useEffect(() => {
        console.log("[UI] Context Participants:", activeCallParticipants[callState.roomId]?.map(p => ({
            name: p.name,
            socketId: p.socketId,
            media: p.mediaState
        })));
    }, [activeCallParticipants, callState.roomId]);

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

        // If no video track but stream exists, we might need to add one
        if (!track) {
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

            // Force a stream refresh to trigger UI updates if we added a new track earlier
            localStreamRef.current = new MediaStream(localStreamRef.current.getTracks());
            if (myVideoRef.current) myVideoRef.current.srcObject = localStreamRef.current;

            // If screen sharing is NOT active, update peers
            if (!isScreenSharing) {
                for (const pcKey of Object.keys(pcsRef.current)) {
                    const pc = pcsRef.current[pcKey];
                    const senders = pc.getSenders();
                    const videoSender = senders.find(s => s.track && s.track.kind === 'video');

                    if (videoSender) {
                        await videoSender.replaceTrack(track);
                    } else if (newVideoOn) {
                        pc.addTrack(track, localStreamRef.current);
                        // Trigger re-negotiation when adding a new track
                        try {
                            const offer = await pc.createOffer();
                            await pc.setLocalDescription(offer);
                            socket.emit('call:offer', {
                                to: pcKey,
                                offer: offer,
                                from: { socketId: socket.id, userId: myId, name: `${user.firstName} ${user.lastName}` }
                            });
                        } catch (e) {
                            console.warn("[WebRTC] Re-negotiation failed for video toggle:", e);
                        }
                    }
                }
            }

            socket.emit('call:media-toggle', { roomId: callState.roomId, userId: myId, mediaType: 'video', enabled: newVideoOn });
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

                // Replace track and TRIGGER RE-NEGOTIATION for maximum reliability
                for (const pc of Object.values(pcsRef.current)) {
                    const senders = pc.getSenders();
                    const videoSender = senders.find(s => s.track && s.track.kind === 'video');

                    if (videoSender) {
                        console.log("[ScreenShare] Replacing video track for peer");
                        await videoSender.replaceTrack(screenTrack);
                    } else {
                        console.log("[ScreenShare] Adding new video track for peer");
                        pc.addTrack(screenTrack, screenStream);
                    }

                    // Force re-negotiation to ensure the remote side sees the new track parameters
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    socket.emit('call:offer', {
                        to: Object.keys(pcsRef.current).find(key => pcsRef.current[key] === pc),
                        offer: offer,
                        from: { socketId: socket.id, userId: myId, name: `${user.firstName} ${user.lastName}` }
                    });
                }

                // Update local preview
                if (myVideoRef.current) {
                    myVideoRef.current.srcObject = screenStream;
                }

                setIsScreenSharing(true);
                setIsVideoOn(true); // Force video state to true for UI sync

                // Notify others that screen sharing is starting (and ensure video state shows active)
                socket.emit('call:media-toggle', { roomId: callState.roomId, userId: myId, mediaType: 'video', enabled: true });
                socket.emit('call:media-toggle', { roomId: callState.roomId, userId: myId, mediaType: 'screen', enabled: true });

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

        // Restore camera track for all peers and RE-NEGOTIATE
        const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
        if (cameraTrack) {
            for (const pc of Object.values(pcsRef.current)) {
                const senders = pc.getSenders();
                const videoSender = senders.find(s => s.track && s.track.kind === 'video');
                if (videoSender) {
                    await videoSender.replaceTrack(cameraTrack);
                }

                // Force re-negotiation
                try {
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    const pcKey = Object.keys(pcsRef.current).find(key => pcsRef.current[key] === pc);
                    socket.emit('call:offer', {
                        to: pcKey,
                        offer: offer,
                        from: { socketId: socket.id, userId: myId, name: `${user.firstName} ${user.lastName}` }
                    });
                } catch (e) {
                    console.warn("[WebRTC] Renegotiation rejected on stop sharing:", e);
                }
            }

            // Restore local preview
            if (myVideoRef.current) {
                myVideoRef.current.srcObject = localStreamRef.current;
            }
        }

        setIsScreenSharing(false);

        // Restore media state for others
        socket.emit('call:media-toggle', { roomId: callState.roomId, userId: myId, mediaType: 'screen', enabled: false });
        socket.emit('call:media-toggle', { roomId: callState.roomId, userId: myId, mediaType: 'video', enabled: isVideoOn });
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
                                            <ParticipantVideo key={stream.id || 'local'} stream={stream} isLocal={isLocal} />
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
                        display: 'grid', // Ensure the wrapper is a grid items container
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
                                    // Ensure the tile fits within its grid cell without overlapping others
                                    height: 'min-content',
                                    alignSelf: 'center'
                                }}>
                                    {!isLocal && stream && <ParticipantAudio stream={stream} />}
                                    {stream && videoEnabled ? (
                                        <ParticipantVideo key={stream.id || 'local'} stream={stream} isLocal={isLocal} />
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
