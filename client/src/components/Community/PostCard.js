import React from 'react';
import { ArrowBigUp, ArrowBigDown, MessageSquare, Share2, Lightbulb } from 'lucide-react';
import useCommunityStore from '../../store/communityStore';

const PostCard = ({ post }) => {
    const { vote } = useCommunityStore();

    const handleVote = (e, direction) => {
        e.stopPropagation();
        vote(post.id, direction);
    };

    return (
        <div className="post-card flex group">
            <div className="voting-sidebar">
                <button
                    className={`vote-btn up ${post.userVote === 1 ? 'active' : ''}`}
                    onClick={(e) => handleVote(e, 1)}
                >
                    <ArrowBigUp size={24} fill={post.userVote === 1 ? "currentColor" : "none"} />
                </button>
                <span className={`font-bold text-sm my-1 ${post.userVote !== 0 ? 'text-neon-green' : 'text-gray-400'}`}>
                    {post.votes}
                </span>
                <button
                    className={`vote-btn down ${post.userVote === -1 ? 'active' : ''}`}
                    onClick={(e) => handleVote(e, -1)}
                >
                    <ArrowBigDown size={24} fill={post.userVote === -1 ? "currentColor" : "none"} />
                </button>
            </div>

            <div className="flex-1 pl-2">
                <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-charcoal border border-gray-700 flex items-center justify-center text-[10px] text-neon-green font-bold">
                            {post.communityName ? post.communityName.charAt(0) : 'G'}
                        </div>
                        <span className="text-gray-300 font-bold hover:underline">r/{post.communityId}</span>
                    </div>
                    <span>•</span>
                    <span>Posted by <span className="text-gray-400 hover:text-white transition-colors">u/{post.author}</span></span>
                    <span>•</span>
                    <span>{new Date(post.timestamp).toLocaleDateString()}</span>
                </div>

                <h3 className="text-lg font-bold mb-2 text-white group-hover:text-neon-green transition-colors">
                    {post.title}
                </h3>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-3">
                    {post.tags.map((tag, idx) => (
                        <span key={idx} className="bg-charcoal text-neon-green text-[10px] px-2 py-0.5 rounded-full border border-neon-green/30">
                            #{tag}
                        </span>
                    ))}
                    {!post.tags.length && (
                        <span className="bg-charcoal text-gray-500 text-[10px] px-2 py-0.5 rounded-full border border-gray-800">
                            Discussion
                        </span>
                    )}
                </div>

                <p className="text-gray-400 text-sm mb-4 line-clamp-3 leading-relaxed">
                    {post.content}
                </p>

                <div className="flex items-center gap-4 text-gray-400 text-xs font-bold mt-4 pt-3 border-t border-white/5">
                    <button className="flex items-center gap-2 hover:bg-white/5 px-2 py-1.5 rounded transition-colors text-white hover:text-neon-green">
                        <Lightbulb size={16} className="text-neon-green" />
                        <span>Suggest Solution</span>
                    </button>

                    <div className="flex items-center gap-1 hover:bg-white/5 px-2 py-1.5 rounded transition-colors">
                        <MessageSquare size={16} />
                        <span>{post.commentCount} Comments</span>
                    </div>
                    <div className="flex items-center gap-1 hover:bg-white/5 px-2 py-1.5 rounded transition-colors">
                        <Share2 size={16} />
                        <span>Share</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PostCard;
