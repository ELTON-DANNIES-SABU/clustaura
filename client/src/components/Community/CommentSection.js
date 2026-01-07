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
        <div className={`flex gap-3 ${depth > 0 ? 'ml-6 mt-4 border-l-2 border-gray-800 pl-4' : 'mt-6'}`}>
            <div className="flex flex-col items-center gap-1">
                <button
                    className={`vote-btn up ${comment.userVote === 1 ? 'active' : ''}`}
                    onClick={() => handleVote(1)}
                >
                    <ArrowBigUp size={18} fill={comment.userVote === 1 ? 'currentColor' : 'none'} />
                </button>
                <span className="text-xs font-bold">{comment.votes}</span>
                <button
                    className={`vote-btn down ${comment.userVote === -1 ? 'active' : ''}`}
                    onClick={() => handleVote(-1)}
                >
                    <ArrowBigDown size={18} fill={comment.userVote === -1 ? 'currentColor' : 'none'} />
                </button>
            </div>

            <div className="flex-1">
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                    <span className="text-white font-bold hover:underline cursor-pointer">u/{comment.author}</span>
                    <span>•</span>
                    <span>{new Date(comment.timestamp).toLocaleDateString()}</span>
                </div>
                <div className="text-sm text-gray-200 leading-relaxed">
                    {comment.content}
                </div>

                <div className="flex gap-4 mt-3">
                    <button
                        className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-gray-500 hover:text-neon-green transition-all bg-white/5 px-2 py-1 rounded border border-transparent hover:border-neon-green/30"
                        onClick={() => setShowReply(!showReply)}
                    >
                        <Reply size={12} />
                        Reply
                    </button>
                    <button className="text-[10px] uppercase font-bold text-gray-500 hover:text-white transition-all bg-white/5 px-2 py-1 rounded border border-transparent hover:border-white/20">Share</button>
                    <button className="text-[10px] uppercase font-bold text-gray-500 hover:text-white transition-all bg-white/5 px-2 py-1 rounded border border-transparent hover:border-white/20">Report</button>
                </div>

                {showReply && (
                    <div className="mt-3">
                        <textarea
                            className="cyber-input min-h-[100px] text-sm"
                            placeholder="What are your thoughts?"
                        />
                        <div className="flex justify-end gap-2 mt-2">
                            <button
                                className="text-xs text-gray-400 px-3 py-1 hover:text-white"
                                onClick={() => setShowReply(false)}
                            >
                                Cancel
                            </button>
                            <button className="btn-neon py-1 px-4 text-xs">
                                Reply
                            </button>
                        </div>
                    </div>
                )}

                {comment.replies && comment.replies.map(reply => (
                    <Comment key={reply.id} comment={reply} depth={depth + 1} />
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
        <div className="mt-8 border-t border-gray-800 pt-6">
            <div className="mb-6">
                <p className="text-xs text-gray-400 mb-2 font-bold tracking-tight">Comment as <span className="text-neon-green">{user?.name || 'User'}</span></p>
                <div className="border border-gray-800 rounded-lg overflow-hidden focus-within:border-neon-green shadow-[0_0_20px_rgba(0,0,0,0.4)] bg-black/40 transition-all">
                    <textarea
                        className="w-full bg-transparent p-4 text-sm text-white outline-none min-h-[120px] focus:bg-black/20 transition-all placeholder:text-gray-600"
                        placeholder="What are your thoughts?"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                    />
                    <div className="bg-white/5 px-4 py-3 flex justify-end border-t border-gray-800/50">
                        <button
                            className="btn-neon-solid py-2 px-8 text-xs"
                            disabled={!newComment.trim()}
                            onClick={handleAddComment}
                        >
                            POST COMMENT
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-2">
                {postComments.map(comment => (
                    <Comment key={comment.id} comment={comment} postId={postId} />
                ))}
            </div>
        </div>
    );
};

export default CommentSection;
