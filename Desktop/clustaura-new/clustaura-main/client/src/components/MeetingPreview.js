import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Video, VideoOff, Settings, ShieldCheck } from 'lucide-react';

const MeetingPreview = ({ onJoin, callType, userDetails, stream }) => {
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(callType === 'audio');
    const [isHardwareMissing, setIsHardwareMissing] = useState(false);
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;

            // Sync initial UI state with stream tracks
            stream.getAudioTracks().forEach(t => t.enabled = !isMuted);
            stream.getVideoTracks().forEach(t => t.enabled = !isVideoOff);

            if (callType === 'video' && stream.getVideoTracks().length === 0) {
                setIsHardwareMissing(true);
                setIsVideoOff(true);
            }
        } else if (!stream && callType === 'video') {
            setIsHardwareMissing(true);
            setIsVideoOff(true);
        }
    }, [stream, isVideoOff, isMuted, callType]);

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
            position: 'fixed', inset: 0, background: '#111111', zIndex: 10001,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontFamily: 'Inter, system-ui, sans-serif',
            background: 'radial-gradient(circle at center, #1a1a1a 0%, #0a0a0a 100%)'
        }}>
            <div style={{
                display: 'flex', gap: '64px', alignItems: 'center', maxWidth: '1100px', width: '90%',
                animation: 'scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
                {/* Video Preview Column */}
                <div style={{ flex: 1.5, position: 'relative' }}>
                    <div style={{
                        aspectRatio: '16/9', background: '#202124', borderRadius: '24px',
                        overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', position: 'relative',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
                    }}>
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            zIndex: !isVideoOff ? 1 : -1,
                            visibility: !isVideoOff ? 'visible' : 'hidden'
                        }}>
                            <video
                                ref={videoRef}
                                autoPlay
                                muted
                                playsInline
                                style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                            />
                        </div>

                        {isVideoOff && (
                            <div style={{ textAlign: 'center', zIndex: 0 }}>
                                <div style={{
                                    width: '140px', height: '140px', borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '56px', fontWeight: '600', color: '#00FF9C', margin: '0 auto 24px',
                                    border: '4px solid rgba(0, 255, 156, 0.1)',
                                    boxShadow: '0 0 40px rgba(0, 255, 156, 0.05)'
                                }}>
                                    {userDetails.avatar}
                                </div>
                                <div style={{ fontSize: '20px', color: '#9CA3AF', fontWeight: '500' }}>
                                    {isHardwareMissing ? 'Camera not found or access denied' : 'Camera is off'}
                                </div>
                                {isHardwareMissing && (
                                    <div style={{ marginTop: '12px', color: '#ea4335', fontSize: '14px', fontWeight: '600' }}>
                                        Join with audio only
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Control Buttons Overlay */}
                        <div style={{
                            position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
                            display: 'flex', gap: '16px', zIndex: 10
                        }}>
                            <button
                                onClick={toggleMute}
                                title={isMuted ? "Unmute" : "Mute"}
                                style={{
                                    width: '52px', height: '52px', borderRadius: '50%', border: 'none',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                    background: isMuted ? '#ea4335' : 'rgba(0,0,0,0.5)',
                                    backdropFilter: 'blur(10px)',
                                    color: 'white', transition: 'all 0.2s',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}>
                                {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
                            </button>
                            <button
                                onClick={toggleVideo}
                                title={isVideoOff ? "Turn video on" : "Turn video off"}
                                style={{
                                    width: '52px', height: '52px', borderRadius: '50%', border: 'none',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                    background: isVideoOff ? '#ea4335' : 'rgba(0,0,0,0.5)',
                                    backdropFilter: 'blur(10px)',
                                    color: 'white', transition: 'all 0.2s',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}>
                                {isVideoOff ? <VideoOff size={22} /> : <Video size={22} />}
                            </button>
                        </div>
                    </div>
                    <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#9ca3af', fontSize: '15px' }}>
                        <ShieldCheck size={18} color="#00FF9C" />
                        <span>Ready to join? We've secured your connection.</span>
                    </div>
                </div>

                {/* Info & Join Column */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    <div style={{ textAlign: 'left' }}>
                        <h1 style={{ fontSize: '40px', margin: '0 0 16px', fontWeight: '600', letterSpacing: '-0.02em' }}>ClustAura HD</h1>
                        <p style={{ color: '#9ca3af', margin: 0, fontSize: '18px', lineHeight: '1.5' }}>
                            Join the secure video session with your team in high definition.
                        </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'flex-start' }}>
                        <button
                            onClick={handleJoin}
                            style={{
                                padding: '16px 64px', borderRadius: '32px', background: '#00FF9C',
                                color: 'black', border: 'none', fontWeight: 'bold', fontSize: '18px',
                                cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,255,156,0.3)',
                                transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1) translateY(0)'}
                        >
                            Join now
                        </button>

                        <button style={{
                            background: 'transparent', border: 'none', color: '#8ab4f8',
                            cursor: 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '8px 0', fontWeight: '500'
                        }}>
                            <Settings size={20} /> Audio & Video Settings
                        </button>
                    </div>

                    <div style={{
                        marginTop: '24px', padding: '24px', background: 'rgba(255,255,255,0.03)',
                        borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'left'
                    }}>
                        <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Call</div>
                        <div style={{ color: 'white', fontSize: '16px', fontWeight: '500' }}>
                            Participants are already active in this room.
                        </div>
                    </div>
                </div>
            </div>

            {/* Branding Footer */}
            <div style={{ position: 'absolute', bottom: '32px', right: '40px', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontWeight: '800', fontSize: '20px', color: '#00FF9C', letterSpacing: '0.05em' }}>CLUSTAURA</span>
                <span style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.2)' }}></span>
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#9ca3af' }}>SECURE PREVIEW</span>
            </div>

            <style>{`
                @keyframes scaleIn { 
                    from { opacity: 0; transform: scale(0.98) translateY(10px); } 
                    to { opacity: 1; transform: scale(1) translateY(0); } 
                }
            `}</style>
        </div>
    );
};

export default MeetingPreview;
