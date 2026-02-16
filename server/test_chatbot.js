const axios = require('axios');

async function testChatbot() {
    try {
        console.log('Sending test query to chatbot...');
        const response = await axios.post('http://localhost:5000/api/ai-guide/query', {
            query: 'how do i find experts?',
            currentPage: '/dashboard'
        });
        console.log('Response from chatbot:');
        console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error testing chatbot:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

testChatbot();
