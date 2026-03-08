import React, { useEffect, useState } from 'react';
import useCommunicationStore from '../store/communicationStore';
import { Phone, Video, X, Check } from 'lucide-react';
import CallOverlay from './CallOverlay';
import { useNavigate } from 'react-router-dom';

const GlobalCallManager = () => {
    const { initSocket, callState, setCallState, endCallGlobal, socket, enterCall } = useCommunicationStore();
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
        enterCall(); // Join directly
    };

    const handleDecline = () => {
        if (ringInterval) clearInterval(ringInterval);
        endCallGlobal();
    };

    if (callState.inCall) {
        return <CallOverlay />;
    }

    return null;
};

export default GlobalCallManager;
