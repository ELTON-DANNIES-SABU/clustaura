
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        console.log('Login form submitted');

        // Simple validation
        if (!email || !password) {
            setError('Please fill in all fields');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),

            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            // Save to localStorage
            localStorage.setItem('user', JSON.stringify(data));
            localStorage.setItem('token', data.token);
            console.log('User saved, navigating to dashboard...');

            // Force navigation - multiple methods
            window.location.href = '/dashboard'; // This always works

        } catch (err) {
            console.error('Login error:', err);
            setError(err.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };


    const handleDemoLogin = () => {
        setEmail('demo@clustaura.com');
        setPassword('Demo@2024');

        // Auto-submit after setting credentials
        setTimeout(() => {
            const form = document.querySelector('form');
            if (form) {
                const submitEvent = new Event('submit', { cancelable: true });
                form.dispatchEvent(submitEvent);
            }
        }, 100);
    };

    // Direct navigation function
    const goToDashboard = () => {
        console.log('Direct navigation to dashboard');
        window.location.href = '/dashboard';
    };

    return (
        <div className="layout-container">
            {/* Background Animation */}
            <div className="bg-grid" />
            <div className="floating-particle"></div>
            <div className="floating-particle"></div>
            <div className="floating-particle"></div>

            {/* Header */}
            <header className="header">
                <div className="header-content">
                    <Link to="/" className="logo">
                        <div className="logo-icon">C</div>
                        <div className="logo-text">CLUSTAURA</div>
                    </Link>
                </div>
            </header>

            <main className="main-content">
                <div className="auth-container">
                    {/* Brand Half */}
                    <div className="auth-half brand-half">
                        <div className="brand-content">
                            <div className="brand-logo">
                                <div className="brand-logo-container">
                                    <div className="brand-logo-icon">
                                        <div className="brand-logo-icon-inner">C</div>
                                        <div className="brand-logo-icon-ring"></div>
                                    </div>
                                    <div className="brand-logo-text">CLUSTAURA</div>
                                </div>
                            </div>
                            <h1 className="brand-title h1">
                                Welcome Back
                            </h1>

                            <p className="brand-description">
                                Sign in to your account to continue collaborating
                                with top professionals across all disciplines. Access
                                exclusive features and premium networking
                                opportunities.
                            </p>

                            <div className="badge">
                                PREMIUM PROFESSIONAL NETWORK
                            </div>
                        </div>
                    </div>

                    {/* Form Half */}
                    <div className="auth-half form-half">
                        <div className="form-container">
                            <div className="form-header">
                                <h2 className="form-title h2">Sign In</h2>
                                <p className="form-subtitle">Access your professional dashboard</p>
                            </div>

                            {error && (
                                <div className="alert alert-error">
                                    <span className="alert-icon">⚠️</span>
                                    <div>{error}</div>
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label className="form-label">EMAIL ADDRESS</label>
                                    <div className="form-input-wrapper">
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="form-input"
                                            placeholder="Enter your email address"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">PASSWORD</label>
                                    <div className="form-input-wrapper">
                                        <div className="input-with-action">
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="form-input"
                                                placeholder="Enter your password"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <label className="checkbox-label">
                                        <input type="checkbox" />
                                        Remember me
                                    </label>
                                    <Link to="/forgot-password" className="form-link">
                                        Forgot Password?
                                    </Link>
                                </div>

                                <div className="btn-group">
                                    <button
                                        type="submit"
                                        className="btn btn-primary btn-full"
                                        disabled={loading}
                                    >
                                        {loading ? 'SIGNING IN...' : 'SIGN IN'}
                                    </button>

                                    <button
                                        type="button"
                                        className="btn btn-secondary btn-full"
                                        onClick={handleDemoLogin}
                                    >
                                        TRY DEMO ACCOUNT
                                    </button>
                                </div>
                            </form>

                            <div className="divider">
                                <span className="divider-text">OR CONTINUE WITH</span>
                            </div>

                            <div className="social-buttons">
                                <button type="button" className="social-btn">
                                    <span className="social-icon">G</span>
                                    Google
                                </button>
                                <button type="button" className="social-btn">
                                    <span className="social-icon">GH</span>
                                    GitHub
                                </button>
                                <button type="button" className="social-btn">
                                    <span className="social-icon">LN</span>
                                    LinkedIn
                                </button>
                            </div>

                            <div className="form-footer">
                                Don't have an account?
                                <Link to="/register" className="form-footer-link">Sign up</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="footer">
                <div className="footer-content">
                    <div className="footer-info">
                        <div className="footer-copyright">
                            © 2024 ClustAura Technologies, Inc. All rights reserved.
                        </div>
                        <div className="footer-links">
                            <a href="/terms" className="footer-link">Terms</a>
                            <a href="/privacy" className="footer-link">Privacy</a>
                            <a href="/cookies" className="footer-link">Cookies</a>
                            <a href="/contact" className="footer-link">Contact</a>
                        </div>
                    </div>
                    <div className="footer-legal">
                        ClustAura™ is a registered trademark. Patents pending.
                        This software is protected by copyright laws and international treaties.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Login;
