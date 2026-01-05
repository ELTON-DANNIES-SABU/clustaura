import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Search, Plus } from 'lucide-react';
import useCommunityStore from '../../store/communityStore';
import Feed from './Feed';
import PostDetail from './PostDetail';
import CreatePost from './CreatePost';
import CommunityLeftSidebar from './CommunityLeftSidebar';
import CommunityRightSidebar from './CommunityRightSidebar';
import './Community.css';

const Community = () => {
    const navigate = useNavigate();
    const { communities, fetchCommunities, fetchPosts } = useCommunityStore();

    React.useEffect(() => {
        fetchCommunities();
        fetchPosts();
    }, [fetchCommunities, fetchPosts]);

    return (
        <div className="community-container">
            <header className="community-header">
                <div className="community-logo" onClick={() => navigate('/community')}>
                    CLUSTAURA <span className="text-white text-sm ml-2 opacity-80 tracking-normal font-sans">Community Challenges</span>
                </div>

                <div className="search-wrapper">
                    <Search size={18} className="text-neon-green" />
                    <input
                        type="text"
                        placeholder="Search challenges, solutions, or tags..."
                    />
                </div>

                <div className="flex items-center gap-4">
                    <button
                        className="btn-neon flex items-center gap-2"
                        onClick={() => navigate('/community/create')}
                    >
                        <Plus size={18} />
                        CREATE CHALLENGE
                    </button>
                    <div className="w-10 h-10 rounded-full bg-charcoal flex items-center justify-center font-bold text-neon-green cursor-pointer border border-neon-green shadow-lg">
                        U
                    </div>
                </div>
            </header>

            <main className="community-main">
                {/* Left Sidebar - Professions */}
                <aside className="hidden lg:block">
                    <CommunityLeftSidebar />
                </aside>

                {/* Center - Feed */}
                <div className="community-content">
                    <Routes>
                        <Route path="/" element={<Feed />} />
                        <Route path="/post/:postId" element={<PostDetail />} />
                        <Route path="/create" element={<CreatePost />} />
                    </Routes>
                </div>

                {/* Right Sidebar - Discovery */}
                <aside className="hidden xl:block">
                    <CommunityRightSidebar />
                </aside>
            </main>
        </div>
    );
};

export default Community;
