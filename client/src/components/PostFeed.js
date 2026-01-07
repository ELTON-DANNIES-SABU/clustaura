import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../services/api';
import PostComposer from './PostComposer';
import PostCard from './PostCard';
import NotificationsDropdown from './NotificationsDropdown';
import '../styles.css';

const PostFeed = () => {
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState(null);

    // Initial Fetch
    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const response = await api.get('/posts/feed');
                setPosts(response.data.posts);
            } catch (error) {
                console.error('Error fetching posts:', error);
                if (error.response?.status === 401) {
                    // Redirect to login if unauthorized
                    navigate('/login');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();

        // Socket.IO Connection
        const newSocket = io('http://localhost:5000'); // Ensure this matches server port
        setSocket(newSocket);

        return () => newSocket.close();
    }, []);

    // Socket Event Listeners
    useEffect(() => {
        if (!socket) return;

        socket.on('new-post', (newPost) => {
            // Respect hidden flag if it slips through (e.g. author seeing it?)
            if (newPost.isHidden) return;
            setPosts((prevPosts) => [newPost, ...prevPosts]);
        });

        socket.on('post-updated', (updatedData) => {
            setPosts((prevPosts) => prevPosts.map(post => {
                if (post._id === updatedData.postId) {
                    if (updatedData.action === 'like') {
                        return { ...post, likes: updatedData.likes };
                    } else if (updatedData.action === 'comment') {
                        return { ...post, comments: [...post.comments, updatedData.comment] };
                    }
                }
                return post;
            }));
        });

        return () => {
            socket.off('new-post');
            socket.off('post-updated');
        };
    }, [socket]);

    return (
        <div className="post-feed-page">
            <header className="feed-header">
                <button className="back-button" onClick={() => navigate('/dashboard')}>
                    ← Back to Dashboard
                </button>
                <div className="header-content">
                    <h1>Community Feed</h1>
                    <p>Connect, share, and discover what's happening</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <NotificationsDropdown socket={socket} />
                    <div style={{ width: '20px' }}></div>
                </div>
            </header>

            <div className="feed-container">
                <div className="feed-left-sidebar">
                    {/* Placeholder for left sidebar (Profile summary, etc.) - Optional */}
                </div>

                <div className="feed-main-content">
                    <PostComposer />

                    {loading ? (
                        <div className="loading-state">Loading feed...</div>
                    ) : (
                        <div className="posts-list">
                            {posts.map(post => (
                                <PostCard key={post._id} post={post} />
                            ))}
                            {posts.length === 0 && (
                                <div className="empty-state">No posts yet. Be the first!</div>
                            )}
                        </div>
                    )}
                </div>

                <div className="feed-right-sidebar">
                    {/* Placeholder for right sidebar (Trending, Recommendations) - Optional */}
                </div>
            </div>
        </div>
    );
};

export default PostFeed;
