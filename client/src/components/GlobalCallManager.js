import React, { useEffect, useState } from 'react';
import useCommunicationStore from '../store/communicationStore';
import { Phone, Video, X, Check } from 'lucide-react';
import CallOverlay from './CallOverlay';
import { useNavigate } from 'react-router-dom';

const GlobalCallManager = () => {
    const { initSocket, callState, setCallState, endCallGlobal, socket } = useCommunicationStore();
    const navigate = useNavigate();

    useEffect(() => {
        initSocket();
    }, []);

    const [ringInterval, setRingInterval] = useState(null);

    useEffect(() => {
        if (callState.callStatus === 'incoming') {
            // Play a synthetic ringtone using Web Audio API
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const playRing = () => {
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
            };

            playRing();
            const interval = setInterval(playRing, 2000);
            setRingInterval(interval);
        } else {
            if (ringInterval) {
                clearInterval(ringInterval);
                setRingInterval(null);
            }
        }

        return () => {
            if (ringInterval) clearInterval(ringInterval);
        };
    }, [callState.callStatus]);

    const handleAccept = () => {
        if (ringInterval) clearInterval(ringInterval);
        setCallState({ callStatus: 'preview' }); // Transition to preview first
    };

    const handleDecline = () => {
        if (ringInterval) clearInterval(ringInterval);
        endCallGlobal();
    };

    if (callState.callStatus === 'incoming') {
        const initiatorInitial = callState.initiator ? callState.initiator[0]?.toUpperCase() : 'C';

        return (
            <div style={{
                position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
                animation: 'slideInRight 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}>
                <style>{`
                    @keyframes slideInRight {
                        from { transform: translateX(100%); opacity: 0; }
                        to { transform: translateX(0); opacity: 1; }
                    }
                    @keyframes pulseRing {
                        0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 255, 156, 0.7); }
                        70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(0, 255, 156, 0); }
                        100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 255, 156, 0); }
                    }
                `}</style>
                <div style={{
                    background: '#1F1F1F', border: '1px solid #333', borderRadius: '16px',
                    padding: '20px', boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
                    display: 'flex', alignItems: 'center', gap: '20px', minWidth: '380px',
                    borderLeft: '4px solid #00FF9C'
                }}>
                    <div style={{
                        width: '60px', height: '60px', borderRadius: '50%', background: '#374151',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '24px', fontWeight: 'bold', color: '#00FF9C',
                        animation: 'pulseRing 2s infinite'
                    }}>
                        {initiatorInitial}
                    </div>

                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'white' }}>
                            Incoming {callState.callType} call
                        </div>
                        <div style={{ fontSize: '14px', color: '#9CA3AF', marginTop: '4px' }}>
                            Group meeting is starting...
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={handleDecline}
                            style={{
                                width: '44px', height: '44px', borderRadius: '50%',
                                background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #EF4444',
                                color: '#EF4444', cursor: 'pointer', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
                            }}
                            title="Decline"
                        >
                            <X size={20} />
                        </button>
                        <button
                            onClick={handleAccept}
                            style={{
                                width: '44px', height: '44px', borderRadius: '50%',
                                background: '#00FF9C', border: 'none',
                                color: 'black', cursor: 'pointer', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 4px 12px rgba(0, 255, 156, 0.3)', transition: 'all 0.2s'
                            }}
                            title="Accept"
                        >
                            <Check size={20} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (callState.inCall && (callState.callStatus === 'connected' || callState.callStatus === 'calling')) {
        return <CallOverlay />;
    }

    return null;
};

export default GlobalCallManager;
