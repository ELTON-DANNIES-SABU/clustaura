import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

const TestAttempt = ({ testId, onFinish }) => {
    const [test, setTest] = useState(null);
    const [attempt, setAttempt] = useState(null);
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [loading, setLoading] = useState(true);
    const [responses, setResponses] = useState({}); // { questionId: { selectedOptions: [] } }
    const [isSaving, setIsSaving] = useState(false);
    const [result, setResult] = useState(null);
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
    const [alertConfig, setAlertConfig] = useState(null); // { message, type }
    const violationRef = useRef(0);

    useEffect(() => {
        startAttempt();
        setupAntiCheat();
        document.body.classList.add('exam-mode');
        return () => {
            removeAntiCheat();
            document.body.classList.remove('exam-mode');
        };
    }, []);

    const startAttempt = async () => {
        try {
            const userStr = localStorage.getItem('user');
            const userData = JSON.parse(userStr);
            const config = { headers: { Authorization: `Bearer ${userData.token}` } };

            // 1. Get Test Info
            const { data: testRes } = await axios.get(`/api/assessment/tests/${testId}`, config);
            setTest(testRes.data);

            // 2. Start Attempt
            const { data: attemptRes } = await axios.post(`/api/assessment/tests/${testId}/start`, {}, config);
            setAttempt(attemptRes.data);

            // 3. Set Timer (Simplified: duration from test)
            setTimeLeft(testRes.data.duration * 60);

            // 4. Populate existing responses if any
            if (attemptRes.data.answers) {
                const initialResponses = {};
                attemptRes.data.answers.forEach(ans => {
                    initialResponses[ans.questionId] = { selectedOptions: ans.selectedOptions };
                });
                setResponses(initialResponses);
            }

            setLoading(false);
        } catch (error) {
            console.error('Error starting test:', error);
            setLoading(false);
        }
    };

    const handleTabSwitch = useCallback(async () => {
        violationRef.current += 1;
        setAlertConfig({
            message: `Warning! Tab switching detected. Violation count: ${violationRef.current}`,
            type: 'warning'
        });
        await logViolation('tab-switch');
    }, [attempt]);

    const handleFullscreenChange = useCallback(async () => {
        if (!document.fullscreenElement) {
            await logViolation('exit-fullscreen');
        }
    }, [attempt]);

    const setupAntiCheat = useCallback(() => {
        window.addEventListener('blur', handleTabSwitch);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
    }, [handleTabSwitch, handleFullscreenChange]);

    const removeAntiCheat = useCallback(() => {
        window.removeEventListener('blur', handleTabSwitch);
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, [handleTabSwitch, handleFullscreenChange]);

    const logViolation = async (type) => {
        if (!attempt) return;
        try {
            const userStr = localStorage.getItem('user');
            const userData = JSON.parse(userStr);
            const config = { headers: { Authorization: `Bearer ${userData.token}` } };
            await axios.post(`/api/assessment/attempts/${attempt._id}/violation`, { type }, config);
        } catch (error) {
            console.error('Error logging violation:', error);
        }
    };

    const handleAnswerSelection = (optionIdx) => {
        const qId = currentQuestion?._id;
        if (!qId) return;

        setResponses(prev => ({
            ...prev,
            [qId]: { selectedOptions: [optionIdx] } // Assuming single choice for now based on MCQ logic
        }));
    };

    const handleClearResponse = () => {
        const qId = currentQuestion?._id;
        if (!qId) return;

        setResponses(prev => {
            const next = { ...prev };
            delete next[qId];
            return next;
        });
    };

    const handleSaveAndNext = async (goToNext = true) => {
        const qId = currentQuestion?._id;
        if (!qId || !attempt) return;

        setIsSaving(true);
        try {
            const userStr = localStorage.getItem('user');
            const userData = JSON.parse(userStr);
            const config = { headers: { Authorization: `Bearer ${userData.token}` } };

            const answer = responses[qId] || { selectedOptions: [] };

            const { data } = await axios.post(
                `/api/assessment/attempts/${attempt._id}/submit-answer`,
                {
                    questionId: qId,
                    selectedOptions: answer.selectedOptions
                },
                config
            );

            setAttempt(data.data); // Update synced attempt

            if (goToNext && currentQuestionIdx < allQuestions.length - 1) {
                setCurrentQuestionIdx(i => i + 1);
            } else if (!goToNext) {
                alert('Answer saved!');
            }
        } catch (error) {
            console.error('Error saving answer:', error);
            alert('Failed to save answer. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        if (timeLeft > 0) {
            const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
            return () => clearInterval(timer);
        } else if (timeLeft === 0 && !loading) {
            finalizeTest();
        }
    }, [timeLeft, loading]);

    const handleSubmitClick = () => {
        setShowSubmitConfirm(true);
    };

    const finalizeTest = async () => {
        if (!attempt) return;

        setIsSaving(true);
        setShowSubmitConfirm(false);
        try {
            const userStr = localStorage.getItem('user');
            const userData = JSON.parse(userStr);
            const config = { headers: { Authorization: `Bearer ${userData.token}` } };

            const { data } = await axios.post(`/api/assessment/attempts/${attempt._id}/finalize`, {}, config);
            setResult(data.data);
            removeAntiCheat();
        } catch (error) {
            console.error('Error submitting test:', error);
            setAlertConfig({ message: 'Failed to submit test. Please contact support.', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
    };

    if (loading) return <div className="test-loading">Preparing your assessment...</div>;

    if (result) {
        const percentage = Math.round((result.totalScore / result.testTotalMarks) * 100);
        const isPassed = result.totalScore >= result.passMarks;

        return (
            <div className="test-attempt-container result-screen">
                <div className="result-card">
                    <div className={`result-header ${isPassed ? 'passed' : 'failed'}`}>
                        <div className="result-icon">{isPassed ? '🏆' : '📚'}</div>
                        <h1>{isPassed ? 'Assessment Completed!' : 'Test Submitted'}</h1>
                        <p>{isPassed ? 'Congratulations on passing the evaluation.' : 'Thank you for completing the test.'}</p>
                    </div>

                    <div className="result-stats">
                        <div className="stat-item">
                            <span className="stat-label">Total Score</span>
                            <span className="stat-value">{result.totalScore} / {result.testTotalMarks}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Percentage</span>
                            <span className="stat-value">{percentage}%</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Status</span>
                            <span className={`stat-value status-badge ${isPassed ? 'passed' : 'failed'}`}>
                                {isPassed ? 'PASSED' : 'FAILED'}
                            </span>
                        </div>
                    </div>

                    <div className="result-footer">
                        <button className="btn-success" onClick={() => onFinish && onFinish()}>
                            Back to Dashboard
                        </button>
                    </div>
                </div>

                <style jsx>{`
                    .result-screen {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: radial-gradient(circle at center, #0a0a0f 0%, #050505 100%);
                    }
                    .result-card {
                        background: rgba(20, 20, 25, 0.8);
                        backdrop-filter: blur(20px);
                        border: 1px solid rgba(255, 255, 255, 0.05);
                        border-radius: 24px;
                        width: 100%;
                        max-width: 600px;
                        overflow: hidden;
                        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
                        animation: slideUp 0.6s cubic-bezier(0.23, 1, 0.32, 1);
                    }
                    @keyframes slideUp {
                        from { opacity: 0; transform: translateY(30px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    .result-header {
                        padding: 3rem 2rem;
                        text-align: center;
                    }
                    .result-header.passed { background: linear-gradient(180deg, rgba(0, 255, 163, 0.1) 0%, transparent 100%); }
                    .result-header.failed { background: linear-gradient(180deg, rgba(255, 71, 87, 0.1) 0%, transparent 100%); }
                    
                    .result-icon {
                        font-size: 4rem;
                        margin-bottom: 1rem;
                    }
                    .result-header h1 {
                        font-size: 2rem;
                        margin-bottom: 0.5rem;
                        color: #fff;
                    }
                    .result-header p {
                        color: #888;
                        font-size: 1.1rem;
                    }
                    .result-stats {
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 1px;
                        background: rgba(255, 255, 255, 0.05);
                        border-top: 1px solid rgba(255, 255, 255, 0.05);
                        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                    }
                    .stat-item {
                        background: #0d0d12;
                        padding: 2rem 1rem;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 0.5rem;
                    }
                    .stat-label {
                        font-size: 0.8rem;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        color: #666;
                        font-weight: 700;
                    }
                    .stat-value {
                        font-size: 1.25rem;
                        font-weight: 800;
                        color: #fff;
                    }
                    .status-badge.passed { color: var(--primary-mint); }
                    .status-badge.failed { color: #ff4757; }
                    
                    .result-footer {
                        padding: 2rem;
                        display: flex;
                        justify-content: center;
                    }
                `}</style>
            </div>
        );
    }

    const allQuestions = test?.sections?.reduce((acc, section) => [...acc, ...section.questions], []) || [];
    const currentQuestion = allQuestions[currentQuestionIdx];

    return (
        <div className="test-attempt-container">
            <header className="test-header">
                <div className="test-info">
                    <h2>{test?.title}</h2>
                    <span className="violation-badge">Violations: {violationRef.current}</span>
                </div>
                <div className="test-timer">
                    <span className="timer-icon">⏱️</span>
                    <span className="timer-text">{formatTime(timeLeft)}</span>
                </div>
                <button className="btn-success" onClick={handleSubmitClick}>Submit Test</button>
            </header>

            <div className="test-layout">
                <main className="question-area">
                    <div className="question-card">
                        <span className="q-number">Question {currentQuestionIdx + 1}</span>
                        <p className="q-text">{currentQuestion?.description}</p>

                        <div className="options-list">
                            {currentQuestion?.options.map((option, idx) => {
                                const isSelected = responses[currentQuestion?._id]?.selectedOptions?.includes(idx);
                                return (
                                    <button
                                        key={idx}
                                        className={`option-btn ${isSelected ? 'selected' : ''}`}
                                        onClick={() => handleAnswerSelection(idx)}
                                    >
                                        <span className="option-label">{String.fromCharCode(65 + idx)}</span>
                                        {option.text}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="action-bar">
                        <div className="left-actions">
                            <button
                                disabled={currentQuestionIdx === 0}
                                onClick={() => setCurrentQuestionIdx(i => i - 1)}
                                className="btn-nav"
                            >
                                <span className="nav-arrow">←</span> Previous
                            </button>
                            <button
                                className="btn-clear"
                                onClick={handleClearResponse}
                                disabled={!responses[currentQuestion?._id]}
                            >
                                Clear Response
                            </button>
                        </div>

                        <button
                            className="btn-primary btn-save-next"
                            onClick={() => handleSaveAndNext(true)}
                            disabled={isSaving}
                        >
                            {isSaving ? 'Saving...' : (currentQuestionIdx === allQuestions.length - 1 ? 'Save & Finish' : 'Save & Next')}
                        </button>

                        <button
                            disabled={currentQuestionIdx === allQuestions.length - 1}
                            onClick={() => setCurrentQuestionIdx(i => i + 1)}
                            className="btn-nav"
                        >
                            Next <span className="nav-arrow">→</span>
                        </button>
                    </div>
                </main>

                <aside className="question-palette">
                    <h3>Questions</h3>
                    <div className="palette-grid">
                        {allQuestions.map((q, idx) => {
                            const isCurrent = idx === currentQuestionIdx;
                            const isSaved = attempt?.answers?.some(ans => ans.questionId === q._id);

                            return (
                                <button
                                    key={idx}
                                    className={`palette-btn ${isCurrent ? 'active' : ''} ${isSaved ? 'saved' : ''}`}
                                    onClick={() => setCurrentQuestionIdx(idx)}
                                >
                                    {idx + 1}
                                </button>
                            );
                        })}
                    </div>
                </aside>
            </div>

            {/* Custom Modal Backdrop */}
            {(showSubmitConfirm || alertConfig) && <div className="modal-backdrop"></div>}

            {/* Submit Confirmation Modal */}
            {showSubmitConfirm && (
                <div className="custom-modal">
                    <div className="modal-header">
                        <h3>Confirm Submission</h3>
                    </div>
                    <div className="modal-body">
                        <p>Are you sure you want to end your test and submit your answers? You cannot change your responses after this.</p>
                    </div>
                    <div className="modal-actions">
                        <button className="btn-nav" onClick={() => setShowSubmitConfirm(false)}>Cancel</button>
                        <button className="btn-success" onClick={finalizeTest} disabled={isSaving}>
                            {isSaving ? 'Submitting...' : 'Yes, Submit Test'}
                        </button>
                    </div>
                </div>
            )}

            {/* Warning/Alert Modal */}
            {alertConfig && (
                <div className={`custom-modal alert-modal ${alertConfig.type}`}>
                    <div className="modal-header">
                        <h3>{alertConfig.type === 'error' ? 'Error' : 'Notification'}</h3>
                    </div>
                    <div className="modal-body text-center">
                        <p>{alertConfig.message}</p>
                    </div>
                    <div className="modal-actions">
                        <button
                            className={alertConfig.type === 'error' ? 'btn-clear' : 'btn-success'}
                            onClick={() => setAlertConfig(null)}
                        >
                            Got it
                        </button>
                    </div>
                </div>
            )}

            <style jsx>{`
                .test-attempt-container {
                    position: fixed;
                    top: 0;
                    right: 0;
                    bottom: 0;
                    left: 0;
                    background: #050505;
                    z-index: 1000;
                    display: flex;
                    flex-direction: column;
                    padding: 1.5rem;
                    color: #e0e0e0;
                    font-family: 'Inter', sans-serif;
                }

                .test-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: rgba(20, 20, 25, 0.8);
                    backdrop-filter: blur(10px);
                    padding: 0.75rem 2rem;
                    border-radius: 12px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    margin-bottom: 1.5rem;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
                }

                .test-info h2 {
                    font-size: 1.25rem;
                    font-weight: 700;
                    margin: 0;
                    background: linear-gradient(135deg, #fff, #888);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .test-timer {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    font-size: 1.5rem;
                    font-family: 'JetBrains Mono', monospace;
                    color: var(--primary-mint);
                    background: rgba(0, 255, 163, 0.05);
                    padding: 0.4rem 1.2rem;
                    border-radius: 50px;
                    border: 1px solid rgba(0, 255, 163, 0.2);
                }

                .test-layout {
                    flex: 1;
                    display: grid;
                    grid-template-columns: 1fr 340px;
                    gap: 1.5rem;
                    overflow: hidden;
                }

                .question-area {
                    background: rgba(15, 15, 20, 0.6);
                    border-radius: 20px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    padding: 2.5rem;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
                    height: 100%;
                    overflow: hidden;
                }

                .question-card {
                    flex: 1;
                    overflow-y: auto;
                    padding-right: 1rem;
                    margin-bottom: 2rem;
                }

                /* Custom scrollbar for professional look */
                .question-card::-webkit-scrollbar {
                    width: 6px;
                }
                .question-card::-webkit-scrollbar-track {
                    background: transparent;
                }
                .question-card::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .question-card::-webkit-scrollbar-thumb:hover {
                    background: rgba(0, 255, 163, 0.3);
                }

                .q-number {
                    color: var(--primary-mint);
                    font-size: 0.9rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    margin-bottom: 1.5rem;
                    display: inline-block;
                }

                .q-text {
                    font-size: 1.4rem;
                    font-weight: 500;
                    line-height: 1.5;
                    margin-bottom: 3rem;
                    color: #ffffff;
                }

                .options-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    margin-bottom: 2rem;
                }

                .option-btn {
                    padding: 1.25rem 1.5rem;
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 12px;
                    color: #b0b0b0;
                    text-align: left;
                    cursor: pointer;
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    align-items: center;
                    font-size: 1rem;
                }

                .option-btn:hover {
                    background: rgba(255, 255, 255, 0.05);
                    border-color: rgba(0, 255, 163, 0.3);
                    transform: translateX(5px);
                    color: #fff;
                }

                .option-btn.selected {
                    background: rgba(0, 255, 163, 0.08);
                    border-color: var(--primary-mint);
                    color: var(--primary-mint);
                    box-shadow: 0 0 20px rgba(0, 255, 163, 0.1);
                }

                .option-label {
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 1.5px solid currentColor;
                    border-radius: 8px;
                    margin-right: 1.25rem;
                    font-weight: 700;
                    font-size: 0.9rem;
                    flex-shrink: 0;
                }

                .option-btn.selected .option-label {
                    background: var(--primary-mint);
                    color: #000;
                    border-color: var(--primary-mint);
                }

                .action-bar {
                    flex-shrink: 0;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 1.5rem;
                    padding-top: 2rem;
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                    background: inherit;
                }

                .left-actions {
                    display: flex;
                    gap: 0.75rem;
                }

                .btn-nav, .btn-clear {
                    padding: 0.8rem 1.25rem;
                    border-radius: 10px;
                    font-weight: 600;
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .btn-nav {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: #888;
                }

                .btn-nav:hover:not(:disabled) {
                    background: rgba(255, 255, 255, 0.1);
                    color: #fff;
                    border-color: rgba(255, 255, 255, 0.2);
                }

                .btn-clear {
                    background: transparent;
                    border: 1px solid rgba(255, 71, 87, 0.2);
                    color: #ff4757;
                }

                .btn-clear:hover:not(:disabled) {
                    background: rgba(255, 71, 87, 0.1);
                    border-color: #ff4757;
                }

                .btn-save-next {
                    flex: 1;
                    padding: 1rem;
                    background: linear-gradient(135deg, var(--primary-mint), #00d4a3);
                    color: #000;
                    border: none;
                    border-radius: 12px;
                    font-weight: 700;
                    font-size: 1rem;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    cursor: pointer;
                    transition: all 0.3s;
                    box-shadow: 0 4px 15px rgba(0, 255, 163, 0.2);
                }

                .btn-save-next:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(0, 255, 163, 0.4);
                }

                .btn-nav:disabled, .btn-clear:disabled, .btn-save-next:disabled {
                    opacity: 0.3;
                    cursor: not-allowed;
                    transform: none !important;
                }

                .question-palette {
                    background: rgba(20, 20, 25, 0.6);
                    border-radius: 20px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    padding: 2rem;
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                }

                .question-palette h3 {
                    font-size: 1.1rem;
                    font-weight: 700;
                    margin-bottom: 1.5rem;
                    color: #888;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .palette-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(45px, 1fr));
                    gap: 0.75rem;
                    overflow-y: auto;
                    padding-right: 0.5rem;
                }

                .palette-grid::-webkit-scrollbar {
                    width: 4px;
                }
                .palette-grid::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }

                .palette-btn {
                    aspect-ratio: 1;
                    border-radius: 10px;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    background: rgba(255, 255, 255, 0.03);
                    color: #666;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.9rem;
                }

                .palette-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: #fff;
                }

                .palette-btn.active {
                    background: transparent;
                    border-color: var(--primary-mint);
                    color: var(--primary-mint);
                    box-shadow: inset 0 0 10px rgba(0, 255, 163, 0.1);
                    transform: scale(1.1);
                }

                .palette-btn.saved {
                    background: var(--primary-mint);
                    border-color: var(--primary-mint);
                    color: #000;
                }

                .violation-badge {
                    background: rgba(255, 71, 87, 0.15);
                    color: #ff4757;
                    padding: 0.4rem 0.8rem;
                    border-radius: 8px;
                    font-size: 0.8rem;
                    font-weight: 700;
                    margin-left: 1.5rem;
                    border: 1px solid rgba(255, 71, 87, 0.3);
                }

                .btn-success {
                    background: #fff;
                    color: #000;
                    border: none;
                    padding: 0.6rem 1.5rem;
                    border-radius: 8px;
                    font-weight: 700;
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-success:hover {
                    background: var(--primary-mint);
                    transform: translateY(-1px);
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                }

                /* Custom Modals */
                .modal-backdrop {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.8);
                    backdrop-filter: blur(8px);
                    z-index: 2000;
                    animation: fadeIn 0.3s ease;
                }

                .custom-modal {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: #141419;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                    width: 90%;
                    max-width: 450px;
                    padding: 2rem;
                    z-index: 2001;
                    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
                    animation: slideIn 0.4s cubic-bezier(0.23, 1, 0.32, 1);
                }

                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideIn { from { opacity: 0; transform: translate(-50%, -40%); } to { opacity: 1; transform: translate(-50%, -50%); } }

                .modal-header h3 {
                    font-size: 1.25rem;
                    color: #fff;
                    margin-bottom: 1rem;
                }

                .modal-body p {
                    color: #888;
                    line-height: 1.6;
                    margin-bottom: 2rem;
                }

                .modal-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                }

                .alert-modal.warning {
                    border-color: rgba(255, 171, 0, 0.3);
                }
                .alert-modal.warning .modal-header h3 {
                    color: #ffab00;
                }

                .text-center { text-align: center; }
            `}</style>
        </div>
    );
};

export default TestAttempt;
