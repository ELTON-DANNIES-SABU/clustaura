import React, { useState } from 'react';
import { ArrowBigUp, ArrowBigDown, MessageSquare, Share2, Lightbulb, Pencil, Trash2 } from 'lucide-react';
import useCommunityStore from '../../store/communityStore';
import EditPostModal from './EditPostModal';

const PostCard = ({ post }) => {
    const { vote, deletePost, getLoggedInUser } = useCommunityStore();
    const currentUser = getLoggedInUser();
    const isAuthor = currentUser?.id === post.authorId;
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const handleVote = (e, direction) => {
        e.stopPropagation();
        vote(post.id, direction);
    };

    const handleDelete = async (e) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this post?')) {
            await deletePost(post.id);
        }
    };

    const handleEdit = (e) => {
        e.stopPropagation();
        setIsEditModalOpen(true);
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
                    <button className="btn-neon flex items-center gap-2">
                        <Lightbulb size={16} />
                        <span>Suggest Solution</span>
                    </button>

                    <div className="flex items-center gap-1 hover:bg-white/5 px-2 py-1.5 rounded border border-transparent hover:border-white/10 transition-colors">
                        <MessageSquare size={16} />
                        <span>{post.commentCount} Comments</span>
                    </div>
                    {/* <button className="flex items-center gap-1 hover:bg-white/5 px-2 py-1.5 rounded border border-transparent hover:border-white/10 transition-colors">
                        <Share2 size={16} />
                        <span>Share</span>
                    </button> */}

                    {isAuthor && (
                        <div className="flex items-center gap-2 ml-auto">
                            <button
                                onClick={handleEdit}
                                className="p-2 rounded bg-transparent border-none text-gray-500 hover:text-neon-green hover:bg-neon-green/10 transition-all"
                                title="Edit Post"
                                style={{ background: 'none', border: 'none' }}
                            >
                                <Pencil size={16} />
                            </button>
                            <button
                                onClick={handleDelete}
                                className="p-2 rounded bg-transparent border-none text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-all"
                                title="Delete Post"
                                style={{ background: 'none', border: 'none' }}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {isEditModalOpen && (
                <EditPostModal
                    post={post}
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                />
            )}
        </div>
    );
};

export default PostCard;
