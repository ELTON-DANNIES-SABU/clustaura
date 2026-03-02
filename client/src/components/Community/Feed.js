import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PostCard from './PostCard';
import useCommunityStore from '../../store/communityStore';
import { PlusCircle } from 'lucide-react';

const Feed = ({ onToast, activeCommunityId, onOpenCreateModal }) => {
    const navigate = useNavigate();
    const { posts, fetchPosts, loading } = useCommunityStore();

    useEffect(() => {
        fetchPosts(activeCommunityId);
    }, [fetchPosts, activeCommunityId]);

    const handlePostClick = (postId) => {
        navigate(`/community/post/${postId}`);
    };

    return (
        <div className="feed-container">
            {/* Create Post Button for Desktop */}
            <div className="feed-header" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
                padding: '16px',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '12px',
                border: '1px solid rgba(51,153,51,0.2)'
            }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                        {activeCommunityId ? 'Community Feed' : 'All Challenges'}
                    </h2>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#a0a0a0' }}>
                        Explore and solve technical challenges
                    </p>
                </div>
                <button
                    className="btn-primary"
                    onClick={onOpenCreateModal}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 20px'
                    }}
                >
                    <PlusCircle size={16} />
                    New Challenge
                </button>
            </div>

            {/* Posts List */}
            {loading ? (
                <div className="loading-spinner" style={{ textAlign: 'center', padding: '40px' }}>
                    Loading challenges...
                </div>
            ) : (
                <div className="posts-list">
                    {posts && posts.length > 0 ? (
                        posts.map(post => (
                            <PostCard
                                key={post._id}
                                post={post}
                                onClick={() => handlePostClick(post._id)}
                                onToast={onToast}
                            />
                        ))
                    ) : (
                        <div style={{
                            textAlign: 'center',
                            padding: '60px 20px',
                            background: 'rgba(255,255,255,0.02)',
                            borderRadius: '16px',
                            border: '1px dashed rgba(51,153,51,0.3)'
                        }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                            <h3 style={{ margin: '0 0 8px 0' }}>No challenges yet</h3>
                            <p style={{ color: '#a0a0a0', marginBottom: '20px' }}>
                                Be the first to share a technical challenge with the community!
                            </p>
                            <button
                                className="btn-primary"
                                onClick={onOpenCreateModal}
                            >
                                Create First Challenge
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Feed;