
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import '../styles.css';

const Chat = () => {
    const { friendId } = useParams();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [friend, setFriend] = useState(null);
    const [socket, setSocket] = useState(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            navigate('/login');
            return;
        }
        const user = JSON.parse(userStr);

        // Connect to socket
        const newSocket = io('/');
        setSocket(newSocket);

        // Join my own room to receive messages
        newSocket.emit('join_room', user._id);

        // Listen for new messages
        newSocket.on('receive_message', (message) => {
            // Only add if it belongs to this conversation
            if ((message.sender === friendId || message.sender === user._id) &&
                (message.recipient === user._id || message.recipient === friendId)) {
                setMessages((prev) => [...prev, message]);
            }
        });

        // Fetch friend details (reusing friends list for simplicity or fetch profile)
        // For now, let's just fetch basic friend status check or search
        // Ideally we need an endpoint to get user by ID, profile route works?
        // Let's use the friend search endpoint or just generic user endpoint if available.
        // Actually, we can assume friendId is valid for now, or fetch previous messages which might contain user info?
        // Let's rely on finding them in the friends list if we want name.
        const fetchFriendInfo = async () => {
            // Quick hack: Search for them or loop through friends list from localStorage if easier
            const friendsList = JSON.parse(localStorage.getItem('friendsList') || '[]'); // This was mock data, won't work perfectly with new real DB
            // Let's try to fetch their profile via a new helper or existing route
            // We'll create a simple "getUser" or just fetch friends list from API
            try {
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                const { data } = await axios.get('/api/friends', config);
                const foundFriend = data.find(f => f._id === friendId);
                if (foundFriend) setFriend(foundFriend);
            } catch (err) {
                console.error("Error fetching friend info", err);
            }
        };
        fetchFriendInfo();

        // Fetch message history
        const fetchMessages = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                const { data } = await axios.get(`/api/chat/${friendId}`, config);
                setMessages(data);
            } catch (error) {
                console.error('Error fetching messages:', error);
            }
        };
        fetchMessages();

        return () => {
            newSocket.disconnect();
        };
    }, [friendId, navigate]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!inputMessage.trim()) return;

        const userStr = localStorage.getItem('user');
        const user = JSON.parse(userStr);

        if (socket) {
            const messageData = {
                sender: user._id,
                recipient: friendId,
                content: inputMessage
            };

            socket.emit('send_message', messageData);
            // We don't manually add to state here, we wait for 'receive_message' event which we also listen to for our own messages
            setInputMessage('');
        }
    };

    return (
        <div className="chat-page">
            <header className="chat-header">
                <button className="back-button" onClick={() => navigate('/friends')}>
                    ← Back
                </button>
                <div className="chat-user-info">
                    {friend ? (
                        <>
                            <div className="user-avatar-small">
                                {friend.firstName?.charAt(0)}{friend.lastName?.charAt(0)}
                            </div>
                            <h3>{friend.firstName} {friend.lastName}</h3>
                        </>
                    ) : (
                        <h3>Chat</h3>
                    )}
                </div>
            </header>

            <div className="chat-messages">
                {messages.map((msg, index) => {
                    const user = JSON.parse(localStorage.getItem('user'));
                    const isMyMessage = msg.sender === user._id;
                    return (
                        <div key={index} className={`message-bubble ${isMyMessage ? 'my-message' : 'friend-message'}`}>
                            <div className="message-content">{msg.content}</div>
                            <div className="message-time">
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-area" onSubmit={handleSendMessage}>
                <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="chat-input"
                />
                <button type="submit" className="chat-send-btn">
                    Send
                </button>
            </form>
        </div>
    );
};

export default Chat;
