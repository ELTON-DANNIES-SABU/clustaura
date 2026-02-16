import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import ProfessionalComposer from './ProfessionalComposer';
import PostCard from './PostCard'; // We can reuse PostCard for displaying proper posts
import '../styles.css';

const ProfessionalFeed = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        // Connect Socket
        const newSocket = io('http://localhost:5000');
        setSocket(newSocket);

        // Fetch Initial Feed
        const fetchFeed = async () => {
            try {
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    const { token } = JSON.parse(userStr);
                    const config = { headers: { Authorization: `Bearer ${token}` } };
                    const { data } = await axios.get('http://localhost:5000/api/professional', config);
                    setPosts(data);
                }
                setLoading(false);
            } catch (error) {
                console.error('Error fetching professional feed:', error);
                setLoading(false);
            }
        };

        fetchFeed();

        // Socket Listeners
        newSocket.on('new-professional-post', (newPost) => {
            setPosts(prev => [newPost, ...prev]);
        });

        return () => newSocket.disconnect();
    }, []);

    return (
        <div className="professional-feed-container">
            <ProfessionalComposer />

            <div className="feed-header">
                <h2>Professional Feed</h2>
                <div className="feed-tabs">
                    <button className="active">All</button>
                    <button>Work</button>
                    <button>Projects</button>
                    <button>Experience</button>
                </div>
            </div>

            {loading ? (
                <div className="loading-spinner"></div>
            ) : (
                <div className="posts-list">
                    {posts.map(post => (
                        <PostCard key={post._id} post={post} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProfessionalFeed;
