class ModerationService {
    constructor() {
        this.bannedWords = ['spam', 'abuse', 'hate', 'scam', 'violence']; // Simple list for MVP
    }

    checkContent(text) {
        if (!text) return { isSafe: true };

        const lowerText = text.toLowerCase();
        for (const word of this.bannedWords) {
            if (lowerText.includes(word)) {
                return {
                    isSafe: false,
                    reason: `Contains banned keyword: ${word}`
                };
            }
        }

        return { isSafe: true };
    }
}

module.exports = new ModerationService();
