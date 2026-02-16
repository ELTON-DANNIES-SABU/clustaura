const axios = require('axios');

// Basic in-memory cache
let newsCache = {
    data: null,
    lastFetched: null
};

const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

// @desc    Get latest tech news
// @route   GET /api/news
// @access  Private
const getTechNews = async (req, res) => {
    try {
        const now = Date.now();

        // Return cached data if valid
        if (newsCache.data && newsCache.lastFetched && (now - newsCache.lastFetched < CACHE_DURATION)) {
            return res.json(newsCache.data);
        }

        const apiKey = process.env.NEWS_API_KEY;
        let news = [];

        if (apiKey && apiKey !== 'your_news_api_key_here') {
            // Fetch from NewsAPI (Technology category)
            const response = await axios.get('https://newsapi.org/v2/top-headlines', {
                params: {
                    category: 'technology',
                    language: 'en',
                    pageSize: 15,
                    apiKey: apiKey
                }
            });

            news = response.data.articles.map((article, index) => ({
                id: `news-api-${index}-${Date.now()}`,
                title: article.title,
                description: article.description || 'Check out the full story on the original source.',
                source: article.source.name,
                time: new Date(article.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                category: 'tech',
                url: article.url,
                imageUrl: article.urlToImage,
                trending: index < 5
            }));
        } else {
            // No API key - Fallback to a real-time public RSS feed processed by rss2json
            console.log('No News API key, fetching live tech news via RSS...');
            const rssFeedUrl = 'https://www.theverge.com/rss/index.xml';
            const response = await axios.get(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssFeedUrl)}`);

            if (response.data && response.data.items) {
                news = response.data.items.slice(0, 15).map((item, index) => ({
                    id: `news-rss-${index}-${Date.now()}`,
                    title: item.title,
                    description: item.description.replace(/<[^>]*>?/gm, '').substring(0, 200) + '...', // Strip HTML
                    source: 'The Verge',
                    time: new Date(item.pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    category: 'tech',
                    url: item.link,
                    imageUrl: item.thumbnail || item.enclosure?.link,
                    trending: index < 5
                }));
            }
        }

        if (news.length === 0) {
            // Only if both fail, we might return some very basic static data but the user wants REAL news.
            // Better to return 0 and handle in front, but news usually works via rss2json.
            throw new Error('No news could be fetched');
        }

        // Update cache
        newsCache.data = news;
        newsCache.lastFetched = now;

        res.json(news);
    } catch (error) {
        console.error('Error fetching real-time news:', error.message);
        res.status(500).json({ message: 'Error fetching real-time news' });
    }
};

// getMockTechNews has been removed to ensure only real-time news is displayed.

module.exports = {
    getTechNews
};
