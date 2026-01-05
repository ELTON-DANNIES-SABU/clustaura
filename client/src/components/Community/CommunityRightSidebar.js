import React from 'react';
import { TrendingUp, Filter, Flame, MessageCircle } from 'lucide-react';

const CommunityRightSidebar = () => {
    return (
        <div className="flex flex-col gap-6">

            {/* Top Challenges */}
            <div className="community-sidebar-card">
                <div className="flex items-center gap-2 mb-4 text-neon-green border-b border-neon-green/20 pb-2">
                    <Flame size={18} />
                    <h3 className="font-bold uppercase tracking-widest text-sm">Top Challenges Today</h3>
                </div>
                <div className="flex flex-col gap-4">
                    {[
                        { title: "Optimizing React Re-renders in Dashboard", votes: 42, comments: 12 },
                        { title: "Best architecture for Micro-frontends?", votes: 38, comments: 25 },
                        { title: "Dealing with Imposter Syndrome as a Senior", votes: 156, comments: 89 }
                    ].map((item, i) => (
                        <div key={i} className="group cursor-pointer">
                            <h4 className="text-sm font-semibold text-gray-200 group-hover:text-neon-green transition-colors mb-1">
                                {item.title}
                            </h4>
                            <div className="flex gap-3 text-xs text-gray-500">
                                <span>{item.votes} upvotes</span>
                                <span>{item.comments} comments</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Filters */}
            <div className="community-sidebar-card">
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
            </div>

            {/* Create Button (Desktop) */}
            <button className="w-full bg-neon-green text-black font-bold py-3 rounded uppercase tracking-widest hover:shadow-[0_0_20px_rgba(0,255,156,0.4)] transition-all">
                + Create Challenge
            </button>

            <div className="text-[10px] text-gray-600 text-center mt-4">
                CLUSTAURA CHALLENGES © 2026
            </div>
        </div>
    );
};

export default CommunityRightSidebar;
