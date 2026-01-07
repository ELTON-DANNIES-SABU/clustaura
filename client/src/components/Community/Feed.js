import React from 'react';
import useCommunityStore from '../../store/communityStore';
import PostCard from './PostCard';
import { useNavigate } from 'react-router-dom';

const Feed = () => {
    const { posts, loading } = useCommunityStore();
    const navigate = useNavigate();

    if (loading) return (
        <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-neon-green"></div>
        </div>
    );

    if (!posts || posts.length === 0) return (
        <div className="p-12 text-center text-gray-500 bg-charcoal rounded border border-gray-800">
            <p className="text-xl mb-2">No posts found</p>
            <p className="text-sm">Be the first to post something in the community!</p>
        </div>
    );

    return (
        <div className="post-feed">
            {/* <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
                {['Hot', 'New', 'Top', 'Rising'].map(sort => (
                    <button
                        key={sort}
                        className="px-4 py-1 rounded-full border border-neon-green/30 bg-black/40 text-xs font-bold text-gray-400 hover:border-neon-green hover:text-neon-green hover:shadow-[0_0_10px_rgba(0,255,156,0.2)] transition-all whitespace-nowrap uppercase tracking-wider"
                    >
                        {sort}
                    </button>
                ))}
            </div> */}

            {posts.map(post => (
                <div key={post.id} onClick={() => navigate(`/community/post/${post.id}`)}>
                    <PostCard post={post} />
                </div>
            ))}
        </div>
    );
};

export default Feed;
