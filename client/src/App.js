import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Challenges from './components/Challenges';
import PostFeed from './components/PostFeed';
import ChallengeDetail from './components/ChallengeDetail';
import Profile from './components/Profile';
import UserProfile from './components/UserProfile';
import Workplace from './components/Workplace';
import WorkplaceBoard from './components/WorkplaceBoard';
import Backlog from './components/Workplace/Backlog';
import Timeline from './components/Workplace/Timeline';
import Friends from './components/Friends';
import Chat from './components/Chat';
import Communication from './components/Communication';
import Community from './components/Community/Community';
import AIGuide from './components/AIGuide';
import GlobalCallManager from './components/GlobalCallManager';
import './styles.css';

// Create a navigation hook component
const NavigationHandler = () => {
    const navigate = useNavigate();

    // Make navigate available globally for debugging
    if (typeof window !== 'undefined') {
        window.navigateTo = (path) => {
            console.log('Global navigation to:', path);
            navigate(path);
        };
    }

    return null;
};

function App() {
    return (
        <Router>
            <NavigationHandler />
            <GlobalCallManager />
            <Routes>
                <Route path="/" element={<Navigate to="/login" />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/posts" element={<PostFeed />} />
                <Route path="/challenges" element={<Challenges />} />
                <Route path="/challenge/:id" element={<ChallengeDetail />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/:id" element={<UserProfile />} />
                <Route path="/workplace" element={<Workplace />} />
                <Route path="/workplace/project/:projectId/board" element={<WorkplaceBoard />} />
                <Route path="/workplace/project/:projectId/backlog" element={<Backlog />} />
                <Route path="/workplace/project/:projectId/timeline" element={<Timeline />} />
                <Route path="/friends" element={<Friends />} />
                <Route path="/chat/:friendId" element={<Chat />} />
                <Route path="/communication" element={<Communication />} />
                <Route path="/community/*" element={<Community />} />
            </Routes>
            <AIGuide />
        </Router>
    );
}

export default App;
