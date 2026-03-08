const axios = require('axios');

exports.getGuideResponse = async (req, res) => {
    try {
        const { query, currentPage } = req.body;

        if (!query) {
            return res.status(400).json({ msg: 'Query is required' });
        }

        console.log(`[AI Guide] Incoming query: "${query}" from page: ${currentPage}`);

        // Call the AI Engine (Python)
        const aiResponse = await axios.post('http://127.0.0.1:8000/guide/query', {
            query: query,
            current_page: currentPage
        });

        console.log(`[AI Guide] Response received from AI Engine:`, aiResponse.data);

        res.json(aiResponse.data);
    } catch (err) {
        console.error('[AI Guide ERROR]:', err.message);
        if (err.response) {
            console.error('[AI Guide ERROR] Response data:', err.response.data);
            return res.status(err.response.status).json(err.response.data);
        } else if (err.request) {
            console.error('[AI Guide ERROR] No response received from AI Engine');
            return res.status(503).json({ msg: 'AI Engine service unavailable' });
        }
        res.status(500).json({ msg: 'Server Error' });
    }
};
