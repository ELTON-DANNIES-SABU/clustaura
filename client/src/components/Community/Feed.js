import React from 'react';
import useCommunityStore from '../../store/communityStore';
import PostCard from './PostCard';
import { useNavigate } from 'react-router-dom';

const Feed = () => {
    const { posts, loading } = useCommunityStore();
    const navigate = useNavigate();

    if (loading) return (
        <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2" style={{ borderTopColor: 'var(--node-green)' }}></div>
        </div>
    );

    if (!posts || posts.length === 0) return (
        <div className="p-12 text-center text-gray-400 bg-surface-bg rounded-xl border border-subtle" style={{ background: 'var(--surface-bg)', borderColor: 'var(--border-subtle)' }}>
            <p className="text-xl mb-2 font-bold text-white">No posts found</p>
            <p className="text-sm">Be the first to post something in the community!</p>
        </div>
    );

    return (
        <div className="post-feed flex flex-col gap-4">
            {posts.map(post => (
                <div key={post.id} onClick={() => navigate(`/community/post/${post.id}`)} style={{ cursor: 'pointer' }}>
                    <PostCard post={post} />
                </div>
            ))}
        </div>
    );
};

export default Feed;
