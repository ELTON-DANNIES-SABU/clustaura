import React, { useState } from 'react';
import { ArrowBigUp, ArrowBigDown, MessageSquare, Reply } from 'lucide-react';
import useCommunityStore from '../../store/communityStore';

const Comment = ({ comment, depth = 0, postId }) => {
    const [showReply, setShowReply] = useState(false);
    const { voteComment } = useCommunityStore();

    const handleVote = (direction) => {
        voteComment(postId, comment.id, direction);
    };

    return (
        <div className={`flex gap-3 ${depth > 0 ? 'ml-6 mt-4 border-l border-subtle pl-4' : 'mt-8 border-t border-subtle pt-6'}`} style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex flex-col items-center gap-1">
                <button
                    className={`vote-btn up ${comment.userVote === 1 ? 'active' : ''} text-gray-500 hover:text-node-green transition-colors`}
                    onClick={() => handleVote(1)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                    <ArrowBigUp size={18} fill={comment.userVote === 1 ? "var(--node-green)" : "none"} color={comment.userVote === 1 ? "var(--node-green)" : "currentColor"} />
                </button>
                <span className={`text-xs font-bold ${comment.userVote !== 0 ? 'text-node-green' : 'text-gray-400'}`}>{comment.votes}</span>
                <button
                    className={`vote-btn down ${comment.userVote === -1 ? 'active' : ''} text-gray-500 hover:text-node-green transition-colors`}
                    onClick={() => handleVote(-1)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                    <ArrowBigDown size={18} fill={comment.userVote === -1 ? "var(--node-green)" : "none"} color={comment.userVote === -1 ? "var(--node-green)" : "currentColor"} />
                </button>
            </div>

            <div className="flex-1">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2 font-medium">
                    <span className="text-white font-bold hover:underline cursor-pointer">u/{comment.author}</span>
                    <span>•</span>
                    <span>{new Date(comment.timestamp).toLocaleDateString()}</span>
                </div>
                <div className="text-[14px] text-gray-300 leading-relaxed">
                    {comment.content}
                </div>

                <div className="flex gap-4 mt-4">
                    <button
                        className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-gray-500 hover:text-node-green transition-colors"
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                        onClick={() => setShowReply(!showReply)}
                    >
                        <Reply size={12} />
                        Reply
                    </button>
                    {/* Share/Report links could be here */}
                </div>

                {showReply && (
                    <div className="mt-4 community-container">
                        <textarea
                            className="text-sm min-h-[100px]"
                            placeholder="What are your thoughts?"
                        />
                        <div className="flex justify-end gap-3 mt-3">
                            <button
                                className="text-xs text-gray-500 hover:text-white transition-colors"
                                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                                onClick={() => setShowReply(false)}
                            >
                                Cancel
                            </button>
                            <button className="btn-primary py-2 px-6 text-xs">
                                Post Reply
                            </button>
                        </div>
                    </div>
                )}

                {comment.replies && comment.replies.map(reply => (
                    <Comment key={reply.id} comment={reply} depth={depth + 1} postId={postId} />
                ))}
            </div>
        </div>
    );
};

const CommentSection = ({ postId }) => {
    const { comments, addComment, getLoggedInUser } = useCommunityStore();
    const [newComment, setNewComment] = useState('');
    const postComments = comments[postId] || [];
    const user = getLoggedInUser();

    const handleAddComment = () => {
        if (!newComment.trim()) return;
        addComment(postId, newComment);
        setNewComment('');
    };

    return (
        <div className="mt-12 border-t border-subtle pt-8" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="mb-10 community-container">
                <p className="text-xs text-gray-500 mb-4 font-bold uppercase tracking-widest">
                    Comment as <span className="text-node-green">{user?.name || 'User'}</span>
                </p>
                <div className="surface-panel rounded-xl overflow-hidden border border-subtle bg-surface-bg transition-all" style={{ background: 'var(--surface-bg)', borderColor: 'var(--border-subtle)' }}>
                    <textarea
                        className="w-full bg-transparent p-6 text-[15px] text-white outline-none min-h-[140px] placeholder:text-gray-600 border-none"
                        placeholder="What are your thoughts?"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        style={{ border: 'none', background: 'transparent' }}
                    />
                    <div className="px-6 py-4 flex justify-end border-t border-subtle" style={{ borderColor: 'var(--border-subtle)', background: 'rgba(0,0,0,0.1)' }}>
                        <button
                            className="btn-primary px-10"
                            disabled={!newComment.trim()}
                            onClick={handleAddComment}
                        >
                            POST COMMENT
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex flex-col">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <MessageSquare size={16} />
                    Discussion
                </h3>
                {postComments.map(comment => (
                    <Comment key={comment.id} comment={comment} postId={postId} />
                ))}
                {postComments.length === 0 && (
                    <p className="text-sm text-gray-500 italic mt-4">No comments yet. Start the conversation!</p>
                )}
            </div>
        </div>
    );
};

export default CommentSection;
