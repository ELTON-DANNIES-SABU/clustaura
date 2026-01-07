import React, { useEffect, useState } from 'react';
import api from '../services/api';
import '../styles.css';

const NotificationsDropdown = ({ socket }) => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        // Fetch recent notifications
        const fetchNotifications = async () => {
            try {
                // Assuming we have an endpoint for this. Creating one might be needed if not existing.
                // Using a mock fetch for now or existing `notificationRoutes` check?
                // `api/notifications` is likely the route.
                const response = await api.get('/notifications');
                setNotifications(response.data);
                setUnreadCount(response.data.filter(n => !n.read).length);
            } catch (error) {
                console.warn('Failed to fetch notifications', error);
            }
        };

        fetchNotifications();
    }, []);

    useEffect(() => {
        if (!socket) return;

        socket.on('receive_notification', (notification) => {
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
        });

        return () => {
            socket.off('receive_notification');
        };
    }, [socket]);

    const toggleOpen = () => setIsOpen(!isOpen);

    const markAsRead = async () => {
        // optimistically mark all read
        setUnreadCount(0);
        // Call API
        // await api.put('/notifications/mark-read');
    };

    return (
        <div className="notifications-dropdown-container">
            <button className="nav-icon-btn" onClick={() => { toggleOpen(); markAsRead(); }}>
                🔔
                {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
            </button>

            {isOpen && (
                <div className="notifications-dropdown">
                    <h3>Notifications</h3>
                    <div className="notifications-list">
                        {notifications.length === 0 ? (
                            <div className="no-notifs">No new notifications</div>
                        ) : (
                            notifications.map(n => (
                                <div key={n._id} className={`notification-item ${!n.read ? 'unread' : ''}`}>
                                    <div className="notif-avatar">
                                        {n.sender.avatar || 'U'}
                                    </div>
                                    <div className="notif-content">
                                        <p>
                                            <strong>{n.sender.firstName} {n.sender.lastName}</strong> {n.content}
                                        </p>
                                        <span className="notif-time">{new Date(n.createdAt).toLocaleTimeString()}</span>
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

export default NotificationsDropdown;
