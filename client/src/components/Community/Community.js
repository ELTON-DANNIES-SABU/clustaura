import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Search, Plus, Home } from 'lucide-react';
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
    const [search, setSearch] = React.useState('');

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearch(value);
        // Debounce search ideally, but for now direct
        fetchPosts(null, value);
    };

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
                        value={search}
                        onChange={handleSearchChange}
                    />
                </div>

                <div className="flex items-center gap-4">
                    {/* <button
                        className="btn-icon-header"
                        onClick={() => navigate('/')}
                        title="Dashboard"
                    >
                        <Home size={22} />
                    </button> */}
                    {/* <button
                        className="btn-neon flex items-center gap-2"
                        onClick={() => navigate('/community/create')}
                    >
                        <Plus size={18} />
                        CREATE
                    </button> */}
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
