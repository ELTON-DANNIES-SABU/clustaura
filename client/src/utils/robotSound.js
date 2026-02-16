// utils/robotSounds.js
export const playRobotSound = (type) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    switch (type) {
        case 'activate':
            // Create beep sound
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
            break;

        case 'speak':
            // More complex speech-like sound
            const osc1 = audioContext.createOscillator();
            const osc2 = audioContext.createOscillator();
            const gain = audioContext.createGain();

            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(audioContext.destination);

            osc1.frequency.value = 400;
            osc2.frequency.value = 800;
            osc1.type = 'triangle';
            osc2.type = 'sine';

            gain.gain.setValueAtTime(0.2, audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);

            osc1.start(audioContext.currentTime);
            osc2.start(audioContext.currentTime);
            osc1.stop(audioContext.currentTime + 0.8);
            osc2.stop(audioContext.currentTime + 0.8);
            break;
    }
};