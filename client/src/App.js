import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import Dashboard from './components/Dashboard';
import Challenges from './components/Challenges';
import PostFeed from './components/PostFeed';
import ChallengeDetail from './components/ChallengeDetail';
import Profile from './components/Profile';
import UserProfile from './components/UserProfile';
import Workplace from './components/Workplace';
import WorkplaceBoard from './components/WorkplaceBoard';
import Friends from './components/Friends';
import Chat from './components/Chat';
import Communication from './components/Communication';
import Community from './components/Community/Community';
import AIGuide from './components/AIGuide';
import AIPlanner from './components/Workplace/AIPlanner';
import GlobalCallManager from './components/GlobalCallManager';
import { ToastProvider } from './components/Community/shared/Toast';
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
        <ToastProvider>
            <Router>
                <NavigationHandler />
                <GlobalCallManager />
                <Routes>
                    <Route path="/" element={<Navigate to="/login" />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/posts" element={<PostFeed />} />
                    <Route path="/challenges" element={<Challenges />} />
                    <Route path="/challenge/:id" element={<ChallengeDetail />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/profile/:id" element={<UserProfile />} />
                    <Route path="/workplace" element={<Workplace />} />
                    <Route path="/workplace/project/:projectId/board" element={<WorkplaceBoard />} />
                    <Route path="/workplace/project/:projectId/ai-planner" element={<AIPlanner />} />
                    <Route path="/friends" element={<Friends />} />
                    <Route path="/chat/:friendId" element={<Chat />} />
                    <Route path="/communication" element={<Communication />} />
                    <Route path="/community/*" element={<Community />} />
                </Routes>
                <AIGuide />
            </Router>
        </ToastProvider>
    );
}

export default App;
