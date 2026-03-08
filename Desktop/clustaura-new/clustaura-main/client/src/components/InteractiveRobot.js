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
            className={`cute-robot-container ${isHovered ? 'hovered' : ''} ${isActive ? 'active' : ''}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
            title="Clusty - Your AI Buddy"
        >
            {/* Hologram Effect Overlay */}
            <canvas
                ref={canvasRef}
                className="hologram-canvas"
                width="80"
                height="80"
            />

            <div className="cute-robot-body">
                {/* Antenna */}
                <div className="cute-antenna">
                    <div className="antenna-line"></div>
                    <div className="antenna-bulb"></div>
                </div>

                {/* Head */}
                <div className="cute-head">
                    <div className="cute-face">
                        <div className="cute-eyes">
                            <div
                                className="cute-eye left"
                                style={{
                                    boxShadow: `0 0 ${8 + eyeGlow * 10}px #00ffa3`,
                                    transform: `scale(${1 + eyeGlow * 0.1})`
                                }}
                            >
                                <div className="eye-sparkle"></div>
                            </div>
                            <div
                                className="cute-eye right"
                                style={{
                                    boxShadow: `0 0 ${8 + eyeGlow * 10}px #00ffa3`,
                                    transform: `scale(${1 + eyeGlow * 0.1})`
                                }}
                            >
                                <div className="eye-sparkle"></div>
                            </div>
                        </div>
                        <div className="cute-mouth"></div>
                    </div>
                </div>

                {/* Body */}
                <div className="cute-torso">
                    <div className="heart-core"></div>
                </div>

                {/* Floating Hands */}
                <div className="cute-hands">
                    <div className="cute-hand left"></div>
                    <div className="cute-hand right"></div>
                </div>
            </div>

            {/* Floating Interface Panel */}
            {isHovered && (
                <div className="mini-status-bubble">
                    <span>HELLO!</span>
                </div>
            )}
        </div>
    );
};

export default InteractiveRobot;