import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Video, VideoOff, Settings, ShieldCheck } from 'lucide-react';

const MeetingPreview = ({ onJoin, callType, userDetails }) => {
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(callType === 'audio');
    const videoRef = useRef(null);
    const [stream, setStream] = useState(null);

    useEffect(() => {
        const startPreview = async () => {
            try {
                const s = await navigator.mediaDevices.getUserMedia({
                    video: !isVideoOff,
                    audio: true
                });
                setStream(s);
                if (videoRef.current) videoRef.current.srcObject = s;

                // Mute tracks if needed initially
                s.getAudioTracks().forEach(t => t.enabled = !isMuted);
            } catch (err) {
                console.error("Error starting preview:", err);
            }
        };

        startPreview();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [isVideoOff]);

    const toggleMute = () => {
        setIsMuted(!isMuted);
        if (stream) {
            stream.getAudioTracks().forEach(t => t.enabled = isMuted);
        }
    };

    const toggleVideo = () => {
        setIsVideoOff(!isVideoOff);
    };

    const handleJoin = () => {
        // Pass the settings to the parent
        onJoin({ isMuted, isVideoOff });
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, background: '#111', zIndex: 10001,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontFamily: 'Inter, system-ui, sans-serif'
        }}>
            <div style={{ display: 'flex', gap: '48px', alignItems: 'center', maxWidth: '1000px', width: '90%' }}>
                {/* Video Preview Column */}
                <div style={{ flex: 1.5, position: 'relative' }}>
                    <div style={{
                        aspectRatio: '16/9', background: '#202124', borderRadius: '12px',
                        overflow: 'hidden', border: '1px solid #3c4043', position: 'relative',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
                    }}>
                        {!isVideoOff ? (
                            <video
                                ref={videoRef}
                                autoPlay
                                muted
                                style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                            />
                        ) : (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{
                                    width: '100px', height: '100px', borderRadius: '50%', background: '#374151',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '40px', fontWeight: 'bold', color: '#00FF9C', margin: '0 auto 16px'
                                }}>
                                    {userDetails.avatar}
                                </div>
                                <div style={{ fontSize: '18px', color: '#9CA3AF' }}>Camera is off</div>
                            </div>
                        )}

                        {/* Control Buttons Overlay */}
                        <div style={{
                            position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
                            display: 'flex', gap: '16px'
                        }}>
                            <button
                                onClick={toggleMute}
                                style={{
                                    width: '48px', height: '48px', borderRadius: '50%', border: '1px solid #5f6368',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                    background: isMuted ? '#ea4335' : 'transparent', color: 'white', transition: 'all 0.2s'
                                }}>
                                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                            </button>
                            <button
                                onClick={toggleVideo}
                                style={{
                                    width: '48px', height: '48px', borderRadius: '50%', border: '1px solid #5f6368',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                    background: isVideoOff ? '#ea4335' : 'transparent', color: 'white', transition: 'all 0.2s'
                                }}>
                                {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
                            </button>
                        </div>
                    </div>
                    <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#9ca3af', fontSize: '14px' }}>
                        <ShieldCheck size={16} color="#00FF9C" />
                        No one else is in this preview. Your privacy is protected.
                    </div>
                </div>

                {/* Info & Join Column */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <h1 style={{ fontSize: '32px', margin: '0 0 12px', fontWeight: '500' }}>Ready to join?</h1>
                        <p style={{ color: '#9ca3af', margin: 0, fontSize: '16px' }}>
                            You're joining a ClustAura group call
                        </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
                        <button
                            onClick={handleJoin}
                            style={{
                                padding: '12px 48px', borderRadius: '24px', background: '#00FF9C',
                                color: 'black', border: 'none', fontWeight: '600', fontSize: '16px',
                                cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,255,156,0.3)',
                                transition: 'transform 0.1s'
                            }}
                            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            Join now
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                            <button style={{
                                background: 'transparent', border: 'none', color: '#8ab4f8',
                                cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px'
                            }}>
                                <Settings size={18} /> Audio & Video Settings
                            </button>
                        </div>
                    </div>

                    <div style={{
                        marginTop: '40px', padding: '20px', background: '#202124',
                        borderRadius: '8px', border: '1px solid #3c4043', textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '14px', color: '#9ca3af' }}>Other participants</div>
                        <div style={{ marginTop: '12px', color: 'white', fontSize: '14px' }}>
                            Several people are already in this call
                        </div>
                    </div>
                </div>
            </div>

            {/* Branding Footer */}
            <div style={{ position: 'absolute', bottom: '24px', left: '24px', opacity: 0.6, display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '18px', color: '#00FF9C' }}>ClustAura</span>
                <span style={{ width: '1px', height: '16px', background: '#5f6368' }}></span>
                <span style={{ fontSize: '14px' }}>Meeting Preview</span>
            </div>
        </div>
    );
};

export default MeetingPreview;
