import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import useCommunityStore from '../../store/communityStore';
import Feed from './Feed';
import PostDetail from './PostDetail';
import CreatePost from './CreatePost';
import CommunityLeftSidebar from './CommunityLeftSidebar';
import CommunityRightSidebar from './CommunityRightSidebar';
import './Community.css';

const Community = () => {
    const navigate = useNavigate();
    const { fetchCommunities, fetchPosts } = useCommunityStore();
    const [search, setSearch] = React.useState('');

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearch(value);
        fetchPosts(null, value);
    };

    const handleLogoClick = () => {
        navigate('/dashboard');
    };

    React.useEffect(() => {
        fetchCommunities();
        fetchPosts();
    }, [fetchCommunities, fetchPosts]);

    return (
        <div className="community-container">
            <header className="community-header">
                <div className="brand-logo" onClick={handleLogoClick} style={{ cursor: 'pointer', transform: 'scale(0.8)', transformOrigin: 'left center' }}>
                    <div className="brand-logo-container">
                        <div className="brand-logo-icon">
                            <div className="brand-logo-icon-inner">C</div>
                            <div className="brand-logo-icon-ring"></div>
                        </div>
                        <div className="brand-logo-text">CLUSTAURA</div>
                    </div>
                </div>

                <div className="search-wrapper">
                    <Search size={18} style={{ color: 'var(--node-green)' }} />
                    <input
                        type="text"
                        placeholder="Search posts, challenges, or tags..."
                        value={search}
                        onChange={handleSearchChange}
                    />
                </div>

                <div className="flex items-center gap-4">
                    {/* Placeholder for future header items */}
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