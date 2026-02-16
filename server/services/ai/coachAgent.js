/**
 * Communication Coach Agent (The Heart)
 * Responsibilities:
 * - Analyze comment threads for tone (Sentiment analysis mock)
 * - Detect unanswered questions
 * - Suggest better communication templates
 */

const analyzeThread = (comments) => {
    if (!comments || comments.length === 0) return { status: 'healthy', suggestions: [] };

    const suggestions = [];
    const questionCount = comments.filter(c => c.text.includes('?')).length;
    const answerCount = comments.length - questionCount; // Rough approx

    // 1. Detect Clarification Loops
    if (questionCount > 3 && answerCount < questionCount) {
        suggestions.push({
            type: 'CLARIFICATION_LOOP',
            message: 'High number of questions detected. Consider updating the ticket description with better Acceptance Criteria.'
        });
    }

    // 2. Unanswered Threads
    const lastComment = comments[comments.length - 1];
    const isLastQuestion = lastComment.text.includes('?');
    if (isLastQuestion && (Date.now() - new Date(lastComment.createdAt).getTime() > 24 * 60 * 60 * 1000)) {
        suggestions.push({
            type: 'UNANSWERED',
            message: 'The last question has been unanswered for over 24 hours.'
        });
    }

    // 3. Tone Check (Mocked keyword check)
    const urgentKeywords = ['asap', 'urgent', 'now', 'deadline'];
    const urgentCount = comments.filter(c => urgentKeywords.some(k => c.text.toLowerCase().includes(k))).length;

    if (urgentCount > 2) {
        suggestions.push({
            type: 'STRESS_DETECTED',
            message: 'Interaction seems stressed. Suggest a quick sync call to align.'
        });
    }

    return {
        status: suggestions.length > 0 ? 'needs_attention' : 'healthy',
        suggestions
    };
};

module.exports = {
    analyzeThread
};
