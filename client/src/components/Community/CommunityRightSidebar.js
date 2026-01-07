import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Filter, Flame, MessageCircle } from 'lucide-react';
import useCommunityStore from '../../store/communityStore';

const CommunityRightSidebar = () => {
    const navigate = useNavigate();
    const { posts } = useCommunityStore();
    return (
        <div className="flex flex-col gap-6">

            {/* Top Challenges */}
            <div className="community-sidebar-card">
                <div className="flex items-center gap-2 mb-4 text-neon-green border-b border-neon-green/20 pb-2">
                    <Flame size={18} />
                    <h3 className="font-bold uppercase tracking-widest text-sm">Top Challenges Today</h3>
                </div>
                <div className="flex flex-col gap-4">
                    {posts.slice(0, 3).sort((a, b) => b.votes - a.votes).map((item) => (
                        <div key={item.id} className="group cursor-pointer" onClick={() => navigate(`/community/post/${item.id}`)}>
                            <h4 className="text-sm font-semibold text-gray-200 group-hover:text-neon-green transition-colors mb-1">
                                {item.title}
                            </h4>
                            <div className="flex gap-3 text-xs text-gray-500">
                                <span>{item.votes} upvotes</span>
                                <span>{item.commentCount} comments</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Filters */}
            {/* <div className="community-sidebar-card">
                <div className="flex items-center gap-2 mb-4 text-white border-b border-white/10 pb-2">
                    <Filter size={18} />
                    <h3 className="font-bold uppercase tracking-widest text-sm">Filter Feed</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                    {['Most Discussed', 'Most Upvoted', 'Unsolved', 'Beginner Friendly'].map(filter => (
                        <span
                            key={filter}
                            className="text-xs border border-gray-700 bg-black/40 px-2 py-1 rounded text-gray-400 hover:border-neon-green hover:text-neon-green cursor-pointer transition-colors"
                        >
                            {filter}
                        </span>
                    ))}
                </div>
            </div> */}

            {/* Create Button (Desktop) */}
            <button
                onClick={() => navigate('/community/create')}
                className="btn-neon-solid w-full"
            >
                + Create Challenge
            </button>

            <div className="text-[10px] text-gray-600 text-center mt-4">
                CLUSTAURA CHALLENGES © 2026
            </div>
        </div>
    );
};

export default CommunityRightSidebar;
