import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowBigUp, ArrowBigDown, MessageSquare } from 'lucide-react';
import useCommunityStore from '../../store/communityStore';
import CommentSection from './CommentSection';

const PostDetail = () => {
    const { postId } = useParams();
    const navigate = useNavigate();
    const { posts, vote, fetchComments } = useCommunityStore();

    React.useEffect(() => {
        fetchComments(postId);
    }, [postId, fetchComments]);

    const post = posts.find(p => p.id === postId);

    if (!post) {
        return (
            <div className="community-container flex flex-col items-center justify-center min-h-[400px] text-gray-500">
                <p className="text-xl mb-4 font-bold">Post not found</p>
                <button
                    className="text-node-green hover:underline font-bold"
                    style={{ color: 'var(--node-green)' }}
                    onClick={() => navigate('/community')}
                >
                    Return to home
                </button>
            </div>
        );
    }

    const handleVote = (direction) => {
        vote(post.id, direction);
    };

    return (
        <div className="community-container max-w-4xl mx-auto p-6">
            <button
                className="flex items-center gap-2 text-gray-500 hover:text-white mb-8 transition-colors text-xs font-bold uppercase tracking-widest"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => navigate('/community')}
            >
                <ArrowLeft size={16} />
                Back to Feed
            </button>

            <div className="surface-panel rounded-xl overflow-hidden shadow-2xl border border-subtle" style={{ background: 'var(--surface-bg)', borderColor: 'var(--border-subtle)' }}>
                <div className="flex">
                    <div className="voting-sidebar flex flex-col items-center py-8 gap-2 border-r border-subtle" style={{ borderColor: 'var(--border-subtle)', width: '60px', background: 'rgba(0,0,0,0.2)' }}>
                        <button
                            className={`vote-btn up ${post.userVote === 1 ? 'active' : ''} text-gray-500 hover:text-node-green transition-colors`}
                            onClick={() => handleVote(1)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                            <ArrowBigUp size={28} fill={post.userVote === 1 ? "var(--node-green)" : "none"} color={post.userVote === 1 ? "var(--node-green)" : "currentColor"} />
                        </button>
                        <span className={`font-bold text-lg ${post.userVote !== 0 ? 'text-node-green' : 'text-gray-400'}`}>
                            {post.votes}
                        </span>
                        <button
                            className={`vote-btn down ${post.userVote === -1 ? 'active' : ''} text-gray-500 hover:text-node-green transition-colors`}
                            onClick={() => handleVote(-1)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                            <ArrowBigDown size={28} fill={post.userVote === -1 ? "var(--node-green)" : "none"} color={post.userVote === -1 ? "var(--node-green)" : "currentColor"} />
                        </button>
                    </div>

                    <div className="flex-1 p-10">
                        <div className="flex items-center gap-3 text-xs text-gray-500 mb-6 font-medium">
                            <span className="text-node-green font-bold uppercase tracking-widest" style={{ color: 'var(--node-green)' }}>r/{post.communityId}</span>
                            <span>•</span>
                            <span className="hover:text-white transition-colors cursor-pointer">u/{post.author}</span>
                            <span>•</span>
                            <span>{new Date(post.timestamp).toLocaleDateString()}</span>
                        </div>

                        <h1 className="text-3xl font-bold mb-6 text-white tracking-tight leading-tight">{post.title}</h1>

                        <div className="text-gray-300 leading-relaxed mb-10 whitespace-pre-wrap text-[15px] border-b border-subtle pb-10" style={{ borderColor: 'var(--border-subtle)' }}>
                            {post.content}
                        </div>

                        <div className="flex items-center gap-4 text-gray-500 font-bold uppercase tracking-widest text-[10px]">
                            <div className="flex items-center gap-2 bg-surface-hover px-4 py-2 rounded border border-subtle" style={{ background: 'var(--surface-hover)', borderColor: 'var(--border-subtle)' }}>
                                <MessageSquare size={16} />
                                {post.commentCount} Solutions & Comments
                            </div>
                        </div>

                        <div className="mt-12">
                            <CommentSection postId={post.id} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PostDetail;
