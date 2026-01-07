import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowBigUp, ArrowBigDown, MessageSquare, Share2, Flag } from 'lucide-react';
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
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <p className="text-xl mb-4">Post not found</p>
                <button
                    className="text-neon-green hover:underline font-bold"
                    onClick={() => navigate('/community')}
                >
                    Return to home
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4">
            <button
                className="flex items-center gap-2 text-gray-400 hover:text-neon-green mb-6 transition-all font-bold text-xs uppercase tracking-widest bg-white/5 px-4 py-2 rounded border border-white/5 hover:border-neon-green/30"
                onClick={() => navigate('/community')}
            >
                <ArrowLeft size={16} />
                Back to Feed
            </button>

            <div className="bg-charcoal border border-gray-800 rounded-lg overflow-hidden shadow-2xl">
                <div className="flex">
                    <div className="bg-black/40 w-12 flex flex-col items-center py-6 gap-1 border-r border-gray-800">
                        <button
                            className={`vote-btn up ${post.userVote === 1 ? 'active' : ''}`}
                            onClick={() => vote(post.id, 1)}
                        >
                            <ArrowBigUp size={28} fill={post.userVote === 1 ? 'currentColor' : 'none'} />
                        </button>
                        <span className={`font-bold my-1 ${post.userVote === 1 ? 'text-neon-green' : post.userVote === -1 ? 'text-electric-blue' : 'text-gray-400'}`}>
                            {post.votes}
                        </span>
                        <button
                            className={`vote-btn down ${post.userVote === -1 ? 'active' : ''}`}
                            onClick={() => vote(post.id, -1)}
                        >
                            <ArrowBigDown size={28} fill={post.userVote === -1 ? 'currentColor' : 'none'} />
                        </button>
                    </div>

                    <div className="flex-1 p-8">
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4 font-mono">
                            <span className="text-neon-green font-bold">r/{post.communityId}</span>
                            <span>•</span>
                            <span>u/{post.author}</span>
                            <span>•</span>
                            <span>{new Date(post.timestamp).toLocaleDateString()}</span>
                        </div>

                        <h1 className="text-3xl font-bold mb-6 text-white tracking-tight">{post.title}</h1>

                        <div className="text-gray-300 leading-relaxed mb-8 whitespace-pre-wrap text-sm border-b border-gray-800 pb-8">
                            {post.content}
                        </div>

                        <div className="flex gap-4 text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded">
                                <MessageSquare size={14} />
                                {post.commentCount} Comments
                            </div>
                            {/* <button className="flex items-center gap-2 hover:text-white transition-colors bg-white/5 px-3 py-1.5 rounded border border-transparent hover:border-white/20">
                                <Share2 size={14} />
                                Share
                            </button>
                            <button className="flex items-center gap-2 hover:text-white transition-colors bg-white/5 px-3 py-1.5 rounded border border-transparent hover:border-white/20">
                                <Flag size={14} />
                                Report
                            </button> */}
                        </div>

                        <CommentSection postId={post.id} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PostDetail;
