import React, { useState } from 'react';
import { ArrowBigUp, ArrowBigDown, MessageSquare, Lightbulb, Pencil, Trash2 } from 'lucide-react';
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
        <div className="post-card flex group community-container">
            <div className="voting-sidebar flex flex-col items-center pr-4 border-r border-subtle mr-4" style={{ borderColor: 'var(--border-subtle)' }}>
                <button
                    className={`vote-btn up ${post.userVote === 1 ? 'active' : ''} text-gray-500 hover:text-node-green transition-colors`}
                    onClick={(e) => handleVote(e, 1)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                    <ArrowBigUp size={24} fill={post.userVote === 1 ? "var(--node-green)" : "none"} color={post.userVote === 1 ? "var(--node-green)" : "currentColor"} />
                </button>
                <span className={`font-bold text-sm my-1 ${post.userVote !== 0 ? 'text-node-green' : 'text-gray-400'}`}>
                    {post.votes}
                </span>
                <button
                    className={`vote-btn down ${post.userVote === -1 ? 'active' : ''} text-gray-500 hover:text-node-green transition-colors`}
                    onClick={(e) => handleVote(e, -1)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                    <ArrowBigDown size={24} fill={post.userVote === -1 ? "var(--node-green)" : "none"} color={post.userVote === -1 ? "var(--node-green)" : "currentColor"} />
                </button>
            </div>

            <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded flex items-center justify-center text-[10px] text-white font-bold" style={{ background: 'var(--node-green)' }}>
                            {post.communityId ? post.communityId.charAt(0).toUpperCase() : 'G'}
                        </div>
                        <span className="text-gray-300 font-bold hover:underline">r/{post.communityId}</span>
                    </div>
                    <span>•</span>
                    <span>Posted by <span className="text-gray-400 hover:text-white transition-colors">u/{post.author}</span></span>
                    <span>•</span>
                    <span>{new Date(post.timestamp).toLocaleDateString()}</span>
                </div>

                <h3 className="text-lg font-bold mb-2 text-white group-hover:text-node-green transition-colors">
                    {post.title}
                </h3>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-3">
                    {post.tags.map((tag, idx) => (
                        <span key={idx} className="text-node-green text-[10px] px-2 py-0.5 rounded border border-subtle" style={{ backgroundColor: 'var(--surface-hover)', borderColor: 'var(--border-subtle)' }}>
                            #{tag}
                        </span>
                    ))}
                    {!post.tags.length && (
                        <span className="text-gray-500 text-[10px] px-2 py-0.5 rounded border border-subtle" style={{ backgroundColor: 'var(--surface-hover)', borderColor: 'var(--border-subtle)' }}>
                            Discussion
                        </span>
                    )}
                </div>

                <p className="text-gray-400 text-sm mb-4 line-clamp-3 leading-relaxed">
                    {post.content}
                </p>

                <div className="flex items-center gap-4 text-gray-400 text-xs font-bold mt-4 pt-3 border-t border-subtle" style={{ borderColor: 'var(--border-subtle)' }}>
                    <button className="flex items-center gap-2 text-gray-400 hover:text-node-green transition-colors" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <Lightbulb size={16} />
                        <span>Suggest Solution</span>
                    </button>

                    <div className="flex items-center gap-1 hover:bg-surface-hover px-2 py-1.5 rounded transition-colors cursor-pointer">
                        <MessageSquare size={16} />
                        <span>{post.commentCount} Comments</span>
                    </div>

                    {isAuthor && (
                        <div className="flex items-center gap-2 ml-auto">
                            <button
                                onClick={handleEdit}
                                className="p-2 rounded bg-transparent border-none text-gray-500 hover:text-node-green hover:bg-white/5 transition-all"
                                title="Edit Post"
                                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                <Pencil size={16} />
                            </button>
                            <button
                                onClick={handleDelete}
                                className="p-2 rounded bg-transparent border-none text-gray-500 hover:text-red-500 hover:bg-white/5 transition-all"
                                title="Delete Post"
                                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
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
