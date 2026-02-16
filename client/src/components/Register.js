
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        agreeTerms: false
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const steps = [
        { number: 1, label: 'Personal Info', description: 'Basic information' },
        { number: 2, label: 'Account Setup', description: 'Security details' },
        { number: 3, label: 'Complete', description: 'Finalize registration' }
    ];

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        setError('');
    };

    const validateStep = () => {
        if (step === 1) {
            if (!formData.firstName.trim() || !formData.lastName.trim()) {
                setError('First and Last name are required');
                return false;
            }
            if (!formData.email.trim()) {
                setError('Email address is required');
                return false;
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                setError('Please enter a valid email address');
                return false;
            }
            return true;
        } else if (step === 2) {
            if (formData.password.length < 8) {
                setError('Password must be at least 8 characters long');
                return false;
            }
            if (formData.password !== formData.confirmPassword) {
                setError('Passwords do not match');
                return false;
            }
            if (!formData.agreeTerms) {
                setError('You must agree to the Terms & Conditions');
                return false;
            }
            return true;
        }
        return true;
    };

    const handleNext = () => {
        if (validateStep()) {
            if (step < 3) {
                setStep(step + 1);
                setError('');
            } else {
                handleSubmit();
            }
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
            setError('');
        } else {
            navigate('/login');
        }
    };


    const handleSubmit = async () => {
        setLoading(true);

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    password: formData.password
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            // Save user data to localStorage
            localStorage.setItem('user', JSON.stringify(data));
            localStorage.setItem('token', data.token);
            console.log('Registration successful, navigating to dashboard...');

            // Force navigation
            window.location.href = '/dashboard';

        } catch (err) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
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
                <div className="registration-container">
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
                                Join Our Network
                            </h1>

                            <p className="brand-description">
                                Create your professional profile and start
                                collaborating with innovators across all
                                disciplines. Build the future together with
                                our exclusive community.
                            </p>

                            {/* Progress Steps */}
                            <div className="progress-steps">
                                {steps.map((s) => (
                                    <div
                                        key={s.number}
                                        className={`progress-step ${step > s.number ? 'completed' : ''} ${step === s.number ? 'active' : ''}`}
                                    >
                                        <div className="step-indicator">
                                            {s.number}
                                        </div>
                                        <div className="step-label">{s.label}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="badge">
                                BUILD THE FUTURE TOGETHER
                            </div>
                        </div>
                    </div>

                    {/* Form Half */}
                    <div className="auth-half form-half">
                        <div className="form-container">
                            <div className="form-header">
                                <h2 className="form-title h2">Create Account</h2>
                                <p className="form-subtitle">
                                    Step {step} of {steps.length} • {steps[step - 1].label}
                                </p>
                            </div>

                            {error && (
                                <div className="alert alert-error">
                                    <span className="alert-icon">⚠️</span>
                                    <div>{error}</div>
                                </div>
                            )}

                            <form onSubmit={(e) => e.preventDefault()}>
                                {/* Step 1: Personal Information */}
                                {step === 1 && (
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label className="form-label">FIRST NAME</label>
                                            <div className="form-input-wrapper">
                                                <input
                                                    type="text"
                                                    name="firstName"
                                                    className="form-input"
                                                    value={formData.firstName}
                                                    onChange={handleChange}
                                                    required
                                                    autoFocus
                                                    placeholder="Enter your first name"
                                                />
                                            </div>
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">LAST NAME</label>
                                            <div className="form-input-wrapper">
                                                <input
                                                    type="text"
                                                    name="lastName"
                                                    className="form-input"
                                                    value={formData.lastName}
                                                    onChange={handleChange}
                                                    required
                                                    placeholder="Enter your last name"
                                                />
                                            </div>
                                        </div>

                                        <div className="form-group form-grid-full">
                                            <label className="form-label">EMAIL ADDRESS</label>
                                            <div className="form-input-wrapper">
                                                <input
                                                    type="email"
                                                    name="email"
                                                    className="form-input"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    required
                                                    placeholder="Enter your email address"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Step 2: Account Setup */}
                                {step === 2 && (
                                    <>
                                        <div className="form-grid form-grid-full">
                                            <div className="form-group">
                                                <label className="form-label">PASSWORD</label>
                                                <div className="form-input-wrapper">
                                                    <input
                                                        type="password"
                                                        name="password"
                                                        className="form-input"
                                                        value={formData.password}
                                                        onChange={handleChange}
                                                        required
                                                        placeholder="Create a strong password"
                                                    />
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label className="form-label">CONFIRM PASSWORD</label>
                                                <div className="form-input-wrapper">
                                                    <input
                                                        type="password"
                                                        name="confirmPassword"
                                                        className="form-input"
                                                        value={formData.confirmPassword}
                                                        onChange={handleChange}
                                                        required
                                                        placeholder="Confirm your password"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="terms-checkbox">
                                            <input
                                                type="checkbox"
                                                name="agreeTerms"
                                                id="agreeTerms"
                                                checked={formData.agreeTerms}
                                                onChange={handleChange}
                                            />
                                            <label htmlFor="agreeTerms" className="terms-text">
                                                I agree to the <a href="/terms">Terms & Conditions</a> and <a href="/privacy">Privacy Policy</a>.
                                            </label>
                                        </div>
                                    </>
                                )}

                                {/* Step 3: Completion */}
                                {step === 3 && (
                                    <div className="completion-state">
                                        <div className="completion-icon">
                                            <svg viewBox="0 0 100 100">
                                                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.2" />
                                                <path d="M30,50 L45,65 L70,35" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                        <h3 className="completion-title h3">Ready to Join!</h3>
                                        <p className="completion-message">
                                            Your profile is ready to be created. Click "Complete Registration"
                                            to join our exclusive network.
                                        </p>
                                        <div className="form-footer">
                                            Member ID: <strong>#{Math.floor(Math.random() * 10000) + 1000}</strong>
                                        </div>
                                    </div>
                                )}

                                {/* Navigation Buttons */}
                                <div className="nav-buttons">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={handleBack}
                                        disabled={loading}
                                    >
                                        {step === 1 ? 'BACK TO LOGIN' : 'GO BACK'}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={handleNext}
                                        disabled={loading}
                                    >
                                        {loading ? 'PROCESSING...' :
                                            step === 3 ? 'COMPLETE REGISTRATION' :
                                                'CONTINUE'}
                                    </button>
                                </div>
                            </form>

                            <div className="divider">
                                <span className="divider-text">OR SIGN UP WITH</span>
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
                                Already have an account?
                                <Link to="/login" className="form-footer-link">Sign in</Link>
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

export default Register;
