import { useNavigate, useLocation } from 'react-router-dom';
import useCommunityStore from '../../store/communityStore';
import { TrendingUp, MessageSquare } from 'lucide-react';
import RecommendedExperts from './RecommendedExperts';

const CommunityRightSidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { posts } = useCommunityStore();

    // Get trending challenges (e.g. posts with most comments or just newest)
    const challenges = posts.slice(0, 4);

    // Check if we are viewing a post
    const match = location.pathname.match(/\/community\/post\/(.+)/);
    const currentPostId = match ? match[1] : null;

    const handleInvite = (userId) => {
        alert(`Invite sent to expert ${userId}!`);
        // Implement actual invite logic here
    };

    return (
        <div className="community-sidebar-right flex flex-col gap-8">
            {/* Show Experts if on a post page */}
            {currentPostId && (
                <RecommendedExperts
                    challengeId={currentPostId}
                    onInvite={handleInvite}
                />
            )}

            <div className="community-sidebar-card p-8">
                <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-8 flex items-center gap-3">
                    <TrendingUp size={18} className="text-node-green" style={{ color: 'var(--node-green)' }} />
                    Trending Challenges
                </h3>
                <div className="flex flex-col gap-6">
                    {challenges.map((challenge) => (
                        <div
                            key={challenge.id}
                            className="group cursor-pointer border-b border-subtle pb-6 last:border-0 last:pb-0"
                            style={{ borderColor: 'var(--border-subtle)' }}
                            onClick={() => navigate(`/community/post/${challenge.id}`)}
                        >
                            <h4 className="text-[15px] font-bold text-gray-100 group-hover:text-node-green transition-colors mb-3 line-clamp-2 leading-snug">
                                {challenge.title}
                            </h4>
                            <div className="flex items-center gap-5 text-[11px] text-gray-500 font-bold uppercase tracking-widest">
                                <span className="flex items-center gap-1.5">
                                    <MessageSquare size={14} />
                                    {challenge.commentCount} solutions
                                </span>
                                <span>u/{challenge.author}</span>
                            </div>
                        </div>
                    ))}
                    {challenges.length === 0 && (
                        <p className="text-xs text-gray-500 italic">No trending challenges yet</p>
                    )}
                </div>
            </div>

            <div className="community-sidebar-card p-8" style={{ background: 'var(--surface-bg)', border: '1px solid var(--border-subtle)' }}>
                <h3 className="text-base font-bold text-white mb-3">Create a Challenge</h3>
                <p className="text-sm text-gray-400 mb-8 leading-relaxed">
                    Post a problem and collaborate with experts to find a solution.
                </p>
                <button
                    className="btn-primary w-full py-4 text-xs tracking-widest"
                    onClick={() => navigate('/community/create')}
                >
                    POST NEW CHALLENGE
                </button>
            </div>

            <div className="text-[11px] text-gray-600 px-4 flex flex-wrap gap-x-6 gap-y-3 uppercase tracking-widest font-bold">
                <a href="#" className="hover:text-gray-400 transition-colors">Privacy</a>
                <a href="#" className="hover:text-gray-400 transition-colors">Policies</a>
                <a href="#" className="hover:text-gray-400 transition-colors">Guidelines</a>
                <span>© 2026 Clustaura</span>
            </div>
        </div>
    );
};

export default CommunityRightSidebar;
