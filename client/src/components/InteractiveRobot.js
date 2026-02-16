// InteractiveRobot.js - Cyberpunk Edition
import React, { useState, useEffect, useRef } from 'react';
import './InteractiveRobot.css';

const InteractiveRobot = ({ onActivate }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [eyeGlow, setEyeGlow] = useState(0);
    const canvasRef = useRef(null);
    const animationFrameRef = useRef(null);

    // Particle system for hologram effect
    useEffect(() => {
        if (!canvasRef.current || !isHovered) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const particles = [];
        const particleCount = 30;

        // Initialize particles
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 2 + 1,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5,
                color: `rgba(0, 255, 163, ${Math.random() * 0.5 + 0.3})`
            });
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw particles
            particles.forEach(particle => {
                particle.x += particle.speedX;
                particle.y += particle.speedY;

                // Boundary check
                if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
                if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;

                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fillStyle = particle.color;
                ctx.fill();
            });

            // Draw connecting lines
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 50) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(0, 255, 163, ${0.2 * (1 - distance / 50)})`;
                        ctx.lineWidth = 0.5;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }

            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isHovered]);

    // Eye glow animation
    useEffect(() => {
        const interval = setInterval(() => {
            setEyeGlow(prev => (prev >= 1 ? 0 : prev + 0.1));
        }, 100);
        return () => clearInterval(interval);
    }, []);

    const handleMouseEnter = () => {
        setIsHovered(true);
        setIsScanning(true);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        setIsScanning(false);
    };

    const handleClick = () => {
        setIsActive(true);
        onActivate();

        // Reset after activation
        setTimeout(() => setIsActive(false), 1000);
    };

    return (
        <div
            className={`cyber-robot-container ${isHovered ? 'hovered' : ''} ${isActive ? 'active' : ''}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
            title="AI Assistant - Ready to Serve"
        >
            {/* Hologram Effect Overlay */}
            <canvas
                ref={canvasRef}
                className="hologram-canvas"
                width="80"
                height="80"
            />

            {/* Robot Core */}
            <div className="cyber-robot-core">

                {/* Main Body - Metallic Hexagonal Design */}
                <div className="cyber-body">
                    <div className="body-hexagon">
                        <div className="hexagon-face front"></div>
                        <div className="hexagon-face top"></div>
                        <div className="hexagon-face bottom"></div>
                        <div className="hexagon-face left"></div>
                        <div className="hexagon-face right"></div>

                        {/* Panel Lines */}
                        <div className="panel-line horizontal"></div>
                        <div className="panel-line vertical"></div>
                        <div className="panel-diagonal diag1"></div>
                        <div className="panel-diagonal diag2"></div>

                        {/* Status Lights */}
                        <div className="status-light power" style={{ animationDelay: '0s' }}></div>
                        <div className="status-light network" style={{ animationDelay: '0.3s' }}></div>
                        <div className="status-light ai" style={{ animationDelay: '0.6s' }}></div>

                        {/* Glowing Circuit Pattern */}
                        <div className="circuit-pattern">
                            <div className="circuit-line line1"></div>
                            <div className="circuit-line line2"></div>
                            <div className="circuit-node node1"></div>
                            <div className="circuit-node node2"></div>
                            <div className="circuit-node node3"></div>
                        </div>
                    </div>
                </div>

                {/* Head with HUD Display */}
                <div className="cyber-head">
                    <div className="hud-display">
                        <div className="hud-grid">
                            <div className="grid-line h-line1"></div>
                            <div className="grid-line h-line2"></div>
                            <div className="grid-line v-line1"></div>
                            <div className="grid-line v-line2"></div>
                        </div>

                        {/* Eyes with scanning effect */}
                        <div className="cyber-eyes">
                            <div
                                className="cyber-eye left"
                                style={{
                                    boxShadow: `0 0 ${15 + eyeGlow * 10}px rgba(0, 255, 163, ${0.7 + eyeGlow * 0.3})`,
                                    backgroundColor: `rgba(0, 255, 163, ${0.3 + eyeGlow * 0.7})`
                                }}
                            >
                                <div className="eye-inner">
                                    <div className="eye-pupil"></div>
                                    <div className="eye-lens-flare"></div>
                                </div>
                                {isScanning && <div className="scan-beam"></div>}
                            </div>

                            <div
                                className="cyber-eye right"
                                style={{
                                    boxShadow: `0 0 ${15 + eyeGlow * 10}px rgba(0, 255, 163, ${0.7 + eyeGlow * 0.3})`,
                                    backgroundColor: `rgba(0, 255, 163, ${0.3 + eyeGlow * 0.7})`
                                }}
                            >
                                <div className="eye-inner">
                                    <div className="eye-pupil"></div>
                                    <div className="eye-lens-flare"></div>
                                </div>
                                {isScanning && <div className="scan-beam"></div>}
                            </div>
                        </div>

                        {/* HUD Text */}
                        <div className="hud-text">
                            <div className="hud-line line-1">AI ASSISTANT</div>
                            <div className="hud-line line-2">ONLINE</div>
                            <div className="hud-line line-3">READY</div>
                        </div>
                    </div>
                </div>

                {/* Antenna with Data Stream */}
                <div className="cyber-antenna">
                    <div className="antenna-base"></div>
                    <div className="antenna-rod">
                        <div className="data-stream">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div
                                    key={i}
                                    className="data-bit"
                                    style={{ animationDelay: `${i * 0.1}s` }}
                                ></div>
                            ))}
                        </div>
                    </div>
                    <div className="antenna-tip"></div>
                </div>

                {/* Arms/Floating Orbs */}
                <div className="cyber-arms">
                    <div className="cyber-arm left">
                        <div className="arm-joint"></div>
                        <div className="arm-segment"></div>
                        <div className="arm-hand">
                            <div className="hand-finger f1"></div>
                            <div className="hand-finger f2"></div>
                            <div className="hand-finger f3"></div>
                        </div>
                    </div>

                    <div className="cyber-arm right">
                        <div className="arm-joint"></div>
                        <div className="arm-segment"></div>
                        <div className="arm-hand">
                            <div className="hand-finger f1"></div>
                            <div className="hand-finger f2"></div>
                            <div className="hand-finger f3"></div>
                        </div>
                    </div>
                </div>

                {/* Base/Thrusters */}
                <div className="cyber-base">
                    <div className="thruster left">
                        <div className="thruster-glow"></div>
                    </div>
                    <div className="thruster center">
                        <div className="thruster-glow"></div>
                    </div>
                    <div className="thruster right">
                        <div className="thruster-glow"></div>
                    </div>
                </div>
            </div>

            {/* Floating Interface Panels */}
            {isHovered && (
                <>
                    <div className="interface-panel left-panel">
                        <div className="panel-content">
                            <div className="panel-title">SYSTEMS</div>
                            <div className="panel-item">AI: ONLINE</div>
                            <div className="panel-item">NETWORK: STABLE</div>
                            <div className="panel-item">POWER: 100%</div>
                        </div>
                    </div>

                    <div className="interface-panel right-panel">
                        <div className="panel-content">
                            <div className="panel-title">FUNCTIONS</div>
                            <div className="panel-item">CHAT: ENABLED</div>
                            <div className="panel-item">ANALYSIS: READY</div>
                            <div className="panel-item">ASSIST: ACTIVE</div>
                        </div>
                    </div>
                </>
            )}

            {/* Activation Ring */}
            <div className="activation-ring"></div>

            {/* Holographic Text */}
            {isHovered && (
                <div className="hologram-text">
                    <span className="char">▶</span>
                    <span className="text">INITIATE CHAT PROTOCOL</span>
                </div>
            )}
        </div>
    );
};

export default InteractiveRobot;