import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PostComposer from './PostComposer';
import PostCard from './PostCard';
import '../styles.css';

const PostFeed = () => {
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);

    // Initial Mock Data
    const initialPosts = [
        {
            id: '1',
            author: {
                name: 'Elton',
                role: 'Full Stack Architect',
                avatar: 'E',
                isMe: true
            },
            content: 'Just deployed the new core engine for Clustaura! 🚀 Check out the new response times.',
            image: 'https://images.unsplash.com/photo-1555099962-4199c345e5dd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80',
            projectLink: 'https://github.com/clustaura/core',
            likes: 42,
            comments: 12,
            shares: 5,
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            isProject: true
        },
        {
            id: '2',
            author: {
                name: 'Sarah Chen',
                role: 'AI Researcher',
                avatar: 'S',
                isMe: false
            },
            content: 'Exploring the possibilities of generative agents in collaborative workspaces. The results are fascinating.',
            likes: 128,
            comments: 34,
            shares: 12,
            createdAt: new Date(Date.now() - 7200000).toISOString()
        },
        {
            id: '3',
            author: {
                name: 'Mike Ross',
                role: 'Frontend Dev',
                avatar: 'M',
                isMe: false
            },
            content: 'Glassmorphism is back in 2026? I dig it. #UI #Design',
            likes: 56,
            comments: 8,
            shares: 2,
            createdAt: new Date(Date.now() - 86400000).toISOString()
        }
    ];

    useEffect(() => {
        // Load from local storage or use initial mocks
        const storedPosts = localStorage.getItem('clustaura_posts');
        if (storedPosts) {
            setPosts(JSON.parse(storedPosts));
        } else {
            setPosts(initialPosts);
            localStorage.setItem('clustaura_posts', JSON.stringify(initialPosts));
        }
    }, []);

    const handleCreatePost = (newPost) => {
        const updatedPosts = [newPost, ...posts];
        setPosts(updatedPosts);
        localStorage.setItem('clustaura_posts', JSON.stringify(updatedPosts));
    };

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
                {/* Spacer for alignment */}
                <div style={{ width: '100px' }}></div>
            </header>

            <div className="feed-container">
                <div className="feed-left-sidebar">
                    {/* Placeholder for left sidebar (Profile summary, etc.) - Optional */}
                </div>

                <div className="feed-main-content">
                    <PostComposer onPostCreate={handleCreatePost} />

                    <div className="posts-list">
                        {posts.map(post => (
                            <PostCard key={post.id} post={post} />
                        ))}
                    </div>
                </div>

                <div className="feed-right-sidebar">
                    {/* Placeholder for right sidebar (Trending, Recommendations) - Optional */}
                </div>
            </div>
        </div>
    );
};

export default PostFeed;
