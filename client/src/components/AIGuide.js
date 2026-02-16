import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import InteractiveRobot from './InteractiveRobot';
import './AIGuide.css';

const AIGuide = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([
        {
            text: "🤖 Hello! I'm your ClustAura AI Assistant. How can I help you navigate the platform today?",
            sender: 'bot',
            action: null
        }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const [robotSoundEnabled, setRobotSoundEnabled] = useState(true);

    const location = useLocation();
    const navigate = useNavigate();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    // Robot sound functions
    const playRobotSound = (type) => {
        if (!robotSoundEnabled) return;

        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();

            switch (type) {
                case 'activate':
                    // Cyber activation sound
                    const osc1 = audioContext.createOscillator();
                    const osc2 = audioContext.createOscillator();
                    const gain = audioContext.createGain();

                    osc1.connect(gain);
                    osc2.connect(gain);
                    gain.connect(audioContext.destination);

                    osc1.frequency.setValueAtTime(800, audioContext.currentTime);
                    osc2.frequency.setValueAtTime(1600, audioContext.currentTime);
                    osc1.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.5);
                    osc2.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.5);

                    osc1.type = 'square';
                    osc2.type = 'sawtooth';

                    gain.gain.setValueAtTime(0.3, audioContext.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

                    osc1.start(audioContext.currentTime);
                    osc2.start(audioContext.currentTime);
                    osc1.stop(audioContext.currentTime + 0.5);
                    osc2.stop(audioContext.currentTime + 0.5);
                    break;

                case 'notification':
                    // Notification beep
                    const notifOsc = audioContext.createOscillator();
                    const notifGain = audioContext.createGain();

                    notifOsc.connect(notifGain);
                    notifGain.connect(audioContext.destination);

                    notifOsc.frequency.setValueAtTime(1000, audioContext.currentTime);
                    notifOsc.frequency.setValueAtTime(800, audioContext.currentTime + 0.1);

                    notifOsc.type = 'sine';

                    notifGain.gain.setValueAtTime(0.3, audioContext.currentTime);
                    notifGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

                    notifOsc.start(audioContext.currentTime);
                    notifOsc.stop(audioContext.currentTime + 0.2);
                    break;

                case 'speak':
                    // Speaking sound
                    const speakOsc = audioContext.createOscillator();
                    const speakGain = audioContext.createGain();

                    speakOsc.connect(speakGain);
                    speakGain.connect(audioContext.destination);

                    speakOsc.frequency.setValueAtTime(300, audioContext.currentTime);
                    speakOsc.frequency.setValueAtTime(400, audioContext.currentTime + 0.1);
                    speakOsc.frequency.setValueAtTime(350, audioContext.currentTime + 0.2);
                    speakOsc.frequency.setValueAtTime(300, audioContext.currentTime + 0.3);

                    speakOsc.type = 'sawtooth';

                    speakGain.gain.setValueAtTime(0.2, audioContext.currentTime);
                    speakGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);

                    speakOsc.start(audioContext.currentTime);
                    speakOsc.stop(audioContext.currentTime + 0.4);
                    break;
            }
        } catch (error) {
            console.log("Audio error:", error);
        }
    };

    const activateChatbot = () => {
        playRobotSound('activate');
        setIsOpen(true);

        // Add a welcome message with robot personality
        if (messages.length <= 1) {
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    text: "🚀 I'm fully charged and ready to help! Ask me about posting problems, finding experts, or navigating the platform.",
                    sender: 'bot',
                    action: {
                        label: 'Quick Start Guide →',
                        link: '/how-it-works'
                    }
                }]);
            }, 500);
        }
    };

    const handleSendMessage = async () => {
        if (!input.trim()) return;

        const userMessage = { text: input, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        playRobotSound('notification');

        try {
            // Play thinking sound
            setTimeout(() => playRobotSound('speak'), 300);

            const response = await axios.post('/api/ai-guide/query', {
                query: input,
                currentPage: location.pathname
            });

            // Add robot personality to responses
            let botResponse = response.data.text;
            let emoji = "🤖";

            // Context-aware emoji and tone
            if (botResponse.toLowerCase().includes('help') || botResponse.toLowerCase().includes('guide')) {
                emoji = "🔍";
            }
            if (botResponse.toLowerCase().includes('success') || botResponse.toLowerCase().includes('great') || botResponse.toLowerCase().includes('perfect')) {
                emoji = "🎯";
            }
            if (botResponse.toLowerCase().includes('error') || botResponse.toLowerCase().includes('sorry') || botResponse.toLowerCase().includes('problem')) {
                emoji = "⚠️";
            }
            if (botResponse.toLowerCase().includes('welcome') || botResponse.toLowerCase().includes('thank')) {
                emoji = "👋";
            }

            const botMessage = {
                text: `${emoji} ${botResponse}`,
                sender: 'bot',
                action: response.data.action
            };

            // Add typing delay for realism
            setTimeout(() => {
                setMessages(prev => [...prev, botMessage]);
                setIsLoading(false);
            }, 600);

        } catch (error) {
            console.error("AI Guide Error:", error);
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    text: "🤖 Beep boop! I'm having technical difficulties. Please try again later or contact support.",
                    sender: 'bot'
                }]);
                setIsLoading(false);
            }, 600);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleActionClick = (link) => {
        if (link) {
            navigate(link);
            setIsOpen(false);
            playRobotSound('notification');
        }
    };

    const handleQuickQuestions = (question) => {
        const quickResponses = {
            "How to post a problem?": "You can post problems in the Challenge section. Click 'Create Problem' and fill in the details. Our AI will then find experts who can help! 🚀",
            "Find experts": "Our AI matches experts based on skills and past work. Post a problem and we'll recommend the right people for you! 🔍",
            "Community guide": "The Community is where everyone shares knowledge. You can browse posts, vote, comment, and filter by profession! 👥",
            "Dashboard help": "Your Dashboard shows all your activity - posted problems, collaborations, and notifications. It's your command center! 📊"
        };

        const userMessage = { text: question, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);

        setTimeout(() => {
            setMessages(prev => [...prev, {
                text: quickResponses[question] || "I can help with that! Try asking more specifically about what you need. 🤖",
                sender: 'bot',
                action: question === "How to post a problem?" ? { label: 'Create Problem →', link: '/create-challenge' } : null
            }]);
        }, 400);
    };

    const toggleSound = () => {
        setRobotSoundEnabled(!robotSoundEnabled);
        if (!robotSoundEnabled) {
            playRobotSound('notification');
        }
    };

    const clearChat = () => {
        if (window.confirm('Clear chat history?')) {
            setMessages([
                {
                    text: "🤖 Chat cleared! Hello again! How can I assist you today?",
                    sender: 'bot',
                    action: null
                }
            ]);
            playRobotSound('notification');
        }
    };

    return (
        <div className="ai-guide-container">
            {/* Main Chat Window - Now in bottom left */}
            {isOpen && (
                <div className="ai-guide-window left-bottom">
                    <div className="ai-guide-header">
                        <div className="ai-guide-title-area">
                            <div className="ai-guide-avatar robot-active">
                                <div className="robot-face">
                                    <div className="robot-eye-mini left"></div>
                                    <div className="robot-eye-mini right"></div>
                                    <div className="robot-mouth-mini"></div>
                                </div>
                            </div>
                            <div>
                                <span className="ai-guide-title">ClustAura AI Assistant</span>
                                <div className="ai-guide-status">
                                    <span className="status-dot online"></span>
                                    <span className="status-text">Online</span>
                                </div>
                            </div>
                        </div>
                        <div className="ai-guide-header-controls">
                            <button
                                className="sound-toggle-btn"
                                onClick={toggleSound}
                                title={robotSoundEnabled ? "Mute sounds" : "Enable sounds"}
                            >
                                {robotSoundEnabled ? "🔊" : "🔇"}
                            </button>
                            <button
                                className="clear-chat-btn"
                                onClick={clearChat}
                                title="Clear chat"
                            >
                                🗑️
                            </button>
                            <button className="ai-guide-close" onClick={() => setIsOpen(false)}>
                                ×
                            </button>
                        </div>
                    </div>

                    <div className="ai-guide-messages">
                        {messages.map((msg, index) => (
                            <div key={index} className={`message ${msg.sender}`}>
                                <div className="message-content">{msg.text}</div>
                                {msg.action && (
                                    <button
                                        className="guide-action-btn"
                                        onClick={() => handleActionClick(msg.action.link)}
                                    >
                                        {msg.action.label} →
                                    </button>
                                )}
                            </div>
                        ))}

                        {/* Quick Question Suggestions */}
                        {messages.length <= 3 && (
                            <div className="quick-questions">
                                <p className="quick-questions-title">Quick questions:</p>
                                <div className="quick-questions-buttons">
                                    {["How to post a problem?", "Find experts", "Community guide", "Dashboard help"].map((question, idx) => (
                                        <button
                                            key={idx}
                                            className="quick-question-btn"
                                            onClick={() => handleQuickQuestions(question)}
                                        >
                                            {question}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {isLoading && (
                            <div className="message bot typing">
                                <div className="typing-indicator">
                                    <div className="typing-dot"></div>
                                    <div className="typing-dot"></div>
                                    <div className="typing-dot"></div>
                                    <span className="typing-text">Processing...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="ai-guide-input-area">
                        <input
                            type="text"
                            className="ai-guide-input"
                            placeholder="Ask me anything about ClustAura..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={isLoading}
                        />
                        <button
                            className="ai-guide-send"
                            onClick={handleSendMessage}
                            disabled={isLoading || !input.trim()}
                            title="Send message"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Interactive Robot Floating Button - Still bottom right */}
            {!isOpen && (
                <div className="ai-guide-robot-fab">
                    <InteractiveRobot onActivate={activateChatbot} />
                    <div className="robot-hint">
                        <span className="hint-text">Click me!</span>
                        <div className="hint-arrow">↑</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIGuide;