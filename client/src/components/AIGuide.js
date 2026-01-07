import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AIGuide.css';

const AIGuide = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([
        {
            text: "Hi! I'm your ClustAura Guide. How can I help you navigate the platform today?",
            sender: 'bot',
            action: null
        }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const location = useLocation();
    const navigate = useNavigate();

    // Hide AI Guide on specific pages (Login, Register)
    const hiddenPaths = ['/login', '/register', '/'];
    if (hiddenPaths.includes(location.pathname)) {
        return null;
    }

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSendMessage = async () => {
        if (!input.trim()) return;

        const userMessage = { text: input, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await axios.post('/api/ai-guide/query', {
                query: input,
                currentPage: location.pathname
            });

            const botMessage = {
                text: response.data.text,
                sender: 'bot',
                action: response.data.action
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error("AI Guide Error:", error);
            setMessages(prev => [...prev, {
                text: "Sorry, I'm having trouble connecting right now. Please try again later.",
                sender: 'bot'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };

    const handleActionClick = (link) => {
        if (link) {
            navigate(link);
            setIsOpen(false); // Optional: close chat on navigation
        }
    };

    return (
        <div className="ai-guide-container">
            {/* Main Chat Window */}
            {isOpen && (
                <div className="ai-guide-window">
                    <div className="ai-guide-header">
                        <div className="ai-guide-title-area">
                            <div className="ai-guide-avatar">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                </svg>
                            </div>
                            <span className="ai-guide-title">ClustAura Guide</span>
                        </div>
                        <button className="ai-guide-close" onClick={() => setIsOpen(false)}>×</button>
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
                        {isLoading && (
                            <div className="message bot">
                                <div className="typing-indicator">
                                    <div className="typing-dot"></div>
                                    <div className="typing-dot"></div>
                                    <div className="typing-dot"></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="ai-guide-input-area">
                        <input
                            type="text"
                            className="ai-guide-input"
                            placeholder="Ask me anything..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={isLoading}
                        />
                        <button
                            className="ai-guide-send"
                            onClick={handleSendMessage}
                            disabled={isLoading || !input.trim()}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Floating Action Button */}
            {!isOpen && (
                <div className="ai-guide-fab" onClick={() => setIsOpen(true)}>
                    <div className="ai-guide-fab-icon">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            <path d="M8 9h8"></path>
                            <path d="M8 13h6"></path>
                        </svg>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIGuide;
