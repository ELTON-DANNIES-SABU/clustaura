import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Bell } from 'lucide-react';
import { useToast } from './Community/shared/Toast';
import '../styles.css';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();
    const toast = useToast();

    const fetchNotifications = async () => {
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                const { data } = await axios.get('/api/notifications', config);
                console.log('Fetched notifications:', data);
                setNotifications(data);
                setUnreadCount(data.filter(n => !n.read).length);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    useEffect(() => {
        fetchNotifications();

        // Socket listener for real-time updates
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            const socket = io('/');

            socket.emit('join_room', user._id);

            socket.on('receive_notification', (newNotification) => {
                console.log('Received new notification:', newNotification);
                setNotifications(prev => [newNotification, ...prev]);
                setUnreadCount(prev => prev + 1);
                
                // Show real-time toast
                if (newNotification.type === 'team_invite') {
                    toast.info(`New Project Invitation: ${newNotification.content}`);
                } else {
                    toast.info(newNotification.content);
                }
            });

            return () => socket.disconnect();
        }
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleBellClick = async () => {
        setIsOpen(!isOpen);
        if (!isOpen && unreadCount > 0) {
            try {
                const userStr = localStorage.getItem('user');
                const user = JSON.parse(userStr);
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                await axios.put('/api/notifications/read', {}, config);
                setUnreadCount(0);
                // Optimistically update read status
                setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            } catch (error) {
                console.error('Error marking read:', error);
            }
        }
    };

    const handleInvitationResponse = async (notificationId, projectId, action) => {
        try {
            const userStr = localStorage.getItem('user');
            const user = JSON.parse(userStr);
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            
            await axios.post(`/api/workplace/projects/${projectId}/invitations/respond`, { action }, config);
            
            toast.success(`Invitation ${action}ed successfully!`);
            
            // Mark notification as read locally
            setNotifications(prev => prev.map(n => n._id === notificationId ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
            
            if (action === 'accept') {
                navigate(`/workplace/project/${projectId}/board`);
            }
        } catch (error) {
            console.error('Error responding to invitation:', error);
            toast.error('Failed to respond to invitation.');
        }
    };

    const handleNotificationClick = (notification) => {
        setIsOpen(false);
        if (notification.type === 'friend_request') {
            navigate('/friends');
        } else if (notification.type === 'message') {
            navigate(`/chat/${notification.sender._id || notification.sender}`);
        } else if (notification.type === 'friend_accept') {
            navigate(`/chat/${notification.sender._id || notification.sender}`);
        } else if (notification.type === 'comment' || notification.type === 'like') {
            // Navigate to dashboard and maybe scroll to challenge? 
            // Ideally we'd have a /challenge/:id page, but Dashboard works for now.
            navigate('/dashboard');
        }
    };

    return (
        <div className="notification-bell-container" ref={dropdownRef}>
            <button className="notification-bell-btn" onClick={handleBellClick}>
                <Bell size={22} />
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            </button>

            {isOpen && (
                <div className="notification-dropdown">
                    <div className="notification-header">
                        <h3>Notifications</h3>
                    </div>
                    <div className="notification-list">
                        {notifications.length === 0 ? (
                            <p className="no-notifications">No notifications</p>
                        ) : (
                            notifications.map(n => (
                                <div
                                    key={n._id}
                                    className={`notification-item ${!n.read ? 'unread' : ''}`}
                                    onClick={() => handleNotificationClick(n)}
                                >
                                    <div className="notification-content">
                                        <p>{n.content}</p>
                                        <span className="notification-time">
                                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        
                                        {n.type === 'team_invite' && !n.read && (
                                            <div className="notification-actions" style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                                                <button 
                                                    className="accept-btn-mini"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleInvitationResponse(n._id, n.relatedId, 'accept');
                                                    }}
                                                    style={{ background: '#00FF9C', color: 'black', border: 'none', padding: '5px 15px', borderRadius: '5px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                                                >
                                                    Accept
                                                </button>
                                                <button 
                                                    className="decline-btn-mini"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleInvitationResponse(n._id, n.relatedId, 'reject');
                                                    }}
                                                    style={{ background: 'rgba(255, 255, 255, 0.1)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '5px 15px', borderRadius: '5px', fontSize: '12px', cursor: 'pointer' }}
                                                >
                                                    Decline
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
