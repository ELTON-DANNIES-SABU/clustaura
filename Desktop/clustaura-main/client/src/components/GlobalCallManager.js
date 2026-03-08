import React, { useEffect, useRef } from 'react';
import useCommunicationStore from '../store/communicationStore';
import { Phone, Video, X, Check } from 'lucide-react';
import CallOverlay from './CallOverlay';

const GlobalCallManager = () => {
    const { initSocket, callState, endCallGlobal, enterCall } = useCommunicationStore();
    const audioCtxRef = useRef(null);
    const ringIntervalRef = useRef(null);

    useEffect(() => {
        initSocket();
    }, []);

    // --- Ringing sound management ---
    useEffect(() => {
        if (callState.callStatus === 'incoming') {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            audioCtxRef.current = audioCtx;

            const playRing = () => {
                try {
                    const oscillator = audioCtx.createOscillator();
                    const gainNode = audioCtx.createGain();
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.5);
                    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1);
                    oscillator.connect(gainNode);
                    gainNode.connect(audioCtx.destination);
                    oscillator.start();
                    oscillator.stop(audioCtx.currentTime + 1);
                } catch (e) {
                    // AudioContext may be suspended until user gesture; ignore
                }
            };

            playRing();
            ringIntervalRef.current = setInterval(playRing, 2000);
        } else {
            stopRinging();
        }

        return () => stopRinging();
    }, [callState.callStatus]);

    const stopRinging = () => {
        if (ringIntervalRef.current) {
            clearInterval(ringIntervalRef.current);
            ringIntervalRef.current = null;
        }
        if (audioCtxRef.current) {
            audioCtxRef.current.close().catch(() => { });
            audioCtxRef.current = null;
        }
    };

    const handleAccept = () => {
        stopRinging();
        enterCall(); // Sets inCall:true and emits call:join
    };

    const handleDecline = () => {
        stopRinging();
        endCallGlobal();
    };

    // --- Render: Active call overlay ---
    if (callState.inCall && callState.callStatus !== 'incoming') {
        return <CallOverlay />;
    }

    // --- Render: Incoming call ringing screen ---
    if (callState.callStatus === 'incoming') {
        return (
            <div style={{
                position: 'fixed',
                top: '24px',
                right: '24px',
                zIndex: 99999,
                background: 'linear-gradient(135deg, #0f172a, #1e293b)',
                border: '1px solid #334155',
                borderRadius: '20px',
                padding: '28px 32px',
                minWidth: '320px',
                boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '20px',
                animation: 'callSlideIn 0.3s ease-out'
            }}>
                {/* Pulse ring animation */}
                <style>{`
                    @keyframes callSlideIn {
                        from { opacity: 0; transform: translateY(-20px) scale(0.95); }
                        to   { opacity: 1; transform: translateY(0)     scale(1); }
                    }
                    @keyframes pulse-ring {
                        0%   { transform: scale(1);    opacity: 0.8; }
                        100% { transform: scale(1.8);  opacity: 0; }
                    }
                    .call-avatar-pulse::before {
                        content: '';
                        position: absolute;
                        inset: 0;
                        border-radius: 50%;
                        border: 3px solid #00FF9C;
                        animation: pulse-ring 1.4s ease-out infinite;
                    }
                `}</style>

                {/* Call type badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#00FF9C', fontSize: '12px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase' }}>
                    {callState.callType === 'video' ? <Video size={14} /> : <Phone size={14} />}
                    Incoming {callState.callType === 'video' ? 'Video' : 'Audio'} Call
                </div>

                {/* Avatar */}
                <div style={{ position: 'relative' }} className="call-avatar-pulse">
                    <div style={{
                        width: '72px', height: '72px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #00FF9C, #059669)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '28px', fontWeight: 'bold', color: '#000',
                        position: 'relative', zIndex: 1
                    }}>
                        {(callState.initiator || 'U')[0].toUpperCase()}
                    </div>
                </div>

                {/* Caller name */}
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#f1f5f9' }}>
                        {callState.initiator || 'Unknown Caller'}
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                        is calling you...
                    </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '32px', marginTop: '8px' }}>
                    {/* Decline */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <button
                            onClick={handleDecline}
                            style={{
                                width: '60px', height: '60px', borderRadius: '50%',
                                background: '#ef4444', border: 'none', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'transform 0.15s, background 0.2s',
                                boxShadow: '0 4px 15px rgba(239,68,68,0.4)'
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <X size={24} color="white" />
                        </button>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>Decline</span>
                    </div>

                    {/* Accept */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <button
                            onClick={handleAccept}
                            style={{
                                width: '60px', height: '60px', borderRadius: '50%',
                                background: '#00FF9C', border: 'none', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'transform 0.15s, background 0.2s',
                                boxShadow: '0 4px 15px rgba(0,255,156,0.4)'
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <Check size={24} color="black" />
                        </button>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>Accept</span>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default GlobalCallManager;
