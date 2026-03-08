import React, { useState } from 'react';
import axios from 'axios';

const QuestionBuilder = ({ testId, onQuestionAdded }) => {
    const [questionData, setQuestionData] = useState({
        title: '',
        description: '',
        type: 'MCQ',
        marks: 5,
        options: [
            { text: '', isCorrect: true },
            { text: '', isCorrect: false }
        ]
    });

    const handleAddOption = () => {
        setQuestionData({
            ...questionData,
            options: [...questionData.options, { text: '', isCorrect: false }]
        });
    };

    const handleOptionChange = (idx, text) => {
        const newOptions = [...questionData.options];
        newOptions[idx].text = text;
        setQuestionData({ ...questionData, options: newOptions });
    };

    const handleCorrectToggle = (idx) => {
        const newOptions = questionData.options.map((opt, i) => ({
            ...opt,
            isCorrect: i === idx
        }));
        setQuestionData({ ...questionData, options: newOptions });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const userStr = localStorage.getItem('user');
            const userData = JSON.parse(userStr);
            const config = { headers: { Authorization: `Bearer ${userData.token}` } };

            // 1. Create Question
            const { data } = await axios.post('/api/assessment/questions', questionData, config);

            // 2. Add to Test (This would need a backend route to update test sections)
            // For now, assume creator adds it to a temporary list or the backend handles it.

            alert('Question created!');
            onQuestionAdded && onQuestionAdded(data.data);
            setQuestionData({
                title: '',
                description: '',
                type: 'MCQ',
                marks: 5,
                options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }]
            });
        } catch (error) {
            console.error('Error adding question:', error);
        }
    };

    return (
        <div className="question-builder">
            <h4>Add Question</h4>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Question text</label>
                    <textarea
                        value={questionData.description}
                        onChange={(e) => setQuestionData({ ...questionData, description: e.target.value })}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Type</label>
                    <select value={questionData.type} onChange={(e) => setQuestionData({ ...questionData, type: e.target.value })}>
                        <option value="MCQ">Multiple Choice</option>
                        <option value="Coding">Coding</option>
                    </select>
                </div>

                {questionData.type === 'MCQ' && (
                    <div className="options-builder">
                        <label>Options</label>
                        {questionData.options.map((opt, idx) => (
                            <div key={idx} className="option-row">
                                <input
                                    type="radio"
                                    name="correct"
                                    checked={opt.isCorrect}
                                    onChange={() => handleCorrectToggle(idx)}
                                />
                                <input
                                    type="text"
                                    value={opt.text}
                                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                                    placeholder={`Option ${idx + 1}`}
                                />
                            </div>
                        ))}
                        <button type="button" onClick={handleAddOption} className="btn-secondary">Add Option</button>
                    </div>
                )}

                <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>Save Question</button>
            </form>

            <style jsx>{`
                .question-builder {
                    background: var(--bg-surface);
                    padding: 1.5rem;
                    border-radius: var(--radius-md);
                    border: 1px solid var(--border-primary);
                    margin-top: 2rem;
                }
                .option-row {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 0.5rem;
                }
                .option-row input[type="text"] {
                    flex: 1;
                    padding: 0.5rem;
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-primary);
                    color: var(--text-primary);
                }
            `}</style>
        </div>
    );
};

export default QuestionBuilder;
