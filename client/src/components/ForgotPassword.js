import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const ForgotPassword = () => {
    const location = useLocation();
    const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password
    const [email, setEmail] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        // Auto-fill email if passed from login page
        if (location.state && location.state.email) {
            setEmail(location.state.email);
        }
    }, [location.state]);

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to send OTP');
            }

            setMessage(data.message);
            setStep(2);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otpCode, newPassword }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Reset failed');
            }

            setMessage(data.message);
            // Optionally redirect after success
            setTimeout(() => {
                window.location.href = '/login';
            }, 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="layout-container">
            <div className="bg-grid" />
            <div className="floating-particle"></div>

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
                    <div className="auth-half form-half" style={{ margin: '0 auto', maxWidth: '500px' }}>
                        <div className="form-container">
                            <div className="form-header">
                                <h2 className="form-title h2">Reset Password</h2>
                                <p className="form-subtitle">
                                    {step === 1
                                        ? "Enter your registered email to receive an OTP."
                                        : "Enter the code sent to your Gmail and your new password."}
                                </p>
                            </div>

                            {error && (
                                <div className="alert alert-error">
                                    <span className="alert-icon">⚠️</span>
                                    <div>{error}</div>
                                </div>
                            )}

                            {message && (
                                <div className="alert alert-success">
                                    <span className="alert-icon">✓</span>
                                    <div>{message}</div>
                                </div>
                            )}

                            {step === 1 ? (
                                <form onSubmit={handleSendOTP}>
                                    <div className="form-group">
                                        <label className="form-label">USERNAME (GMAIL)</label>
                                        <div className="form-input-wrapper">
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="form-input"
                                                placeholder="example@gmail.com"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="btn-group">
                                        <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                                            {loading ? 'SENDING...' : 'SEND OTP'}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <form onSubmit={handleResetPassword}>
                                    <div className="form-group">
                                        <label className="form-label">6-DIGIT OTP CODE</label>
                                        <div className="form-input-wrapper">
                                            <input
                                                type="text"
                                                value={otpCode}
                                                onChange={(e) => setOtpCode(e.target.value)}
                                                className="form-input"
                                                placeholder="Enter 6-digit code"
                                                maxLength="6"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">NEW PASSWORD</label>
                                        <div className="form-input-wrapper">
                                            <input
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="form-input"
                                                placeholder="Min. 6 characters"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">CONFIRM PASSWORD</label>
                                        <div className="form-input-wrapper">
                                            <input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="form-input"
                                                placeholder="Repeat new password"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="btn-group">
                                        <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                                            {loading ? 'RESETTING...' : 'RESET PASSWORD'}
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-secondary btn-full"
                                            onClick={() => setStep(1)}
                                            style={{ marginTop: '10px' }}
                                        >
                                            RE-ENTER EMAIL
                                        </button>
                                    </div>
                                </form>
                            )}

                            <div className="form-footer">
                                Remembered your password?
                                <Link to="/login" className="form-footer-link">Sign in</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ForgotPassword;
