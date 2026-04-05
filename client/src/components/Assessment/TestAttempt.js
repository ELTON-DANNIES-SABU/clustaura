import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import * as tf from '@tensorflow/tfjs';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import '@mediapipe/face_mesh';
import MonacoEditor from './MonacoEditor';
import ReactMarkdown from 'react-markdown';

// We need @tensorflow/tfjs-backend-webgl manually initialized usually, but tfjs auto-loads it.

const TestAttempt = ({ testId, onFinish }) => {
    const [test, setTest] = useState(null);
    const [attempt, setAttempt] = useState(null);
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [timeLeft, setTimeLeft] = useState(null);
    const [loading, setLoading] = useState(true);
    const [responses, setResponses] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [result, setResult] = useState(null);
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
    const [alertConfig, setAlertConfig] = useState(null);
    const [proctoringWarning, setProctoringWarning] = useState(null);
    const [warningTimeout, setWarningTimeout] = useState(null);
    const violationRef = useRef(0);

    // Coding specific states
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('javascript');
    const [testResults, setTestResults] = useState(null);
    const [isRunningCode, setIsRunningCode] = useState(false);

    // AI Proctoring Refs & States
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const detectorRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const loopRef = useRef(null);

    const gazeAwayTicks = useRef(0);
    const multipleFaceTicks = useRef(0);
    const noiseTicks = useRef(0);
    const noFaceTicks = useRef(0);

    const [hasPermissions, setHasPermissions] = useState(false);
    const [proctorLoading, setProctorLoading] = useState(false);
    const [proctorMsg, setProctorMsg] = useState('');

    const allQuestions = test?.sections?.reduce((acc, section) => [...acc, ...section.questions], []) || [];
    const currentQuestion = allQuestions[currentQuestionIdx];

    useEffect(() => {
        // We do NOT start immediately anymore. Wait for permissions.
        return () => {
            removeAntiCheat();
            document.body.classList.remove('exam-mode');
            if (loopRef.current) clearInterval(loopRef.current);
            if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
            if (audioContextRef.current) audioContextRef.current.close();
        };
    }, []);

    const requestPermissions = async () => {
        setProctorLoading(true);
        setProctorMsg('Requesting Camera & Microphone access...');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            streamRef.current = stream;
            
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            audioContextRef.current = audioCtx;
            analyserRef.current = analyser;

            setProctorMsg('Loading AI Models (This may take a moment)...');
            await tf.setBackend('webgl');
            const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
            const detectorConfig = {
                runtime: 'mediapipe',
                solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh'
            };
            const detector = await faceLandmarksDetection.createDetector(model, detectorConfig);
            detectorRef.current = detector;

            setHasPermissions(true);
            // srcObject assignment moved to a dedicated useEffect
            startAttempt();
        } catch (e) {
            console.error('Proctoring Error:', e);
            alert('Camera and microphone access is strictly required for this assessment.');
            setProctorLoading(false);
        }
    };

    useEffect(() => {
        if (hasPermissions && attempt && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
            videoRef.current.play().catch(e => console.error("Video play error:", e));
            setupAntiCheat();
            document.body.classList.add('exam-mode');
            if (loopRef.current) clearInterval(loopRef.current);
            loopRef.current = setInterval(detectProctoring, 1500);
        }
    }, [hasPermissions, attempt]);

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

            // 3. Set Timer (Calculate based on start time if already in progress)
            const testDuration = parseInt(testRes.data.duration, 10) || 60;
            if (attemptRes.data.startTime) {
                const startTime = new Date(attemptRes.data.startTime).getTime();
                const now = Date.now();
                const elapsedSeconds = Math.floor((now - startTime) / 1000);
                const remainingSeconds = (testDuration * 60) - elapsedSeconds;
                setTimeLeft(remainingSeconds > 0 ? remainingSeconds : 0);
            } else {
                setTimeLeft(testDuration * 60);
            }

            // 4. Handle shuffled order and set test state
            const modifiedTest = { ...testRes.data };
            try {
                if (attemptRes.data.shuffledOrder && attemptRes.data.shuffledOrder.length > 0) {
                    // Flatten all questions and reorder them based on the stored shuffle
                    let questionsPool = [];
                    modifiedTest.sections.forEach(s => {
                        if (s.questions) questionsPool.push(...s.questions);
                    });
                    
                    const orderedQs = attemptRes.data.shuffledOrder.map(id => {
                        if (!id) return null;
                        return questionsPool.find(q => q && q._id && q._id.toString() === id.toString());
                    }).filter(q => q);

                    if (orderedQs.length > 0) {
                        modifiedTest.sections = [{ title: 'All Questions', questions: orderedQs }];
                    }
                }
            } catch (err) {
                console.error("Client-side Shuffle Error:", err);
                // Fallback: Test state already has the original sections from line 117
            }
            setTest(modifiedTest);

            // 5. Populate existing responses if any
            if (attemptRes.data.answers) {
                const initialResponses = {};
                attemptRes.data.answers.forEach(ans => {
                    if (ans.questionId) {
                        initialResponses[ans.questionId.toString()] = { 
                            selectedOptions: ans.selectedOptions || [],
                            codeResponse: ans.codeResponse,
                            textResponse: ans.textResponse
                        };
                    }
                });
                setResponses(initialResponses);
            }

            setLoading(false);
        } catch (error) {
            console.error('Error starting test:', error);
            alert(`Could not start the assessment: ${error.response?.data?.message || error.message}. Please refresh.`);
            setLoading(false);
        }
    };

    const logExpandedViolation = async (type, severity, duration) => {
        if (!attempt) return;
        try {
            const userStr = localStorage.getItem('user');
            const userData = JSON.parse(userStr);
            const config = { headers: { Authorization: `Bearer ${userData.token}` } };
            await axios.post(`/api/assessment/attempts/${attempt._id}/violation`, { type, severity, duration }, config);
        } catch (error) {
            console.error('Error logging violation:', error);
        }
    };

    const triggerWarning = (message, type = 'warning') => {
        setProctoringWarning({ message, type });
        if (warningTimeout) clearTimeout(warningTimeout);
        const timeout = setTimeout(() => setProctoringWarning(null), 5000);
        setWarningTimeout(timeout);
    };

    const detectProctoring = async () => {
        // Audio Analysis (Talking Detection)
        if (analyserRef.current) {
            const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
            analyserRef.current.getByteFrequencyData(dataArray);
            
            // Focus on 300Hz - 3000Hz range for human speech
            const sampleRate = audioContextRef.current.sampleRate;
            const binWidth = sampleRate / analyserRef.current.fftSize;
            const startBin = Math.floor(300 / binWidth);
            const endBin = Math.ceil(3000 / binWidth);
            
            let speechEnergy = 0;
            for (let i = startBin; i < endBin; i++) {
                speechEnergy += dataArray[i];
            }
            const avgSpeechEnergy = speechEnergy / (endBin - startBin);

            if (avgSpeechEnergy > 60) { // Increased sensitivity threshold from 45 to 60
                noiseTicks.current++;
            } else {
                noiseTicks.current = 0;
            }

            if (noiseTicks.current >= 5) { // Increased consecutive ticks from 2 to 5 (~2.5 seconds)
                triggerWarning('⚠ Talking detected! Please maintain silence.', 'warning');
                violationRef.current += 1;
                logExpandedViolation('TALKING', 'MEDIUM', 3);
                noiseTicks.current = 0;
            }
        }

        // Face & Gaze Detection
        if (detectorRef.current && videoRef.current && videoRef.current.readyState === 4) {
            try {
                const faces = await detectorRef.current.estimateFaces(videoRef.current);
                
                if (faces.length === 0) {
                    noFaceTicks.current++;
                    if (noFaceTicks.current >= 2) {
                        triggerWarning('⚠ Face not visible on screen!', 'warning');
                        violationRef.current += 1;
                        logExpandedViolation('FACE_NOT_VISIBLE', 'HIGH', 3);
                        noFaceTicks.current = 0;
                    }
                } else {
                    noFaceTicks.current = 0;
                }

                if (faces.length > 1) {
                    multipleFaceTicks.current++;
                    if (multipleFaceTicks.current >= 2) {
                        triggerWarning('⚠ Multiple faces detected!', 'error');
                        violationRef.current += 1;
                        logExpandedViolation('MULTIPLE_FACE', 'HIGH', 3);
                        multipleFaceTicks.current = 0;
                    }
                } else {
                    multipleFaceTicks.current = 0;
                }

                if (faces.length === 1) {
                    const keypoints = faces[0].keypoints;
                    if (keypoints && keypoints.length > 400) {
                        const nose = keypoints[1];
                        const leftEar = keypoints[234];
                        const rightEar = keypoints[454];

                        if (nose && leftEar && rightEar) {
                            const center = (leftEar.x + rightEar.x) / 2;
                            const offset = nose.x - center;
                            const width = rightEar.x - leftEar.x;
                            const ratio = offset / width;
                            
                            if (ratio < -0.15 || ratio > 0.15) {
                                gazeAwayTicks.current++;
                            } else {
                                gazeAwayTicks.current = 0;
                            }

                            if (gazeAwayTicks.current >= 2) {
                                triggerWarning('⚠ Please focus on the screen.', 'warning');
                                violationRef.current += 1;
                                logExpandedViolation('GAZE_AWAY', 'HIGH', 3);
                                gazeAwayTicks.current = 0;
                            }
                        }
                    }
                }
            } catch (err) {
                console.error("Detector Error:", err);
            }
        }
    };

    const handleTabSwitch = useCallback(async () => {
        violationRef.current += 1;
        triggerWarning('⚠ Warning! Tab switching detected.', 'error');
        await logExpandedViolation('TAB_SWITCH', 'LOW', 0);
    }, [attempt]);

    const handleFullscreenChange = useCallback(async () => {
        if (!document.fullscreenElement) {
            violationRef.current += 1;
            triggerWarning('⚠ Assessment must be in fullscreen!', 'error');
            await logExpandedViolation('EXIT_FULLSCREEN', 'LOW', 0);
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
                    selectedOptions: currentQuestion?.type === 'Coding' ? [] : answer.selectedOptions,
                    codeResponse: currentQuestion?.type === 'Coding' ? { code, language } : undefined,
                    testResults: currentQuestion?.type === 'Coding' ? testResults : undefined
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

    const handleRunCode = async () => {
        const qId = currentQuestion?._id;
        if (!qId || !attempt) return;

        setIsRunningCode(true);
        setTestResults(null);
        try {
            const userStr = localStorage.getItem('user');
            const userData = JSON.parse(userStr);
            const config = { headers: { Authorization: `Bearer ${userData.token}` } };

            const { data } = await axios.post(
                `/api/assessment/attempts/${attempt._id}/run-code`,
                { questionId: qId, code, language },
                config
            );

            setTestResults(data.data);
            
            const passCount = data.data.filter(r => r.status === 'PASS').length;
            if (passCount === data.data.length) {
                triggerWarning('✅ All visible test cases passed!', 'success');
            } else {
                triggerWarning(`⚠ ${passCount}/${data.data.length} test cases passed.`, 'warning');
            }
        } catch (error) {
            console.error('Error running code:', error);
            alert('Failed to run code. ' + (error.response?.data?.message || ''));
        } finally {
            setIsRunningCode(false);
        }
    };

    useEffect(() => {
        if (currentQuestion?.type === 'Coding') {
            const existingAnswer = attempt?.answers?.find(a => a.questionId.toString() === currentQuestion._id.toString());
            
            // Priority: If the current selected language has a saved answer, use it.
            // If the user just switched language, show the template for that language.
            if (existingAnswer?.codeResponse) {
                const savedCode = typeof existingAnswer.codeResponse === 'object' ? existingAnswer.codeResponse.code : existingAnswer.codeResponse;
                const savedLang = typeof existingAnswer.codeResponse === 'object' ? existingAnswer.codeResponse.language : 'javascript';
                
                if (savedLang === language) {
                    setCode(savedCode);
                    setTestResults(existingAnswer.testResults || null);
                } else {
                    // Language mismatch (user probably changed language from dropdown)
                    // Show template for the NEW language
                    setCode(currentQuestion.codingConfig?.languageTemplates?.[language] || '');
                    setTestResults(null);
                }
            } else {
                // No existing answer for this question yet
                setCode(currentQuestion.codingConfig?.languageTemplates?.[language] || '');
                setTestResults(null);
            }
        }
    }, [currentQuestionIdx, attempt, currentQuestion, language]);

    useEffect(() => {
        if (timeLeft !== null && timeLeft > 0 && attempt?.status === 'In-Progress') {
            const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
            return () => clearInterval(timer);
        } else if (timeLeft === 0 && !loading && attempt?.status === 'In-Progress') {
            finalizeTest();
        }
    }, [timeLeft, loading, attempt?.status]);

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

    if (!hasPermissions) {
        return (
            <div className="test-attempt-container result-screen">
                <div className="result-card" style={{ padding: '2rem', textAlign: 'center' }}>
                    <div className="result-header">
                        <h1>Security & Privacy Notice</h1>
                        <p style={{ marginTop: '1rem', color: '#888' }}>
                            This assessment uses an AI Proctoring system to ensure integrity. <br/><br/>
                            We require access to your Camera and Microphone to detect:
                            <br/>✔ Screen Focus / Gaze
                            <br/>✔ Multiple Faces
                            <br/>✔ High Background Noise
                            <br/>✔ Window Switching
                            <br/><br/>
                            <b>All AI processing acts locally on your device in real-time. No video or audio is ever recorded or uploaded to our servers.</b>
                        </p>
                        
                        {proctorLoading ? (
                            <div style={{ marginTop: '2rem', color: 'var(--accent-primary)', fontWeight: 'bold' }}>
                                <div className="spinner"></div>
                                <p>{proctorMsg}</p>
                            </div>
                        ) : (
                            <button className="btn-success" style={{ marginTop: '2rem' }} onClick={requestPermissions}>
                                Grant Access & Start Test
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

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
                        background: radial-gradient(circle at center, var(--bg-primary) 0%, #000 100%);
                        color: var(--text-primary);
                    }
                    .result-card {
                        background: var(--bg-surface);
                        backdrop-filter: blur(20px);
                        border: 1px solid var(--border-color);
                        border-radius: 24px;
                        width: 100%;
                        max-width: 600px;
                        overflow: hidden;
                        box-shadow: var(--shadow-xl);
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
                    .result-header.passed { background: linear-gradient(180deg, rgba(34, 197, 94, 0.1) 0%, transparent 100%); }
                    .result-header.failed { background: linear-gradient(180deg, rgba(239, 68, 68, 0.1) 0%, transparent 100%); }
                    
                    .result-icon {
                        font-size: 4rem;
                        margin-bottom: 1rem;
                    }
                    .result-header h1 {
                        font-size: 2rem;
                        margin-bottom: 0.5rem;
                        color: var(--text-primary);
                    }
                    .result-header p {
                        color: var(--text-secondary);
                        font-size: 1.1rem;
                    }
                    .result-stats {
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 1px;
                        background: var(--border-color);
                        border-top: 1px solid var(--border-color);
                        border-bottom: 1px solid var(--border-color);
                    }
                    .stat-item {
                        background: var(--bg-primary);
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
                        color: var(--text-tertiary);
                        font-weight: 700;
                    }
                    .stat-value {
                        font-size: 1.25rem;
                        font-weight: 800;
                        color: var(--text-primary);
                    }
                    .status-badge.passed { color: var(--success); }
                    .status-badge.failed { color: var(--error); }
                    
                    .result-footer {
                        padding: 2rem;
                        display: flex;
                        justify-content: center;
                    }
                `}</style>
            </div>
        );
    }


    return (
        <div className="test-attempt-container">
            {proctoringWarning && (
                <div className={`proctoring-notification-bar ${proctoringWarning.type}`}>
                    <span>{proctoringWarning.message}</span>
                </div>
            )}
            <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    width: '120px',
                    height: '90px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: '#000',
                    zIndex: 10,
                    objectFit: 'cover'
                }} 
            />
            <header className="test-header">
                <div className="test-info">
                    <h2>{test?.title}</h2>
                    <span className="violation-badge">Violations: {violationRef.current}</span>
                </div>
                <div className="test-timer">
                    <span className="timer-icon">⏱️</span>
                    <span className="timer-text">{timeLeft !== null ? formatTime(timeLeft) : 'Loading...'}</span>
                </div>
                <button className="btn-success" onClick={handleSubmitClick}>Submit Test</button>
            </header>

            <div className="test-layout">
                <main className="question-area">
                    <div className="question-card">
                        <span className="q-number">Question {currentQuestionIdx + 1}</span>
                        <div className="q-markdown-container">
                            <ReactMarkdown>{currentQuestion?.description}</ReactMarkdown>
                        </div>

                        <div className="options-list">
                            {currentQuestion?.type === 'Coding' ? (
                                <div className="coding-workspace">
                                    <div className="workspace-header">
                                        <select 
                                            value={language} 
                                            onChange={(e) => setLanguage(e.target.value)}
                                            className="lang-select"
                                        >
                                            <option value="javascript">JavaScript</option>
                                            <option value="python">Python</option>
                                        </select>
                                        <button 
                                            className="btn-run" 
                                            onClick={handleRunCode} 
                                            disabled={isRunningCode}
                                        >
                                            {isRunningCode ? 'Running...' : '▶ Run Code'}
                                        </button>
                                    </div>
                                    <MonacoEditor 
                                        language={language}
                                        value={code}
                                        onChange={(val) => setCode(val)}
                                        height="450px"
                                    />
                                    {testResults && (
                                        <div className="test-results-panel">
                                            <h4>Test Results</h4>
                                            <div className="results-list">
                                                {testResults.map((res, idx) => {
                                                    const isHidden = res.isVisible === false;
                                                    return (
                                                        <div key={idx} className={`result-item ${res.status.toLowerCase()}`}>
                                                            <div className="result-main">
                                                                <span className="status-label">{res.status}</span>
                                                                <span className="case-info">
                                                                    {isHidden ? `Hidden Case ${res.caseIndex || idx + 1}` : `Case ${idx + 1}: Input(${res.input}) → Expected(${res.expected}) | Got(${res.actual})`}
                                                                </span>
                                                            </div>
                                                            {res.error && <p className="error-text">{res.error}</p>}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                currentQuestion?.options.map((option, idx) => {
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
                                })
                            )}
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
                            onClick={() => currentQuestion?.type === 'Coding' ? handleSaveAndNext(true) : handleSaveAndNext(true)}
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
                .proctoring-notification-bar {
                    position: fixed;
                    top: 10px;
                    left: 50%;
                    transform: translateX(-50%);
                    padding: 12px 24px;
                    border-radius: 50px;
                    font-size: 1rem;
                    font-weight: 700;
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
                    animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .proctoring-notification-bar.warning { background: #fbbf24; color: #000; }
                .proctoring-notification-bar.error { background: #ef4444; color: #fff; }
                
                @keyframes slideDown {
                    from { transform: translate(-50%, -100%); opacity: 0; }
                    to { transform: translate(-50%, 0); opacity: 1; }
                }

                .test-attempt-container {
                    position: fixed;
                    top: 0;
                    right: 0;
                    bottom: 0;
                    left: 0;
                    background: var(--bg-primary);
                    z-index: 1000;
                    display: flex;
                    flex-direction: column;
                    padding: 1.5rem;
                    color: var(--text-primary);
                    font-family: var(--font-family-sans);
                }

                .test-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: var(--bg-surface);
                    backdrop-filter: blur(10px);
                    padding: 0.75rem 2rem;
                    border-radius: 12px;
                    border: 1px solid var(--border-color);
                    margin-bottom: 1.5rem;
                    box-shadow: var(--shadow-lg);
                }

                .test-info h2 {
                    font-size: 1.25rem;
                    font-weight: 700;
                    margin: 0;
                    color: var(--text-primary);
                }

                .test-timer {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--accent-primary);
                    background: rgba(0, 255, 163, 0.1);
                    padding: 0.4rem 1.2rem;
                    border-radius: 50px;
                    border: 1px solid var(--accent-primary);
                }

                .coding-workspace {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    background: var(--bg-secondary);
                    padding: 1.5rem;
                    border-radius: 16px;
                    border: 1px solid var(--border-color);
                }
                .workspace-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.5rem;
                }
                .lang-select {
                    padding: 0.5rem 1rem;
                    background: var(--bg-surface);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    color: var(--text-primary);
                    font-weight: 600;
                }
                .btn-run {
                    padding: 0.6rem 1.5rem;
                    background: var(--accent-primary);
                    color: #000;
                    border: none;
                    border-radius: 8px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .btn-run:hover { opacity: 0.9; transform: scale(1.02); }
                .btn-run:disabled { opacity: 0.5; cursor: not-allowed; }

                .test-results-panel {
                    margin-top: 1.5rem;
                    padding: 1.5rem;
                    background: #000;
                    border-radius: 12px;
                    border: 1px solid var(--border-color);
                }
                .test-results-panel h4 { margin-top: 0; color: var(--text-secondary); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px; }
                .results-list { display: flex; flex-direction: column; gap: 0.75rem; }
                .result-item { padding: 1rem; border-radius: 8px; border-left: 4px solid #444; background: rgba(255, 255, 255, 0.03); }
                .result-item.pass { border-left-color: var(--success); }
                .result-item.fail { border-left-color: var(--error); }
                .status-label { font-weight: 800; font-size: 0.8rem; margin-right: 1rem; }
                .pass .status-label { color: var(--success); }
                .fail .status-label { color: var(--error); }
                .case-info { font-family: monospace; font-size: 0.9rem; color: var(--text-secondary); }
                .error-text { color: var(--error); font-size: 0.85rem; margin-top: 0.5rem; font-family: monospace; }

                .test-layout {
                    flex: 1;
                    display: grid;
                    grid-template-columns: 1fr 340px;
                    gap: 1.5rem;
                    overflow: hidden;
                }

                .question-area {
                    background: var(--bg-surface);
                    border-radius: 20px;
                    border: 1px solid var(--border-color);
                    padding: 2.5rem;
                    display: flex;
                    flex-direction: column;
                    box-shadow: var(--shadow-md);
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
                    background: var(--border-color);
                    border-radius: 10px;
                }
                .question-card::-webkit-scrollbar-thumb:hover {
                    background: var(--accent-primary);
                }

                .q-number {
                    color: var(--accent-primary);
                    font-size: 0.85rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 3px;
                    margin-bottom: 2rem;
                    display: inline-block;
                    opacity: 0.9;
                }

                .q-markdown-container {
                    font-size: 1.1rem;
                    line-height: 1.6;
                    color: var(--text-primary);
                    margin-bottom: 3rem;
                }

                .q-markdown-container h3 {
                    color: var(--text-primary);
                    font-size: 1.4rem;
                    font-weight: 700;
                    margin-top: 2rem;
                    margin-bottom: 1rem;
                }

                .q-markdown-container h4 {
                    color: var(--text-secondary);
                    font-size: 1.1rem;
                    font-weight: 600;
                    margin-top: 1.5rem;
                }

                .q-markdown-container p {
                    margin-bottom: 1.2rem;
                }

                .q-markdown-container code {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 0.2rem 0.4rem;
                    border-radius: 4px;
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 0.9em;
                    color: var(--accent-primary);
                }

                .q-markdown-container ul {
                    margin-bottom: 1.5rem;
                    padding-left: 1.5rem;
                }

                .q-markdown-container li {
                    margin-bottom: 0.5rem;
                }

                .options-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    margin-bottom: 2rem;
                }

                .option-btn {
                    padding: 1.25rem 1.5rem;
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-color);
                    border-radius: 12px;
                    color: var(--text-secondary);
                    text-align: left;
                    cursor: pointer;
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    align-items: center;
                    font-size: 1rem;
                }

                .option-btn:hover {
                    background: var(--bg-surface);
                    border-color: var(--accent-primary);
                    transform: translateX(5px);
                    color: var(--text-primary);
                }

                .option-btn.selected {
                    background: rgba(0, 255, 163, 0.1);
                    border-color: var(--accent-primary);
                    color: var(--accent-primary);
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
                    background: var(--accent-primary);
                    color: #fff;
                    border-color: var(--accent-primary);
                }

                .action-bar {
                    flex-shrink: 0;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 1.5rem;
                    padding-top: 2rem;
                    border-top: 1px solid var(--border-color);
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
                    background: var(--bg-tertiary);
                    border: 1px solid var(--border-color);
                    color: var(--text-secondary);
                }

                .btn-nav:hover:not(:disabled) {
                    background: var(--bg-secondary);
                    color: var(--text-primary);
                    border-color: var(--border-color);
                }

                .btn-clear {
                    background: transparent;
                    border: 1px solid rgba(239, 68, 68, 0.2);
                    color: var(--error);
                }

                .btn-clear:hover:not(:disabled) {
                    background: rgba(239, 68, 68, 0.1);
                    border-color: var(--error);
                }

                .btn-save-next {
                    flex: 1;
                    padding: 1rem;
                    background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
                    color: #fff;
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
                    box-shadow: 0 8px 25px rgba(99, 102, 241, 0.4);
                }

                .btn-nav:disabled, .btn-clear:disabled, .btn-save-next:disabled {
                    opacity: 0.3;
                    cursor: not-allowed;
                    transform: none !important;
                }

                .question-palette {
                    background: var(--bg-surface);
                    border-radius: 20px;
                    border: 1px solid var(--border-color);
                    padding: 2rem;
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                }

                .question-palette h3 {
                    font-size: 1.1rem;
                    font-weight: 700;
                    margin-bottom: 1.5rem;
                    color: var(--text-tertiary);
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
                    background: var(--border-color);
                    border-radius: 10px;
                }

                .palette-btn {
                    aspect-ratio: 1;
                    border-radius: 10px;
                    border: 1px solid var(--border-color);
                    background: var(--bg-secondary);
                    color: var(--text-tertiary);
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.9rem;
                }

                .palette-btn:hover {
                    background: var(--bg-tertiary);
                    color: var(--text-primary);
                }

                .palette-btn.active {
                    background: transparent;
                    border-color: var(--accent-primary);
                    color: var(--accent-primary);
                    box-shadow: inset 0 0 10px rgba(99, 102, 241, 0.1);
                    transform: scale(1.1);
                }

                .palette-btn.saved {
                    background: var(--accent-primary);
                    border-color: var(--accent-primary);
                    color: #fff;
                }

                .violation-badge {
                    background: rgba(239, 68, 68, 0.1);
                    color: var(--error);
                    padding: 0.4rem 0.8rem;
                    border-radius: 8px;
                    font-size: 0.8rem;
                    font-weight: 700;
                    margin-left: 1.5rem;
                    border: 1px solid rgba(239, 68, 68, 0.3);
                }

                .btn-success {
                    background: var(--accent-primary);
                    color: #fff;
                    border: none;
                    padding: 0.6rem 1.5rem;
                    border-radius: 8px;
                    font-weight: 700;
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-success:hover {
                    background: var(--accent-secondary);
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
                    background: var(--bg-surface);
                    border: 1px solid var(--border-color);
                    border-radius: 20px;
                    width: 90%;
                    max-width: 450px;
                    padding: 2rem;
                    z-index: 2001;
                    box-shadow: var(--shadow-xl);
                    animation: slideIn 0.4s cubic-bezier(0.23, 1, 0.32, 1);
                }

                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideIn { from { opacity: 0; transform: translate(-50%, -40%); } to { opacity: 1; transform: translate(-50%, -50%); } }

                .modal-header h3 {
                    font-size: 1.25rem;
                    color: var(--text-primary);
                    margin-bottom: 1rem;
                }

                .modal-body p {
                    color: var(--text-secondary);
                    line-height: 1.6;
                    margin-bottom: 2rem;
                }

                .modal-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                }

                .alert-modal.warning {
                    border-color: var(--warning);
                }
                .alert-modal.warning .modal-header h3 {
                    color: var(--warning);
                }

                .text-center { text-align: center; }
            `}</style>
        </div>
    );
};

export default TestAttempt;
